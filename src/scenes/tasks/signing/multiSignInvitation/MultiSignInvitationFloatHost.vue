<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  EgAnchoredTooltip,
  EgIcon,
  EgToast,
  EgTooltip,
  closeAllAnchoredTooltips,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { clientPopupActive } from '@/scenes/tasks/shared/clientPopupActive';
import { signingBatchSelectModeActive } from '@/scenes/tasks/signing/batch/signingBatchFlowContext';
import MultiSignInvitationPanel from './MultiSignInvitationPanel.vue';
import { signingFlowRegistry } from '@/scenes/tasks/signing/signingFlowContext';
import {
  multiSignCollaborationModuleActive,
  pendingMultiSignInvitationCount,
  pendingMultiSignInvitations,
} from './multiSignInvitationStore';
import {
  MULTI_SIGN_INVITATION_PANEL_MAX_HEIGHT,
  MULTI_SIGN_INVITATION_PANEL_WIDTH,
} from './multiSignInvitation.constants';
import styles from './MultiSignInvitationFloatHost.module.css';

const { ui } = useAppI18n();

const anchoredRef = ref<{
  open?: { value: boolean } | boolean;
  openPanel?: () => void;
  close?: () => void;
} | null>(null);

/** 与 EgAnchoredTooltip @open/@close 同步；开/关唯一业务态。 */
const panelExpanded = ref(false);

const toastText = ref('');
const toastKeepMounted = ref(false);
const toastMotionActive = ref(false);

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let toastLeaveTimer: ReturnType<typeof setTimeout> | undefined;

/** 离开待签名后再进入时递增，强制 remount EgAnchoredTooltip（配合 v-if 清 teleport 残留）。 */
const floatMountGeneration = ref(0);
let floatHadBeenHidden = false;

const showFloat = computed(
  () =>
    pendingMultiSignInvitationCount.value > 0 &&
    multiSignCollaborationModuleActive.value &&
    !signingBatchSelectModeActive.value,
);

const invitationCount = computed(() => pendingMultiSignInvitationCount.value);

const triggerAriaLabel = computed(() =>
  ui('{count} multi-sign invitations')
    .replace('{count}', String(invitationCount.value)),
);

const triggerLabelParts = computed(() => {
  const placeholder = '__COUNT__';
  const full = ui('{count} multi-sign invitations').replace(
    '{count}',
    placeholder,
  );
  const [before = '', after = ''] = full.split(placeholder);
  return {
    before,
    count: String(invitationCount.value),
    after,
  };
});

function readDsOpen(): boolean {
  const openState = anchoredRef.value?.open;
  if (openState == null) {
    return false;
  }
  if (typeof openState === 'object' && 'value' in openState) {
    return openState.value;
  }
  return Boolean(openState);
}

function dismissPanel() {
  panelExpanded.value = false;
  anchoredRef.value?.close?.();
  void nextTick(() => {
    if (readDsOpen()) {
      panelExpanded.value = false;
      anchoredRef.value?.close?.();
    }
  });
}

function healDesyncBeforeOpen() {
  if (readDsOpen() && !panelExpanded.value) {
    panelExpanded.value = false;
    anchoredRef.value?.close?.();
  }
}

function openPanel() {
  if (!showFloat.value || clientPopupActive.value || panelExpanded.value) {
    return;
  }

  closeAllAnchoredTooltips();
  healDesyncBeforeOpen();

  const attemptOpen = (retriesLeft: number) => {
    requestAnimationFrame(() => {
      if (!showFloat.value || clientPopupActive.value || panelExpanded.value) {
        return;
      }

      healDesyncBeforeOpen();
      anchoredRef.value?.openPanel?.();

      void nextTick(() => {
        if (panelExpanded.value || readDsOpen()) {
          return;
        }
        if (retriesLeft > 0) {
          attemptOpen(retriesLeft - 1);
        }
      });
    });
  };

  attemptOpen(2);
}

/**
 * click-toggle=false：仅此 handler 开/关；须 stop 到 trigger，避免 DS 默认 click 双触发。
 * 与 ShellDebugLauncherAnchored / work.mdc §7.3 同模式。
 */
function onBadgeClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  if (clientPopupActive.value) {
    return;
  }

  if (panelExpanded.value) {
    dismissPanel();
    return;
  }

  openPanel();
}

function onPanelOpen() {
  panelExpanded.value = true;
}

function onPanelClose() {
  panelExpanded.value = false;
}

function readToastLeaveMs(): number {
  const probe = document.createElement('div');
  probe.className = 'motion-flotation';
  const anchor = document.querySelector('.app-preview') ?? document.documentElement;
  anchor.appendChild(probe);
  const seconds = Number.parseFloat(getComputedStyle(probe).transitionDuration);
  anchor.removeChild(probe);
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : 300;
}

