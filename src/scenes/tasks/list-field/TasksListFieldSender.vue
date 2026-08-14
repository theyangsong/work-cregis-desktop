<script setup lang="ts">
import { computed } from 'vue';
import { type TagSystemType } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { buildCurrencyAddressTags } from './listFieldCurrencyTagCustomize';
import TasksListFieldAddressLine from './TasksListFieldAddressLine.vue';
import styles from './TasksListFieldSender.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
  alignEnd?: boolean;
}>();

const { ui } = useAppI18n();

function parsePreviewMinWidth(customize: Record<string, unknown>): number | undefined {
  const raw = String(customize.minWidth ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return parsed > 0 ? parsed : undefined;
}

const senderTags = computed(() => buildCurrencyAddressTags('from', 1, props.customize));
const showRowTag = computed(() => Boolean(props.customize.showRowTag));
const rowTagLabel = computed(() => ui(String(props.customize.rightLabel ?? 'Multi-Sign')));
const rowTagSystemType = computed(
  () => String(props.customize.rowTagSystemType ?? 'gray') as TagSystemType,
);
const secondaryText = computed(() => ui(String(props.customize.addressSecondaryText ?? '').trim()));
const addressTooltipTrigger = computed(
  () => String(props.customize.addressTooltipTrigger ?? 'hover') as 'hover' | 'focus',
);
const cellMinWidthStyle = computed(() => {
  if (props.alignEnd) {
    return { width: '100%', maxWidth: '100%', minWidth: '0' };
  }
  const width = parsePreviewMinWidth(props.customize);
  return width ? { minWidth: `${width}px`, maxWidth: `${width}px` } : undefined;
});
</script>

<template>
  <div
    class="desktopTokens"
    :class="[styles.host, alignEnd && styles.hostAlignEnd]"
    :style="cellMinWidthStyle"
  >
    <TasksListFieldAddressLine
      prefix="from"
      :customize="customize"
      :tags="senderTags"
      :show-row-tag="showRowTag"
      :row-tag-label="rowTagLabel"
      :row-tag-system-type="rowTagSystemType"
      :secondary-text="secondaryText"
      :align-end="alignEnd"
      :tooltip-trigger="addressTooltipTrigger"
    />
  </div>
</template>
