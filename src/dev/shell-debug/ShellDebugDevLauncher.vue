<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  EgAnchoredPopover,
  EgIcon,
  EgTooltip,
} from '@eds/desktop-components';
import InspectDetailPanel from './inspect/InspectDetailPanel.vue';
import {
  clearInspectSelection,
  developerInspectActive,
  inspectPinnedInfo,
  setDeveloperInspectActive,
} from './inspect/developerInspectSession';
import styles from './ShellDebugLauncherAnchored.module.css';
import {
  SHELL_DEBUG_POPOVER_CHROME_HEIGHT,
  SHELL_DEBUG_POPOVER_MAX_HEIGHT,
  shellDebugPopoverContentMaxHeight,
} from './shellDebugPopover.constants';

const DEV_INSPECT_POPOVER_WIDTH = 360;
const REMINDER_POPOVER_EST_WIDTH = 220;
const POPOVER_MIN_HEIGHT = 360;
const POPOVER_MAX_HEIGHT = SHELL_DEBUG_POPOVER_MAX_HEIGHT;
const POPOVER_CHROME_HEIGHT = SHELL_DEBUG_POPOVER_CHROME_HEIGHT;
const popoverContentMaxHeight = shellDebugPopoverContentMaxHeight;
const BOUNDARY_MARGIN = 8;
const REMINDER_AUTO_DISMISS_MS = 2000;

type PopoverAlign = 'center' | 'end';

/** 右侧胶囊列：popover 与 trigger 右缘对齐，箭头落在 Dev 按钮上方。 */
const popoverAlign = ref<PopoverAlign>('end');
const triggerRef = ref<HTMLElement | null>(null);
const anchoredRef = ref<{ close?: () => void; open?: () => void } | null>(null);
const popoverExpanded = ref(false);
const pendingDeactivate = ref(false);
let reminderDismissTimer: ReturnType<typeof setTimeout> | undefined;
let deactivateTimer: ReturnType<typeof setTimeout> | undefined;

/** 与 AnchoredTooltip microFloat leave 时长对齐（默认约 300ms）。 */
const DEACTIVATE_AFTER_CLOSE_MS = 320;

const panelTitle = computed(() => inspectPinnedInfo.value?.label ?? '');
const pinnedInfo = computed(() => inspectPinnedInfo.value);
const isReminderState = computed(() => developerInspectActive.value && !inspectPinnedInfo.value);

function clearReminderDismissTimer() {
  if (reminderDismissTimer === undefined) return;
  clearTimeout(reminderDismissTimer);
  reminderDismissTimer = undefined;
}

function scheduleReminderDismiss() {
  clearReminderDismissTimer();
  if (!developerInspectActive.value || inspectPinnedInfo.value) return;

  reminderDismissTimer = setTimeout(() => {
    reminderDismissTimer = undefined;
    if (developerInspectActive.value && !inspectPinnedInfo.value) {
      anchoredRef.value?.close?.();
    }
  }, REMINDER_AUTO_DISMISS_MS);
}

function clearDeactivateTimer() {
  if (deactivateTimer === undefined) return;
  clearTimeout(deactivateTimer);
  deactivateTimer = undefined;
}

function finishDeactivate() {
  clearDeactivateTimer();
  pendingDeactivate.value = false;
  setDeveloperInspectActive(false);
  clearInspectSelection();
  const button = triggerRef.value?.querySelector('button');
  if (button instanceof HTMLElement) {
    button.blur();
  }
}

function scheduleFinishDeactivate() {
  clearDeactivateTimer();
  deactivateTimer = setTimeout(() => {
    deactivateTimer = undefined;
    finishDeactivate();
  }, DEACTIVATE_AFTER_CLOSE_MS);
}

function stopDeveloperInspect() {
  clearReminderDismissTimer();
  if (!developerInspectActive.value) return;

  if (popoverExpanded.value) {
    pendingDeactivate.value = true;
    anchoredRef.value?.close?.();
    return;
  }

  finishDeactivate();
}

function resolvePopoverAlign(forReminder = isReminderState.value): PopoverAlign {
  const metrics = triggerRef.value?.querySelector('[data-eds-trigger-metrics]');
  if (!(metrics instanceof HTMLElement)) {
    return 'end';
  }

  const popoverWidth = forReminder ? REMINDER_POPOVER_EST_WIDTH : DEV_INSPECT_POPOVER_WIDTH;
  const rect = metrics.getBoundingClientRect();
  const endAlignedLeft = rect.right - popoverWidth;
  const boundaryLeft = BOUNDARY_MARGIN;
  const boundaryRight = window.innerWidth - BOUNDARY_MARGIN;

  if (endAlignedLeft >= boundaryLeft && rect.right <= boundaryRight) {
    return 'end';
  }

  const centerLeft = rect.left + (rect.width - popoverWidth) / 2;
  if (centerLeft >= boundaryLeft && centerLeft + popoverWidth <= boundaryRight) {
    return 'center';
  }

  return 'end';
}

