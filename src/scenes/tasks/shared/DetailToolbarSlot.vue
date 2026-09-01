<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots, watch } from 'vue';
import {
  EgDivider,
  EgIcon,
  EgPaginationItem,
  formatGroupedNumber,
} from '@eds/desktop-components';
import comboActionStyles from '@eds/desktop-components/molecules/combo/ComboAction.module.css';
import { useAppI18n } from '@/composables/useAppI18n';
import DetailToolbarNavGuidePopover from './DetailToolbarNavGuidePopover.vue';
import styles from './DetailToolbarSlot.module.css';

const props = withDefaults(
  defineProps<{
    showToolbarNav?: boolean;
    toolbarDividerPinned?: boolean;
    toolbarCurrent?: number;
    toolbarTotal?: number;
    toolbarPrevDisabled?: boolean;
    toolbarNextDisabled?: boolean;
    toolbarNavPulse?: number;
    toolbarNavDirection?: 'prev' | 'next';
    guideActive?: boolean;
  }>(),
  {
    showToolbarNav: true,
    toolbarDividerPinned: true,
    toolbarCurrent: 1,
    toolbarTotal: 1,
    toolbarPrevDisabled: false,
    toolbarNextDisabled: false,
    toolbarNavPulse: 0,
    toolbarNavDirection: 'next',
    guideActive: false,
  },
);

const emit = defineEmits<{
  'toolbar-prev': [];
  'toolbar-next': [];
  'guide-dismiss': [];
}>();

const slots = useSlots();

const showToolbarChrome = computed(
  () => props.showToolbarNav || Boolean(slots.leading) || Boolean(slots.actions),
);

const { ui } = useAppI18n();

const toolbarCounterCurrentText = computed(() =>
  formatGroupedNumber(props.toolbarCurrent),
);

const toolbarCounterTotalText = computed(() =>
  formatGroupedNumber(props.toolbarTotal),
);

const toolbarNavFlash = ref<'prev' | 'next' | null>(null);
let toolbarNavFlashTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.toolbarNavPulse,
  (pulse, previousPulse) => {
    if (pulse == null || previousPulse == null || pulse === previousPulse) return;
    const direction = props.toolbarNavDirection;
    if (direction !== 'prev' && direction !== 'next') return;

    toolbarNavFlash.value = direction;
    if (toolbarNavFlashTimer) clearTimeout(toolbarNavFlashTimer);
    toolbarNavFlashTimer = setTimeout(() => {
      toolbarNavFlash.value = null;
      toolbarNavFlashTimer = undefined;
    }, 300);
  },
);

onBeforeUnmount(() => {
  if (toolbarNavFlashTimer) clearTimeout(toolbarNavFlashTimer);
});
</script>

<template>
  <div
    v-if="showToolbarChrome"
    :class="[styles.toolbarPage, !showToolbarNav && styles.toolbarPageAlignEnd]"
  >
    <EgDivider
      :class="[
        comboActionStyles.divider,
        comboActionStyles.dividerAnimated,
        !toolbarDividerPinned && comboActionStyles.dividerAnimatedHidden,
      ]"
      type="module"
      direction="horizontal"
      :hide="!toolbarDividerPinned"
    />
    <div :class="styles.toolbarBar">
      <div v-if="$slots.leading" :class="styles.toolbarLeading">
        <slot name="leading" />
      </div>
      <div v-if="showToolbarNav" :class="styles.toolbarStart">
        <div :class="styles.toolbarNav">
          <DetailToolbarNavGuidePopover
            :disabled="toolbarPrevDisabled"
            :guide-active="guideActive"
            :visual-active="toolbarNavFlash === 'prev'"
            @click="emit('toolbar-prev')"
            @guide-dismiss="emit('guide-dismiss')"
          />
          <span :class="styles.toolbarCounter">
            <span :class="styles.toolbarCounterCurrent">{{ toolbarCounterCurrentText }}</span>
            <span :class="styles.toolbarCounterRest">/ {{ toolbarCounterTotalText }}</span>
          </span>
          <EgPaginationItem
            kind="borderArrow"
            :label="ui('Next item')"
            :disabled="toolbarNextDisabled"
            :visual-active="toolbarNavFlash === 'next'"
            @click="emit('toolbar-next')"
          >
            <EgIcon name="eds-arrow-right" fit />
          </EgPaginationItem>
        </div>
      </div>
      <div
        :class="[
          styles.toolbarActions,
          styles.toolbarActionsRight,
        ]"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
