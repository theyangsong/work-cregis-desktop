<script setup lang="ts">
import { computed } from 'vue';
import { EgDivider, EgListFieldOverflowText } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  formatExpiryCountdownHms,
  parseExpiryCountdownTotal,
} from '../shared/expiryCountdownUtils';
import { splitBusinessTypeSecondaryKey } from './businessTypeDisplay';
import styles from './TasksListFieldOperationType.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
}>();

const { ui } = useAppI18n();

const compositeKeyRaw = computed(() => String(props.customize.compositeKey ?? '').trim());
const tooltipTrigger = computed(
  () => String(props.customize.tooltipTrigger ?? 'hover') as 'hover' | 'focus',
);
const showCountdown = computed(() => Boolean(props.customize.showCountdown));

const parts = computed(() => {
  const key = compositeKeyRaw.value;
  if (!key) return null;
  const split = splitBusinessTypeSecondaryKey(key);
  if (!split) return null;
  return {
    source: ui(split.sourceKey),
    action: ui(split.actionKey),
  };
});

const plainText = computed(() => (parts.value ? '' : ui(compositeKeyRaw.value)));

const cellMinWidthStyle = computed(() => {
  const raw = String(props.customize.minWidth ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return { minWidth: `${parsed}px` };
});

const countdownSuffixKey = computed(() =>
  String(props.customize.countdownSuffixKey ?? 'Expires in xx:xx').trim() || 'Expires in xx:xx',
);

/** 列表仅展示静态 H:MM:SS；实时倒计时只在详情 ExpiryCountdown。 */
const countdownListText = computed(() => {
  const total = parseExpiryCountdownTotal(
    String(props.customize.countdownMinutes ?? '30'),
    String(props.customize.countdownSeconds ?? '00'),
    String(props.customize.countdownHours ?? '0'),
  );
  return `${formatExpiryCountdownHms(total)} ${ui(countdownSuffixKey.value)}`;
});
</script>

<template>
  <div
    class="desktopTokens list-field-operation-type"
    :class="styles.host"
    :style="cellMinWidthStyle"
  >
    <span v-if="parts" :class="styles.combo">
      <EgListFieldOverflowText
        :text="parts.source"
        variant="primary"
        :tooltip-trigger="tooltipTrigger"
      />
      <div v-if="showCountdown" :class="styles.secondaryRow">
        <span :class="styles.secondaryRowAction">
          <EgListFieldOverflowText
            :text="parts.action"
            variant="secondary"
            :tooltip-trigger="tooltipTrigger"
          />
        </span>
        <EgDivider type="navigator" direction="vertical" />
        <span :class="styles.secondaryRowCountdown">
          <EgListFieldOverflowText
            :text="countdownListText"
            variant="secondary"
            tabular
            :tooltip-trigger="tooltipTrigger"
          />
        </span>
      </div>
      <EgListFieldOverflowText
        v-else
        :text="parts.action"
        variant="secondary"
        :tooltip-trigger="tooltipTrigger"
      />
    </span>
    <EgListFieldOverflowText
      v-else-if="plainText"
      :text="plainText"
      variant="secondary"
      :tooltip-trigger="tooltipTrigger"
    />
  </div>
</template>
