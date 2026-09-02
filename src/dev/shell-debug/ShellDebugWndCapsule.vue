<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import {
  EgAnchoredPopover,
  EgIcon,
  EgTooltip,
} from '@eds/desktop-components';
import styles from './ShellDebugWndCapsule.module.css';
import { markShellDebugUiInteraction } from './installShellDebugFloatLayerGuard';
import { registerShellDebugLauncherPopover } from './shellDebugLauncherPopovers';
import { SHELL_DEBUG_POPOVER_CHROME_HEIGHT } from './shellDebugPopover.constants';
import {
  SHELL_DEBUG_WINDOW_MODE_OPTIONS,
  useShellDebugWindowMode,
  type ShellDebugWindowPreset,
} from './shellDebugWindowMode';

const WND_POPOVER_WIDTH = 240;
const WND_POPOVER_MAX_HEIGHT = 220;
const BOUNDARY_MARGIN = 8;

type PopoverAlign = 'center' | 'end';

const { windowMode, windowsChromeActive, setWindowModePreview } = useShellDebugWindowMode();

const popoverAlign = ref<PopoverAlign>('end');
const triggerRef = ref<HTMLElement | null>(null);
const anchoredRef = ref<{ close?: () => void } | null>(null);
let unregisterLauncherPopover: (() => void) | undefined;

function resolvePopoverAlign(): PopoverAlign {
  const metrics = triggerRef.value?.querySelector('[data-eds-trigger-metrics]');
  if (!(metrics instanceof HTMLElement)) {
    return 'end';
  }

  const rect = metrics.getBoundingClientRect();
  const centerLeft = rect.left + (rect.width - WND_POPOVER_WIDTH) / 2;
  const boundaryLeft = BOUNDARY_MARGIN;
  const boundaryRight = window.innerWidth - BOUNDARY_MARGIN;

  if (centerLeft < boundaryLeft || centerLeft + WND_POPOVER_WIDTH > boundaryRight) {
    return 'end';
  }

  return 'center';
}

function syncPopoverAlign() {
  popoverAlign.value = resolvePopoverAlign();
}

function onLauncherPointerDown(event: PointerEvent) {
  event.stopPropagation();
  markShellDebugUiInteraction();
}

function onTriggerClick(event: MouseEvent, active: boolean, open: () => void) {
  event.preventDefault();
  event.stopPropagation();
  if (active) {
    anchoredRef.value?.close?.();
    return;
  }
  syncPopoverAlign();
  open();
}

function selectWindowMode(mode: ShellDebugWindowPreset) {
  setWindowModePreview(mode);
}

function isWindowOptionActive(mode: ShellDebugWindowPreset) {
  if (mode === 'windows') return windowsChromeActive.value;
  return windowMode.value === mode && !windowsChromeActive.value;
}

onMounted(() => {
  syncPopoverAlign();
  unregisterLauncherPopover = registerShellDebugLauncherPopover('wnd', () => {
    anchoredRef.value?.close?.();
  });
});

onBeforeUnmount(() => {
  unregisterLauncherPopover?.();
});
</script>

<template>
  <div ref="triggerRef">
    <EgAnchoredPopover
      ref="anchoredRef"
      placement="top"
      :align="popoverAlign"
      width-mode="fixed"
      :width="WND_POPOVER_WIDTH"
      height-mode="adaptive"
      :max-height="WND_POPOVER_MAX_HEIGHT"
      top-tool
      top-tool-title="Window"
      top-tool-closable
      :close-on-scroll="false"
      teleport-to="body"
      boundary-selector="body"
    >
      <template #trigger="{ active, onClick }">
        <span data-eds-trigger-metrics :class="styles.triggerMetrics">
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
              :class="styles.launcherButton"
              aria-label="Open window preferences"
              :aria-expanded="active"
              @pointerdown.stop="onLauncherPointerDown"
              @click.stop.prevent="onTriggerClick($event, active, onClick)"
            >
              <span :class="styles.launcherIcon" aria-hidden="true">
                <EgIcon name="eds-window-flex" size="sm" />
              </span>
              <span :class="styles.launcherLabel">Wnd.</span>
            </button>
          </EgTooltip>
        </span>
      </template>

      <template #default>
        <div
          class="shell-debug-wnd-popover-content"
          :class="styles.popoverContent"
          :style="{
            maxHeight: `${WND_POPOVER_MAX_HEIGHT - SHELL_DEBUG_POPOVER_CHROME_HEIGHT}px`,
          }"
        >
          <button
            v-for="option in SHELL_DEBUG_WINDOW_MODE_OPTIONS"
            :key="option.value"
            type="button"
            :class="styles.actionRow"
            @click="selectWindowMode(option.value)"
          >
            <span :class="styles.actionLabel">{{ option.label }}</span>
            <span v-if="isWindowOptionActive(option.value)" :class="styles.actionValue">Active</span>
          </button>
        </div>
      </template>
    </EgAnchoredPopover>
  </div>
</template>
