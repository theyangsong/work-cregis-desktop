<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  EgAnchoredTooltip,
  EgIcon,
  EgPopover,
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
import { markShellDebugUiInteraction } from './installShellDebugFloatLayerGuard';
import { closeShellDebugLauncherPopovers } from './shellDebugLauncherPopovers';
import {
  SHELL_DEBUG_POPOVER_MAX_HEIGHT,
} from './shellDebugPopover.constants';

const DEV_INSPECT_POPOVER_WIDTH = 360;
const DEV_HINT_POPOVER_EST_WIDTH = 220;
const POPOVER_MAX_HEIGHT = SHELL_DEBUG_POPOVER_MAX_HEIGHT;
const BOUNDARY_MARGIN = 8;
const INSPECT_SCROLL_EPSILON = 2;

type PopoverAlign = 'center' | 'end';

/** 右侧胶囊列：popover 与 trigger 右缘对齐，箭头落在 Dev 按钮上方。 */
const popoverAlign = ref<PopoverAlign>('end');
const hintPopoverAlign = ref<PopoverAlign>('end');
const triggerRef = ref<HTMLElement | null>(null);
const anchorRef = ref<{ close?: () => void; openPanel?: () => void } | null>(null);
const popoverExpanded = ref(false);
const pendingDeactivate = ref(false);
let deactivateTimer: ReturnType<typeof setTimeout> | undefined;
let inspectScrollSlot: HTMLElement | null = null;
let inspectScrollPopover: HTMLElement | null = null;
let inspectScrollListener: (() => void) | undefined;
let inspectScrollResizeObserver: ResizeObserver | undefined;

/** 与 AnchoredTooltip microFloat leave 时长对齐（默认约 300ms）。 */
const DEACTIVATE_AFTER_CLOSE_MS = 320;

const panelTitle = computed(() => inspectPinnedInfo.value?.label ?? '');
const pinnedInfo = computed(() => inspectPinnedInfo.value);
const showIdleHintTooltip = computed(() => !developerInspectActive.value);

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
  if (!developerInspectActive.value) return;

  if (popoverExpanded.value) {
    pendingDeactivate.value = true;
    anchorRef.value?.close?.();
    return;
  }

  finishDeactivate();
}

function resolvePopoverAlign(popoverWidth: number): PopoverAlign {
  const metrics = triggerRef.value?.querySelector('[data-eds-trigger-metrics]');
  if (!(metrics instanceof HTMLElement)) {
    return 'end';
  }
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
  popoverAlign.value = resolvePopoverAlign(DEV_INSPECT_POPOVER_WIDTH);
  hintPopoverAlign.value = resolvePopoverAlign(DEV_HINT_POPOVER_EST_WIDTH);
}

/** 直接 openPanel，绕过 EgAnchoredPopover.onTriggerClick 里的 closeAllAnchoredTooltips。 */
function openDevPanel() {
  if (!inspectPinnedInfo.value) return;
  syncPopoverAlign();
  nextTick(() => {
    anchorRef.value?.openPanel?.();
  });
}

function onLauncherPointerDown(event: PointerEvent) {
  event.stopPropagation();
  markShellDebugUiInteraction();
}

function onTriggerClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  if (developerInspectActive.value) {
    stopDeveloperInspect();
    return;
  }

  closeShellDebugLauncherPopovers();
  clearInspectSelection();
  setDeveloperInspectActive(true);
}

function closeDevPanel() {
  anchorRef.value?.close?.();
}

function onPopoverOpen() {
  popoverExpanded.value = true;
  syncPopoverAlign();
  nextTick(() => {
    syncPopoverAlign();
    bindInspectScrollChrome();
  });
}

function onPopoverClose() {
  popoverExpanded.value = false;
  unbindInspectScrollChrome();
  if (pendingDeactivate.value) {
    pendingDeactivate.value = false;
    scheduleFinishDeactivate();
  }
}

function syncInspectDividerScrollState() {
  const slot = inspectScrollSlot;
  const popover = inspectScrollPopover;
  if (!slot || !popover) return;

  const canScroll = slot.scrollHeight - slot.clientHeight > INSPECT_SCROLL_EPSILON;
  const scrolled = slot.scrollTop > INSPECT_SCROLL_EPSILON;
  popover.classList.toggle('shell-debug-dev-inspect-scrolled', canScroll && scrolled);
}

