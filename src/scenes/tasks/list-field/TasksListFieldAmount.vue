<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { EgDivider, EgListFieldOverflowText } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './TasksListFieldAmount.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
}>();

const COUNTDOWN_LOOP_SECONDS = 60 * 60;

function parsePreviewMinWidth(customize: Record<string, unknown>): number | undefined {
  const raw = String(customize.minWidth ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return parsed > 0 ? parsed : undefined;
}

function parseCountdownTotal(customize: Record<string, unknown>): number {
  const minutes = Math.max(0, Number.parseInt(String(customize.countdownMinutes ?? '30'), 10) || 0);
  const seconds = Math.max(
    0,
    Math.min(59, Number.parseInt(String(customize.countdownSeconds ?? '0'), 10) || 0),
  );
  return minutes * 60 + seconds;
}

function formatCountdownTotal(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const amountType = computed(() => String(props.customize.amountType ?? 'conversion'));
const fiatValue = computed(() => String(props.customize.fiatValue ?? '$10'));
const cryptoValue = computed(() => String(props.customize.cryptoValue ?? '12,500.000001'));
const secondaryValueRaw = computed(() => String(props.customize.secondaryValue ?? '').trim());
const useTransferTypeSecondary = computed(() => secondaryValueRaw.value.length > 0);
const showCountdown = computed(
  () => useTransferTypeSecondary.value && Boolean(props.customize.showCountdown),
);

const amountWidthConfigured = computed(() => parsePreviewMinWidth(props.customize) != null);
const alignEnd = computed(() => Boolean(props.customize.alignEnd));
const { ui } = useAppI18n();
const secondaryValue = computed(() => ui(secondaryValueRaw.value));
const tooltipTrigger = computed(
  () => String(props.customize.tooltipTrigger ?? 'hover') as 'hover' | 'focus',
);

/** Data List 单元格内：填满可用宽度并启用 tail 省略（同 Showcase amount 列）。 */
const cellMinWidthStyle = computed(() => {
  if (!amountWidthConfigured.value) return undefined;
  return { width: '100%', maxWidth: '100%', minWidth: '0' };
});

const countdownRemainingSeconds = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | undefined;

function resetCountdownFromCustomize() {
  countdownRemainingSeconds.value = parseCountdownTotal(props.customize);
}

function clearCountdownTimer() {
  if (countdownTimer !== undefined) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
}

function startCountdownTimer() {
  clearCountdownTimer();
  if (!showCountdown.value) return;
  resetCountdownFromCustomize();
  countdownTimer = setInterval(() => {
    if (countdownRemainingSeconds.value <= 0) {
      countdownRemainingSeconds.value = COUNTDOWN_LOOP_SECONDS;
      return;
    }
    countdownRemainingSeconds.value -= 1;
  }, 1000);
}

watch(
  showCountdown,
  (active) => {
    if (active) {
      startCountdownTimer();
      return;
    }
    clearCountdownTimer();
  },
  { immediate: true },
);

watch(
  () => [props.customize.countdownMinutes, props.customize.countdownSeconds],
  () => {
    if (showCountdown.value) {
      resetCountdownFromCustomize();
    }
  },
);

onBeforeUnmount(() => {
  clearCountdownTimer();
});

const countdownTime = computed(() => formatCountdownTotal(countdownRemainingSeconds.value));
</script>

<template>
  <div
    v-if="amountType === 'fiat'"
    :class="[styles.amountPreview, alignEnd && styles.amountPreviewAlignEnd]"
    :style="cellMinWidthStyle"
  >
    <EgListFieldOverflowText
      :text="fiatValue"
      variant="primary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
  </div>
  <div
    v-else-if="amountType === 'crypto'"
    :class="[styles.amountPreview, alignEnd && styles.amountPreviewAlignEnd]"
    :style="cellMinWidthStyle"
  >
    <EgListFieldOverflowText
      :text="cryptoValue"
      variant="primary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
  </div>
  <div
    v-else
    class="list-field-amount"
    :class="[styles.amountPreview, alignEnd && styles.amountPreviewAlignEnd]"
    :style="cellMinWidthStyle"
  >
    <EgListFieldOverflowText
      :text="cryptoValue"
      variant="primary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
    <div v-if="showCountdown" :class="styles.amountSecondaryRow">
      <EgListFieldOverflowText
        :text="secondaryValue"
        variant="secondary"
        tabular
        :tooltip-trigger="tooltipTrigger"
      />
      <EgDivider type="page" direction="vertical" />
      <span :class="styles.countdown">
        <span :class="styles.countdownTime">{{ countdownTime }}</span>
        <span :class="styles.countdownSuffix">{{ ui('Until Expiry') }}</span>
      </span>
    </div>
    <EgListFieldOverflowText
      v-else-if="useTransferTypeSecondary"
      :text="secondaryValue"
      variant="secondary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
    <EgListFieldOverflowText
      v-else
      :text="`≈ ${fiatValue}`"
      variant="secondary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
  </div>
</template>