function syncPopoverAlign() {
  popoverAlign.value = resolvePopoverAlign();
}

function openDevPanel() {
  syncPopoverAlign();
  nextTick(() => {
    anchoredRef.value?.open?.();
  });
}

function onTriggerClick(event: MouseEvent, active: boolean, open: () => void) {
  event.preventDefault();
  event.stopPropagation();

  if (active || developerInspectActive.value) {
    stopDeveloperInspect();
    return;
  }

  clearInspectSelection();
  setDeveloperInspectActive(true);
  syncPopoverAlign();
  open();
}

function onPopoverOpen() {
  popoverExpanded.value = true;
  syncPopoverAlign();
  nextTick(() => {
    syncPopoverAlign();
  });
  if (isReminderState.value) {
    scheduleReminderDismiss();
  }
}

function onPopoverClose() {
  popoverExpanded.value = false;
  clearReminderDismissTimer();
  if (pendingDeactivate.value) {
    pendingDeactivate.value = false;
    scheduleFinishDeactivate();
  }
}

watch(
  () => inspectPinnedInfo.value,
  (info) => {
    clearReminderDismissTimer();
    if (!info || !developerInspectActive.value) return;
    openDevPanel();
  },
);

watch(developerInspectActive, (active) => {
  if (!active) {
    clearReminderDismissTimer();
  }
});

onMounted(() => {
  syncPopoverAlign();
});

onBeforeUnmount(() => {
  clearReminderDismissTimer();
  clearDeactivateTimer();
});
</script>

<template>
  <div ref="triggerRef">
    <EgAnchoredPopover
      ref="anchoredRef"
      placement="top"
      :align="popoverAlign"
      :width-mode="isReminderState ? 'adaptive' : 'fixed'"
      :width="isReminderState ? undefined : DEV_INSPECT_POPOVER_WIDTH"
      height-mode="adaptive"
      :max-height="isReminderState ? undefined : POPOVER_MAX_HEIGHT"
      :top-tool="Boolean(pinnedInfo)"
      :top-tool-title="panelTitle"
      top-tool-closable
      :close-on-scroll="false"
      teleport-to="body"
      boundary-selector="body"
      @open="onPopoverOpen"
      @close="onPopoverClose"
    >
      <template #trigger="{ active, onClick }">
        <span
          data-eds-trigger-metrics
          :class="[
            styles.triggerMetrics,
            developerInspectActive && styles.triggerMetricsDevActive,
          ]"
        >
          <EgTooltip
            :class="styles.launcherShell"
            panel-kind="popup"
            panel-radius="radius-full"
            width-mode="adaptive"
            height-mode="adaptive"
            :scrollable="false"
          >
            <button
              type="button"
              :class="[
                styles.launcherButton,
                developerInspectActive && styles.launcherButtonDevActive,
              ]"
              aria-label="Toggle developer inspect tools"
              :aria-pressed="developerInspectActive"
              :aria-expanded="active"
              @click.stop.prevent="onTriggerClick($event, active, onClick)"
            >
              <span :class="styles.launcherIcon" aria-hidden="true">
                <EgIcon name="eds-sign-hashtag" size="sm" />
              </span>
              <span :class="styles.launcherLabel">Dev</span>
            </button>
          </EgTooltip>
        </span>
      </template>

      <template #default>
        <div
          v-if="isReminderState"
          class="shell-debug-dev-inspect-hint"
          data-dev-inspect-panel
        >
          <InspectDetailPanel :info="null" embedded />
        </div>
        <div
          v-else
          class="shell-debug-popover-content shell-debug-dev-inspect-popover"
          :class="styles.popoverContent"
          data-dev-inspect-panel
          :style="{
            minHeight: `${POPOVER_MIN_HEIGHT - POPOVER_CHROME_HEIGHT}px`,
            maxHeight: `${popoverContentMaxHeight}px`,
          }"
        >
          <InspectDetailPanel :info="pinnedInfo" embedded />
        </div>
      </template>
    </EgAnchoredPopover>
  </div>
</template>
