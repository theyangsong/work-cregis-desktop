<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  EgAnchoredPopover,
  EgIcon,
  EgTooltip,
  useThemeProvider,
} from '@eds/desktop-components';
import {
  APP_LOCALE_CYCLE,
  APP_LOCALE_SHELL_LABELS,
  useAppLocale,
} from '@/composables/useAppLocale';
import styles from './ShellDebugModelCapsule.module.css';
import { markShellDebugUiInteraction } from './installShellDebugFloatLayerGuard';
import { registerShellDebugLauncherPopover } from './shellDebugLauncherPopovers';
import { SHELL_DEBUG_POPOVER_CHROME_HEIGHT } from './shellDebugPopover.constants';

const MODEL_POPOVER_WIDTH = 240;
const MODEL_POPOVER_MAX_HEIGHT = 220;
const BOUNDARY_MARGIN = 8;

type PopoverAlign = 'center' | 'end';

const { locale, setLocalePreview } = useAppLocale();
const { theme, setTheme } = useThemeProvider();

const popoverAlign = ref<PopoverAlign>('end');
const triggerRef = ref<HTMLElement | null>(null);
const anchoredRef = ref<{ close?: () => void } | null>(null);
let unregisterLauncherPopover: (() => void) | undefined;

const languageValueLabel = computed(() => APP_LOCALE_SHELL_LABELS[locale.value]);
const themeValueLabel = computed(() => (theme.value === 'dark' ? 'Dark' : 'Light'));

function resolvePopoverAlign(): PopoverAlign {
  const metrics = triggerRef.value?.querySelector('[data-eds-trigger-metrics]');
  if (!(metrics instanceof HTMLElement)) {
    return 'end';
  }

  const rect = metrics.getBoundingClientRect();
  const centerLeft = rect.left + (rect.width - MODEL_POPOVER_WIDTH) / 2;
  const boundaryLeft = BOUNDARY_MARGIN;
  const boundaryRight = window.innerWidth - BOUNDARY_MARGIN;

  if (centerLeft < boundaryLeft || centerLeft + MODEL_POPOVER_WIDTH > boundaryRight) {
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

function toggleLanguage() {
  const index = APP_LOCALE_CYCLE.indexOf(locale.value);
  const next = APP_LOCALE_CYCLE[(index + 1) % APP_LOCALE_CYCLE.length] ?? 'zh-CN';
  setLocalePreview(next);
}

function toggleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : 'light');
}

onMounted(() => {
  syncPopoverAlign();
  unregisterLauncherPopover = registerShellDebugLauncherPopover('model', () => {
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
      :width="MODEL_POPOVER_WIDTH"
      height-mode="adaptive"
      :max-height="MODEL_POPOVER_MAX_HEIGHT"
      top-tool
      top-tool-title="Model"
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
              aria-label="Open model preferences"
              :aria-expanded="active"
              @pointerdown.stop="onLauncherPointerDown"
              @click.stop.prevent="onTriggerClick($event, active, onClick)"
            >
              <span :class="styles.launcherIcon" aria-hidden="true">
                <EgIcon name="eds-star" size="sm" />
              </span>
              <span :class="styles.launcherLabel">Model</span>
            </button>
          </EgTooltip>
        </span>
      </template>

      <template #default>
        <div
          class="shell-debug-model-popover-content"
          :class="styles.popoverContent"
          :style="{
            maxHeight: `${MODEL_POPOVER_MAX_HEIGHT - SHELL_DEBUG_POPOVER_CHROME_HEIGHT}px`,
          }"
        >
          <button type="button" :class="styles.actionRow" @click="toggleLanguage">
            <span :class="styles.actionLabel">Language</span>
            <span :class="styles.actionValue">{{ languageValueLabel }}</span>
          </button>
          <button type="button" :class="styles.actionRow" @click="toggleTheme">
            <span :class="styles.actionLabel">Theme</span>
            <span :class="styles.actionValue">{{ themeValueLabel }}</span>
          </button>
        </div>
      </template>
    </EgAnchoredPopover>
  </div>
</template>
