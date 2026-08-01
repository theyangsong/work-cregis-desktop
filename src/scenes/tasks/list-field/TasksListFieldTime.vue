<script setup lang="ts">
import { computed } from 'vue';
import { EgListFieldOverflowText } from '@eds/desktop-components';
import styles from './TasksListFieldTime.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
}>();

const datetime = computed(() => String(props.customize.datetime ?? ''));
const isDoubleLine = computed(() => String(props.customize.lineLayout ?? 'single') === 'double');
const secondaryDatetime = computed(() => String(props.customize.secondaryDatetime ?? '').trim());
const tooltipTrigger = computed(
  () => String(props.customize.tooltipTrigger ?? 'hover') as 'hover' | 'focus',
);
const cellMinWidthStyle = computed(() => ({
  width: '100%',
  maxWidth: '100%',
  minWidth: '0',
}));
</script>

<template>
  <div class="desktopTokens list-field-time" :class="styles.host" :style="cellMinWidthStyle">
    <EgListFieldOverflowText
      :text="datetime"
      :size="isDoubleLine ? 'small' : 'medium'"
      variant="primary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
    <EgListFieldOverflowText
      v-if="isDoubleLine && secondaryDatetime"
      :text="secondaryDatetime"
      size="small"
      variant="primary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
  </div>
</template>
