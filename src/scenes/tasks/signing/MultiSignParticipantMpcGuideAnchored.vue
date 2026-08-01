<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  EgAnchoredTooltip,
  EgButton,
  EgPopover,
  POPOVER_PRESET_WIDTH_GUIDE,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './MultiSignParticipantMpcGuideAnchored.module.css';

const props = withDefaults(
  defineProps<{
    active?: boolean;
  }>(),
  {
    active: false,
  },
);

const { ui } = useAppI18n();

const anchoredRef = ref<{ openPanel?: () => void; close?: () => void } | null>(null);
const guideOpen = ref(false);
/** 用户已关引导（点「知道了」/ 点 latency trigger 开菜单）后勿再 auto-open。 */
const guideSuppressed = ref(false);

let openTimer: ReturnType<typeof setTimeout> | undefined;

function clearOpenTimer() {
  if (openTimer !== undefined) {
    clearTimeout(openTimer);
    openTimer = undefined;
  }
}

function closeGuidePanel() {
  anchoredRef.value?.close?.();
}

function dismissGuide() {
  guideSuppressed.value = true;
  closeGuidePanel();
}

function onGuideOpen() {
  guideOpen.value = true;
}

function onGuideClose() {
  guideOpen.value = false;
}

function scheduleGuideOpen() {
  clearOpenTimer();
  if (!props.active || guideSuppressed.value) return;

  openTimer = setTimeout(async () => {
    await nextTick();
    if (!props.active || guideSuppressed.value) return;
    anchoredRef.value?.openPanel?.();
  }, 320);
}

watch(
  () => props.active,
  (active) => {
    if (active) {
      scheduleGuideOpen();
      return;
    }
    clearOpenTimer();
    guideSuppressed.value = false;
    guideOpen.value = false;
    closeGuidePanel();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearOpenTimer();
});
</script>

<template>
  <EgAnchoredTooltip
    ref="anchoredRef"
    placement="top"
    align="center"
    trigger="click"
    :wrap-tooltip="false"
    :click-toggle="false"
    boundary-selector=".app-preview"
    teleport-to=".app-preview"
    token-scope-class="desktopTokens"
    @open="onGuideOpen"
    @close="onGuideClose"
  >
    <span
      data-eds-trigger-metrics
      :class="styles.triggerMetrics"
      @click.stop
    >
      <slot :guide-open="guideOpen" :dismiss-guide="dismissGuide" />
    </span>

    <template #content>
      <div :class="styles.guideHost">
        <EgPopover
          placement="top"
          align="center"
          width-mode="fixed"
          :width="POPOVER_PRESET_WIDTH_GUIDE"
          height-mode="adaptive"
          top-tool
          :top-tool-title="ui('Switch MPC network')"
          top-tool-closable
          @top-tool-close="dismissGuide"
        >
          <div :class="styles.guideSlot">
            <p :class="styles.guideBody">
              {{ ui('MPC network error. Switch here and try again.') }}
            </p>
            <EgButton
              :class="styles.guideAction"
              tone="sameWhite"
              variant="solid"
              size="md"
              @click="dismissGuide"
            >
              {{ ui('Got it') }}
            </EgButton>
          </div>
        </EgPopover>
      </div>
    </template>
  </EgAnchoredTooltip>
</template>
