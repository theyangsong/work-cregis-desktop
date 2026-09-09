<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  EgGuidancePopover,
  EgIcon,
  EgPaginationGroupButton,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { useTasksDetailToolbarGuide } from './useTasksDetailToolbarGuide';
import styles from './DetailToolbarNavGuidePopover.module.css';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    guideActive?: boolean;
    visualActive?: boolean;
  }>(),
  {
    disabled: false,
    guideActive: false,
    visualActive: false,
  },
);

const emit = defineEmits<{
  click: [];
  'guide-dismiss': [];
}>();

const { ui } = useAppI18n();
const { markGuideSeen, tryConsumeGuideAutoPresent } = useTasksDetailToolbarGuide();
const guideRef = ref<{ close?: () => void; open?: () => void } | null>(null);
let openTimer: ReturnType<typeof setTimeout> | undefined;

function clearOpenTimer() {
  if (openTimer !== undefined) {
    clearTimeout(openTimer);
    openTimer = undefined;
  }
}

function dismissGuide() {
  guideRef.value?.close?.();
  markGuideSeen();
  emit('guide-dismiss');
}

function scheduleGuideOpen() {
  clearOpenTimer();
  if (!props.guideActive || props.disabled) return;
  if (!tryConsumeGuideAutoPresent()) return;

  openTimer = setTimeout(async () => {
    await nextTick();
    if (!props.guideActive) return;
    guideRef.value?.open?.();
  }, 320);
}

watch(
  () => props.guideActive,
  (active) => {
    if (active) {
      scheduleGuideOpen();
      return;
    }
    clearOpenTimer();
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
    :title="ui('Quick actions')"
    :action-label="ui('Got it')"
    placement="top"
    align="center"
    top-tool-closable
    :disabled="disabled"
    @action="dismissGuide"
    @dismiss="dismissGuide"
  >
    <template #trigger>
      <EgPaginationGroupButton
        kind="borderArrow"
        :label="ui('Previous item')"
        :disabled="disabled"
        :visual-active="visualActive"
        @click="emit('click')"
      >
        <EgIcon name="eds-arrow-left" fit />
      </EgPaginationGroupButton>
    </template>
    <template #body>
      <p :class="styles.guideBody">
        {{ ui('Use keyboard shortcuts') }}<kbd
          :class="styles.guideKey"
          :aria-label="ui('Previous item')"
        ><EgIcon
          :class="styles.guideKeyIcon"
          name="eds-arrow-left"
        /></kbd>{{ ui('and') }}<kbd
          :class="styles.guideKey"
          :aria-label="ui('Next item')"
        ><EgIcon
          :class="styles.guideKeyIcon"
          name="eds-arrow-right"
        /></kbd>{{ ui('to paginate and handle tasks quickly.') }}
      </p>
    </template>
  </EgGuidancePopover>
</template>
