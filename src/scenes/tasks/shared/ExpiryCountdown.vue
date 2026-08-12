<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  EXPIRY_COUNTDOWN_LOOP_SECONDS,
  formatExpiryCountdownTotal,
  parseExpiryCountdownTotal,
} from './expiryCountdownUtils';
import styles from './expiryCountdown.module.css';

const props = withDefaults(
  defineProps<{
    minutes?: string;
    seconds?: string;
  }>(),
  {
    minutes: '30',
    seconds: '00',
  },
);

const { ui } = useAppI18n();

const countdownRemainingSeconds = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | undefined;

function resetCountdown() {
  countdownRemainingSeconds.value = parseExpiryCountdownTotal(
    props.minutes,
    props.seconds,
  );
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

watch(
  () => [props.minutes, props.seconds],
  () => {
    startCountdownTimer();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearCountdownTimer();
});

const countdownTime = computed(() =>
  formatExpiryCountdownTotal(countdownRemainingSeconds.value),
);
</script>

<template>
  <span :class="styles.countdown">
    <span :class="styles.countdownTime">{{ countdownTime }}</span>
    <span :class="styles.countdownSuffix">{{ ui('Until Expiry') }}</span>
  </span>
</template>
