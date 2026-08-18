<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { EgDivider, EgListFieldOverflowText } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
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

function parseExpiryCountdownTotal(hoursRaw: string, minutesRaw: string, secondsRaw: string): number {
  const hours = Math.max(0, Number.parseInt(hoursRaw, 10) || 0);
  const minutes = Math.max(0, Number.parseInt(minutesRaw, 10) || 0);
  const seconds = Math.max(0, Number.parseInt(secondsRaw, 10) || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatCountdownTotal(totalSeconds: number): string {
  const total = Math.max(0, totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const countdownRemainingSeconds = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | undefined;

function clearCountdownTimer() {
  if (countdownTimer !== undefined) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
}

function resetCountdownFromCustomize() {
  clearCountdownTimer();
  if (!showCountdown.value) {
    countdownRemainingSeconds.value = 0;
    return;
  }
  countdownRemainingSeconds.value = parseExpiryCountdownTotal(
    String(props.customize.countdownHours ?? '0'),
    String(props.customize.countdownMinutes ?? '30'),
    String(props.customize.countdownSeconds ?? '00'),
  );
  countdownTimer = setInterval(() => {
    if (countdownRemainingSeconds.value <= 0) {
      clearCountdownTimer();
      return;
    }
    countdownRemainingSeconds.value -= 1;
  }, 1000);
}

watch(
  () => [
    props.customize.showCountdown,
    props.customize.countdownHours,
    props.customize.countdownMinutes,
    props.customize.countdownSeconds,
  ],
  () => {
    resetCountdownFromCustomize();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearCountdownTimer();
});

const countdownSuffixKey = computed(() =>
  String(props.customize.countdownSuffixKey ?? 'Expires in xx:xx').trim() || 'Expires in xx:xx',
);

const countdownListText = computed(() => {
  const total = countdownRemainingSeconds.value;
  return `${formatCountdownTotal(total)} ${ui(countdownSuffixKey.value)}`;
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
