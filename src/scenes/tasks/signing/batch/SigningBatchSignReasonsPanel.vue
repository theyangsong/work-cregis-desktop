<script setup lang="ts">
import { computed } from 'vue';
import { groupIneligibleByReason } from './evaluateBatchEligibility';
import type { BatchIneligibleReasonFilter } from './batchIneligibleReasonFilter';
import type { BatchEligibilityResult, BatchIneligibleReason, SigningBatchRowModel } from './types';
import SigningBatchDetailTable from './SigningBatchDetailTable.vue';

const props = defineProps<{
  eligibility: BatchEligibilityResult;
  rows: SigningBatchRowModel[];
  filter: BatchIneligibleReasonFilter;
}>();

const emit = defineEmits<{
  'update:filter': [value: BatchIneligibleReasonFilter];
}>();

const ineligibleReasonByRowIndex = computed(
  () =>
    new Map<number, BatchIneligibleReason>(
      props.eligibility.ineligible.map((item) => [item.row.rowIndex, item.reason]),
    ),
);

const reasonFilterGroups = computed(() =>
  groupIneligibleByReason(props.eligibility.ineligible).map((group) => ({
    reason: group.reason,
    count: group.rows.length,
  })),
);

const totalIneligibleCount = computed(() => props.eligibility.ineligible.length);

const filterModel = computed({
  get: () => props.filter,
  set: (value: BatchIneligibleReasonFilter) => emit('update:filter', value),
});
</script>

<template>
  <SigningBatchDetailTable
    :rows="rows"
    fill
    show-ineligible-reason-column
    :ineligible-reason-by-row-index="ineligibleReasonByRowIndex"
    v-model:ineligible-reason-filter="filterModel"
    :ineligible-reason-filter-groups="reasonFilterGroups"
    :ineligible-reason-total-count="totalIneligibleCount"
  />
</template>
