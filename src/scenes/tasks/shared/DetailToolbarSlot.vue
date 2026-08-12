<script setup lang="ts">
import { computed } from 'vue';
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
    guideActive?: boolean;
  }>(),
  {
    showToolbarNav: true,
    toolbarDividerPinned: true,
    toolbarCurrent: 1,
    toolbarTotal: 1,
    toolbarPrevDisabled: false,
    toolbarNextDisabled: false,
    guideActive: false,
  },
);

const emit = defineEmits<{
  'toolbar-prev': [];
  'toolbar-next': [];
  'guide-dismiss': [];
}>();

const { ui } = useAppI18n();

const toolbarCounterCurrentText = computed(() =>
  formatGroupedNumber(props.toolbarCurrent),
);

const toolbarCounterTotalText = computed(() =>
  formatGroupedNumber(props.toolbarTotal),
);
</script>

<template>
  <div :class="styles.toolbarPage">
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
      <div v-if="showToolbarNav" :class="styles.toolbarStart">
        <div :class="styles.toolbarNav">
          <DetailToolbarNavGuidePopover
            :disabled="toolbarPrevDisabled"
            :guide-active="guideActive"
            @click="emit('toolbar-prev')"
            @guide-dismiss="emit('guide-dismiss')"
          />
          <EgPaginationItem
            kind="borderArrow"
            :label="ui('Next item')"
            :disabled="toolbarNextDisabled"
            @click="emit('toolbar-next')"
          >
            <EgIcon name="eds-arrow-right" fit />
          </EgPaginationItem>
        </div>
      </div>
      <span v-if="showToolbarNav" :class="styles.toolbarCounter">
        <span :class="styles.toolbarCounterCurrent">{{ toolbarCounterCurrentText }}</span>
        <span :class="styles.toolbarCounterRest">/ {{ toolbarCounterTotalText }}</span>
      </span>
      <div :class="styles.toolbarActions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