function unbindInspectScrollChrome() {
  if (inspectScrollSlot && inspectScrollListener) {
    inspectScrollSlot.removeEventListener('scroll', inspectScrollListener);
  }
  inspectScrollResizeObserver?.disconnect();
  inspectScrollResizeObserver = undefined;
  inspectScrollSlot = null;
  inspectScrollPopover?.classList.remove('shell-debug-dev-inspect-scrolled');
  inspectScrollPopover = null;
  inspectScrollListener = undefined;
}

function bindInspectScrollChrome() {
  unbindInspectScrollChrome();

  nextTick(() => {
    const panel = document.querySelector('[data-dev-inspect-panel].shell-debug-dev-inspect-popover');
    if (!(panel instanceof HTMLElement)) return;

    const slot = panel.closest('[class*="contentSlotWithTopTool"]');
    const popover = panel.closest('.eds-popover');
    if (!(slot instanceof HTMLElement) || !(popover instanceof HTMLElement)) return;

    inspectScrollSlot = slot;
    inspectScrollPopover = popover;
    inspectScrollListener = () => syncInspectDividerScrollState();
    slot.addEventListener('scroll', inspectScrollListener, { passive: true });
    inspectScrollResizeObserver = new ResizeObserver(() => syncInspectDividerScrollState());
    inspectScrollResizeObserver.observe(slot);
    syncInspectDividerScrollState();
  });
}

function resetInspectScrollPosition() {
  if (!inspectScrollSlot) return;
  inspectScrollSlot.scrollTop = 0;
  syncInspectDividerScrollState();
}

watch(
  () => inspectPinnedInfo.value,
  (info) => {
    if (!info || !developerInspectActive.value) return;
    openDevPanel();
    nextTick(() => {
      bindInspectScrollChrome();
      resetInspectScrollPosition();
    });
  },
);

onMounted(() => {
  syncPopoverAlign();
});

onBeforeUnmount(() => {
  clearDeactivateTimer();
  unbindInspectScrollChrome();
});
</script>

<template>
  <div ref="triggerRef">
    <EgAnchoredTooltip
      placement="top"
      :align="hintPopoverAlign"
      trigger="hover"
      :disabled="!showIdleHintTooltip"
      :wrap-tooltip="false"
      :close-on-scroll="false"
      teleport-to="body"
      boundary-selector="body"
    >
      <span
        data-eds-trigger-metrics
        :class="[
          styles.triggerMetrics,
          developerInspectActive && styles.triggerMetricsDevActive,
        ]"
      >
        <EgAnchoredTooltip
          ref="anchorRef"
          placement="top"
          :align="popoverAlign"
          trigger="click"
          :click-toggle="false"
          :wrap-tooltip="false"
          :close-on-scroll="false"
          teleport-to="body"
          boundary-selector="body"
          @open="onPopoverOpen"
          @close="onPopoverClose"
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
              :aria-expanded="popoverExpanded"
              @pointerdown.stop="onLauncherPointerDown"
              @click.stop.prevent="onTriggerClick"
            >
              <span :class="styles.launcherIcon" aria-hidden="true">
                <EgIcon name="eds-sign-hashtag" size="sm" />
              </span>
              <span :class="styles.launcherLabel">Dev</span>
            </button>
          </EgTooltip>

          <template #content>
            <EgPopover
              v-if="pinnedInfo"
              placement="top"
              :align="popoverAlign"
              width-mode="fixed"
              :width="DEV_INSPECT_POPOVER_WIDTH"
              height-mode="adaptive"
              :max-height="POPOVER_MAX_HEIGHT"
              top-tool
              :top-tool-title="panelTitle"
              top-tool-closable
              @top-tool-close="closeDevPanel"
            >
              <div
                class="shell-debug-popover-content shell-debug-dev-inspect-popover"
                :class="styles.popoverContent"
                data-dev-inspect-panel
              >
                <InspectDetailPanel :info="pinnedInfo" embedded />
              </div>
            </EgPopover>
          </template>
        </EgAnchoredTooltip>
      </span>

      <template #content>
        <EgPopover
          placement="top"
          :align="hintPopoverAlign"
          width-mode="adaptive"
          height-mode="adaptive"
        >
          <div
            class="shell-debug-dev-inspect-hint"
            data-dev-inspect-panel
          >
            <InspectDetailPanel :info="null" embedded />
          </div>
        </EgPopover>
      </template>
    </EgAnchoredTooltip>
  </div>
</template>
