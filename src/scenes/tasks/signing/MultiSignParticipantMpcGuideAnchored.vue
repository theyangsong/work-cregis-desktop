<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { EgGuidancePopover } from '@eds/desktop-components';
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

const guideRef = ref<{ close?: () => void; open?: () => void } | null>(null);
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

function dismissGuide() {
  guideSuppressed.value = true;
  guideRef.value?.close?.();
}

function onGuideDismiss() {
  guideOpen.value = false;
}

function onGuideOpen() {
  guideOpen.value = true;
}

function scheduleGuideOpen() {
  clearOpenTimer();
  if (!props.active || guideSuppressed.value) return;

  openTimer = setTimeout(async () => {
    await nextTick();
    if (!props.active || guideSuppressed.value) return;
    guideRef.value?.open?.();
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
    guideRef.value?.close?.();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearOpenTimer();
});
</script>

<template>
  <EgGuidancePopover
    ref="guideRef"
    :title="ui('Switch MPC network')"
    :body="ui('MPC network error. Switch here and try again.')"
    :action-label="ui('Got it')"
    placement="top"
    align="center"
    boundary-selector=".app-preview"
    top-tool-closable
    @action="dismissGuide"
    @open="onGuideOpen"
    @dismiss="onGuideDismiss"
  >
    <template #trigger="{ onClick }">
      <span
        data-eds-trigger-metrics
        :class="styles.triggerMetrics"
        @click.stop
      >
        <slot :guide-open="guideOpen" :dismiss-guide="dismissGuide" />
      </span>
    </template>
  </EgGuidancePopover>
</template>
