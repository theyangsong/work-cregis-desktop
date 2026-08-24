<script setup lang="ts">
import { computed } from 'vue';
import { buildCurrencyAddressTags } from './listFieldCurrencyTagCustomize';
import TasksListFieldAddressLine from './TasksListFieldAddressLine.vue';
import styles from './TasksListFieldReceiver.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
  alignEnd?: boolean;
}>();

function parsePreviewMinWidth(customize: Record<string, unknown>): number | undefined {
  const raw = String(customize.minWidth ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return parsed > 0 ? parsed : undefined;
}

const receiverTags = computed(() => buildCurrencyAddressTags('to', 1, props.customize));
const addressTooltipTrigger = computed(
  () => String(props.customize.addressTooltipTrigger ?? 'hover') as 'hover' | 'focus',
);
const cellMinWidthStyle = computed(() => {
  if (props.alignEnd || parsePreviewMinWidth(props.customize) != null) {
    return { width: '100%', maxWidth: '100%', minWidth: '0' };
  }
  return undefined;
});
</script>

<template>
  <div
    class="desktopTokens"
    :class="[styles.host, alignEnd && styles.hostAlignEnd]"
    :style="cellMinWidthStyle"
  >
    <TasksListFieldAddressLine
      prefix="to"
      :customize="customize"
      :tags="receiverTags"
      :align-end="alignEnd"
      :tooltip-trigger="addressTooltipTrigger"
    />
  </div>
</template>
