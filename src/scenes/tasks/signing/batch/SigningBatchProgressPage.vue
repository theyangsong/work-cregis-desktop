<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { EgDivider, EgProgress } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import {
  computeProgressPercent,
  countTaskStats,
  formatElapsedDuration,
} from './batchSigningTaskStore';
import type { BatchSigningTask, BatchSigningTaskRow } from './types';
import SigningBatchProgressTable from './SigningBatchProgressTable.vue';
import styles from './SigningBatchProgressPage.module.css';

const props = defineProps<{
  task: BatchSigningTask;
  rows: BatchSigningTaskRow[];
}>();

const { ui } = useAppI18n();
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer !== undefined) clearInterval(timer);
});

const stats = computed(() => countTaskStats(props.task));
const progressPercent = computed(() => computeProgressPercent(props.task));

const statusLabelKey = computed(() => {
  if (props.task.status === 'running') return 'Signing in progress';
  if (props.task.status === 'ended') return 'Batch completed';
  if (props.task.status === 'stopped') return 'Stopped';
  return 'Abnormally stopped';
});

const elapsedTime = computed(() =>
  props.task.status === 'running'
    ? formatElapsedDuration(props.task.startedAt, now.value)
    : formatElapsedDuration(props.task.startedAt, props.task.endedAt ?? now.value),
);

function formatMetricCount(value: number) {
  return formatGroupedNumber(value);
}
</script>

<template>
  <div :class="styles.progressPanel">
    <div :class="styles.headerCard">
      <div :class="styles.statusProgressGroup">
        <span :class="styles.statusLabel">{{ ui(statusLabelKey) }}</span>
        <EgProgress
          :value="progressPercent"
          :aria-label="ui(statusLabelKey)"
        />
        <div :class="styles.metrics">
        <span :class="styles.metricItem">
          <span :class="styles.metricLabel">{{ ui('Runtime') }}:</span>
          <span :class="[styles.metricValue, styles.metricValueTime]">{{ elapsedTime }}</span>
        </span>
        <span :class="styles.metricItem">
          <span :class="styles.metricLabel">{{ ui('Pending') }}:</span>
          <span :class="styles.metricValue">
            {{ formatMetricCount(stats.pending) }}
            <span :class="styles.metricCountUnit">{{ ui('Results') }}</span>
          </span>
        </span>
        <span :class="styles.metricItem">
          <span :class="styles.metricLabel">{{ ui('Processing') }}:</span>
          <span :class="styles.metricValue">
            {{ formatMetricCount(stats.inFlight) }}
            <span :class="styles.metricCountUnit">{{ ui('Results') }}</span>
          </span>
        </span>
        <span :class="styles.metricItem">
          <span :class="styles.metricLabel">{{ ui('Success') }}:</span>
          <span :class="styles.metricValue">
            {{ formatMetricCount(stats.success) }}
            <span :class="styles.metricCountUnit">{{ ui('Results') }}</span>
          </span>
        </span>
        <span :class="styles.metricItem">
          <span :class="styles.metricLabel">{{ ui('Failed') }}:</span>
          <span :class="[styles.metricValue, styles.metricValueFailed]">
            {{ formatMetricCount(stats.failed) }}
            <span :class="styles.metricCountUnit">{{ ui('Results') }}</span>
          </span>
        </span>
      </div>
      </div>
    </div>

    <EgDivider :class="styles.headerTableDivider" />

    <div :class="styles.listWrap">
      <SigningBatchProgressTable :rows="rows" fill />
    </div>
  </div>
</template>
