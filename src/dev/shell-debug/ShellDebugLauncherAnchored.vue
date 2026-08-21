<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  EgAnchoredPopover,
  EgIcon,
  EgTooltip,
} from '@eds/desktop-components';
import styles from './ShellDebugLauncherAnchored.module.css';
import { markShellDebugUiInteraction } from './installShellDebugFloatLayerGuard';
import {
  SHELL_DEBUG_POPOVER_CHROME_HEIGHT,
  SHELL_DEBUG_POPOVER_MAX_HEIGHT,
  SHELL_DEBUG_POPOVER_WIDTH,
  shellDebugPopoverContentMaxHeight,
  shellDebugPopoverContentMinHeight,
} from './shellDebugPopover.constants';

withDefaults(
  defineProps<{
    label: string;
    icon: string;
    panelTitle: string;
    panelMeta?: string;
    triggerAriaLabel: string;
    showPanelMeta?: boolean;
    /** true（默认）：内容区 min-height = shellDebugPopoverContentMinHeight（298px），整面板 360px。 */
    useContentMinHeight?: boolean;
  }>(),
  {
    showPanelMeta: true,
    useContentMinHeight: true,
  },
);

const POPOVER_WIDTH = SHELL_DEBUG_POPOVER_WIDTH;
const POPOVER_MIN_HEIGHT = shellDebugPopoverContentMinHeight + SHELL_DEBUG_POPOVER_CHROME_HEIGHT;
const POPOVER_MAX_HEIGHT = SHELL_DEBUG_POPOVER_MAX_HEIGHT;
/** topTool + contentSlot 底 padding，用于内容区 min-height 换算整面板最小高度。 */
const POPOVER_CHROME_HEIGHT = SHELL_DEBUG_POPOVER_CHROME_HEIGHT;
const popoverContentMinHeight = shellDebugPopoverContentMinHeight;
const BOUNDARY_MARGIN = 8;

type PopoverAlign = 'center' | 'end';

/** 壳外胶囊靠预览框右侧，默认 end 避免首开时 align 翻转导致 remount。 */
const popoverAlign = ref<PopoverAlign>('end');
const triggerRef = ref<HTMLElement | null>(null);
const anchoredRef = ref<{ close?: () => void } | null>(null);

const emit = defineEmits<{
  open: [];
  close: [];
}>();

function resolvePopoverAlign(): PopoverAlign {
  const metrics = triggerRef.value?.querySelector('[data-eds-trigger-metrics]');
  if (!(metrics instanceof HTMLElement)) {
    return 'end';
  }

  const rect = metrics.getBoundingClientRect();
  const centerLeft = rect.left + (rect.width - POPOVER_WIDTH) / 2;
  const boundaryLeft = BOUNDARY_MARGIN;
  const boundaryRight = window.innerWidth - BOUNDARY_MARGIN;

  if (centerLeft < boundaryLeft || centerLeft + POPOVER_WIDTH > boundaryRight) {
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

onMounted(() => {
  syncPopoverAlign();
});
</script>

<template>
  <div ref="triggerRef">
    <EgAnchoredPopover
      ref="anchoredRef"
      placement="top"
      :align="popoverAlign"
      width-mode="fixed"
      :width="POPOVER_WIDTH"
      height-mode="adaptive"
      :max-height="POPOVER_MAX_HEIGHT"
      top-tool
      :top-tool-title="panelTitle"
      top-tool-closable
      :close-on-scroll="false"
      teleport-to="body"
      boundary-selector="body"
      @open="emit('open')"
      @close="emit('close')"
    >
    <template #trigger="{ active, onClick }">
      <span
        data-eds-trigger-metrics
        :class="styles.triggerMetrics"
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
            :class="styles.launcherButton"
            :aria-label="triggerAriaLabel"
            :aria-expanded="active"
            @pointerdown.stop="onLauncherPointerDown"
            @click.stop.prevent="onTriggerClick($event, active, onClick)"
          >
            <span :class="styles.launcherIcon" aria-hidden="true">
              <EgIcon :name="icon" size="sm" />
            </span>
            <span :class="styles.launcherLabel">{{ label }}</span>
          </button>
        </EgTooltip>
      </span>
    </template>

    <template #default>
      <div
        class="shell-debug-popover-content"
        :class="styles.popoverContent"
        :style="{
          ...(useContentMinHeight
            ? { minHeight: `${popoverContentMinHeight}px` }
            : {}),
          maxHeight: `${shellDebugPopoverContentMaxHeight}px`,
        }"
      >
        <p v-if="showPanelMeta && panelMeta" :class="styles.panelMeta">{{ panelMeta }}</p>
        <slot />
      </div>
    </template>
  </EgAnchoredPopover>
  </div>
</template>