function clearToastLeaveTimer() {
  if (toastLeaveTimer !== undefined) {
    clearTimeout(toastLeaveTimer);
    toastLeaveTimer = undefined;
  }
}

function syncToastEnter() {
  clearToastLeaveTimer();
  toastKeepMounted.value = true;
  toastMotionActive.value = false;
  nextTick(() => {
    requestAnimationFrame(() => {
      if (toastKeepMounted.value) {
        toastMotionActive.value = true;
      }
    });
  });
}

function hideToast() {
  toastMotionActive.value = false;
  const leaveMs = readToastLeaveMs();
  clearToastLeaveTimer();
  toastLeaveTimer = window.setTimeout(() => {
    toastKeepMounted.value = false;
    toastLeaveTimer = undefined;
  }, leaveMs);
}

function showToast(message: string) {
  toastText.value = message;
  syncToastEnter();
  if (toastTimer !== undefined) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    hideToast();
    toastTimer = undefined;
  }, 2400);
}

function onJoinInvitation(id: string) {
  const flow = signingFlowRegistry.value;
  if (!flow) {
    showToast(ui('Joined multi-sign room'));
    return;
  }

  const result = flow.requestJoinMultiSignInvitation(id);

  if (result === 'expired') {
    showToast(ui('Invitation expired'));
    if (pendingMultiSignInvitationCount.value === 0) {
      dismissPanel();
    }
    return;
  }

  if (result === 'shard-missing') {
    showToast(ui('Wallet Shard Not Imported'));
    return;
  }

  if (result === 'flow-unavailable') {
    showToast(ui('Joined multi-sign room'));
  }
}

watch(
  () => pendingMultiSignInvitationCount.value,
  (count) => {
    if (count === 0) {
      dismissPanel();
    }
  },
);

watch(clientPopupActive, () => {
  dismissPanel();
});

watch(signingBatchSelectModeActive, (active) => {
  if (active) {
    dismissPanel();
  }
});

watch(showFloat, (visible) => {
  if (!visible) {
    panelExpanded.value = false;
    closeAllAnchoredTooltips();
    floatHadBeenHidden = true;
    return;
  }

  if (floatHadBeenHidden) {
    panelExpanded.value = false;
    floatMountGeneration.value += 1;
    floatHadBeenHidden = false;
  }
});

onBeforeUnmount(() => {
  if (toastTimer !== undefined) clearTimeout(toastTimer);
  clearToastLeaveTimer();
  dismissPanel();
});
</script>

<template>
  <div
    v-if="showFloat"
    :class="[
      styles.overlayLayer,
      clientPopupActive && styles.overlayLayerUnderPopup,
    ]"
    data-app-client-float-host
  >
    <div :class="styles.floatAnchor" data-float-interactive>
      <EgAnchoredTooltip
        :key="floatMountGeneration"
        ref="anchoredRef"
        placement="top"
        align="end"
        trigger="click"
        panel-kind="flotation"
        width-mode="fixed"
        :width="MULTI_SIGN_INVITATION_PANEL_WIDTH"
        height-mode="fixed"
        :height="MULTI_SIGN_INVITATION_PANEL_MAX_HEIGHT"
        :click-toggle="false"
        boundary-selector=".app-preview"
        teleport-to=".app-preview"
        token-scope-class="desktopTokens"
        @open="onPanelOpen"
        @close="onPanelClose"
      >
        <span
          data-eds-trigger-metrics
          :class="styles.floatBadgeMetrics"
          @click.stop.prevent="onBadgeClick"
        >
          <EgTooltip
            :class="styles.floatBadge"
            panel-kind="popup"
            panel-radius="radius-full"
            width-mode="adaptive"
            height-mode="adaptive"
            :scrollable="false"
          >
            <button
              type="button"
              :class="styles.floatBadgeButton"
              :aria-label="triggerAriaLabel"
              :aria-expanded="panelExpanded"
              @click.stop.prevent="onBadgeClick"
            >
              <span :class="styles.floatBadgeIcon" aria-hidden="true">
                <EgIcon name="eds-completed" size="sm" />
              </span>
              <span :class="styles.floatBadgeLabel">
                {{ triggerLabelParts.before }}<span :class="styles.floatBadgeCount">{{ triggerLabelParts.count }}</span>{{ triggerLabelParts.after }}
              </span>
            </button>
          </EgTooltip>
        </span>

        <template #content>
          <MultiSignInvitationPanel
            :invitations="pendingMultiSignInvitations"
            @join="onJoinInvitation"
            @close="dismissPanel"
          />
        </template>
      </EgAnchoredTooltip>
    </div>

    <div
      v-if="toastKeepMounted"
      :class="[styles.toastHost, toastMotionActive && 'is-active']"
    >
      <div class="motion-flotation desktopTokens">
        <EgToast type="result" :text="toastText" />
      </div>
    </div>
  </div>
</template>
