<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  EgAnchoredTooltip,
  EgButton,
  EgIcon,
  EgPaginationItem,
  EgPopover,
  POPOVER_PRESET_WIDTH_GUIDE,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { useTasksDetailToolbarGuide } from './useTasksDetailToolbarGuide';
import styles from './DetailToolbarNavGuidePopover.module.css';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    guideActive?: boolean;
  }>(),
  {
    disabled: false,
    guideActive: false,
  },
);

const emit = defineEmits<{
  click: [];
  'guide-dismiss': [];
}>();

const { ui } = useAppI18n();
const { markGuideSeen, tryConsumeGuideAutoPresent } = useTasksDetailToolbarGuide();
const anchoredRef = ref<{ openPanel?: () => void; close?: () => void } | null>(null);
let openTimer: ReturnType<typeof setTimeout> | undefined;

function clearOpenTimer() {
  if (openTimer !== undefined) {
    clearTimeout(openTimer);
    openTimer = undefined;
  }
}

function dismissGuide() {
  anchoredRef.value?.close?.();
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
    anchoredRef.value?.openPanel?.();
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
  <EgAnchoredTooltip
    ref="anchoredRef"
    placement="top"
    align="center"
    trigger="click"
    :wrap-tooltip="false"
    :click-toggle="false"
    boundary-selector=".eds-popup"
    teleport-to=".app-preview"
    token-scope-class="desktopTokens"
    :disabled="disabled"
  >
    <EgPaginationItem
      kind="borderArrow"
      :label="ui('Previous item')"
      :disabled="disabled"
      @click="emit('click')"
    >
      <EgIcon name="eds-arrow-left" fit />
    </EgPaginationItem>

    <template #content>
      <div :class="styles.guideHost">
        <EgPopover
          placement="top"
          align="center"
          width-mode="fixed"
          :width="POPOVER_PRESET_WIDTH_GUIDE"
          height-mode="adaptive"
          top-tool
          :top-tool-title="ui('Quick actions')"
          top-tool-closable
          @top-tool-close="dismissGuide"
        >
          <div :class="styles.guideSlot">
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
