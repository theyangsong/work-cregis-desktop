<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  EXPIRY_COUNTDOWN_LOOP_SECONDS,
  formatExpiryCountdownHms,
  formatExpiryCountdownTotal,
  parseExpiryCountdownTotal,
} from './expiryCountdownUtils';
import styles from './expiryCountdown.module.css';

const props = withDefaults(
  defineProps<{
    minutes?: string;
    seconds?: string;
    /** 列表专用：参与 H:MM:SS 总秒数；详情忽略。 */
    hours?: string;
    /** detail = MM:SS + 后到期；list = H:MM:SS + 后到期/后超时。 */
    display?: 'detail' | 'list';
    /** i18n 后缀键；默认 Until Expiry。 */
    suffixKey?: string;
  }>(),
  {
    minutes: '30',
    seconds: '00',
    hours: '0',
    display: 'detail',
    suffixKey: 'Until Expiry',
  },
);

const { ui } = useAppI18n();

const countdownRemainingSeconds = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | undefined;

function resetCountdown() {
  countdownRemainingSeconds.value = parseExpiryCountdownTotal(props.minutes, props.seconds);
}

function clearCountdownTimer() {
  if (countdownTimer !== undefined) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
}

function startCountdownTimer() {
  clearCountdownTimer();
  resetCountdown();
  countdownTimer = setInterval(() => {
    if (countdownRemainingSeconds.value <= 0) {
      countdownRemainingSeconds.value = EXPIRY_COUNTDOWN_LOOP_SECONDS;
      return;
    }
    countdownRemainingSeconds.value -= 1;
  }, 1000);
}

const isListDisplay = computed(() => props.display === 'list');

const staticListTotalSeconds = computed(() =>
  parseExpiryCountdownTotal(props.minutes, props.seconds, props.hours),
);

const countdownTime = computed(() =>
  isListDisplay.value
    ? formatExpiryCountdownHms(staticListTotalSeconds.value)
    : formatExpiryCountdownTotal(countdownRemainingSeconds.value),
);

function syncCountdownState() {
  if (isListDisplay.value) {
    clearCountdownTimer();
    return;
  }
  startCountdownTimer();
}

watch(
  () => [props.minutes, props.seconds, props.hours, props.display],
  () => {
    syncCountdownState();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearCountdownTimer();
});
</script>

<template>
  <span :class="[styles.countdown, isListDisplay && styles.countdownList]">
    <span
      :class="[
        styles.countdownTime,
        isListDisplay && styles.countdownTimeList,
      ]"
    >
      {{ countdownTime }}
    </span>
    <span
      :class="[
        styles.countdownSuffix,
        isListDisplay && styles.countdownSuffixList,
      ]"
    >
      {{ ui(suffixKey) }}
    </span>
  </span>
</template>
