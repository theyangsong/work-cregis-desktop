<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { EgButton, EgConfirmPopover, POPOVER_PRESET_WIDTH_BASE } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  getActiveBatchSigningTask,
  isBatchSigningTaskRunning,
  stopBatchSigningTask,
} from './batchSigningTaskStore';
import SigningBatchDataListPaginerBar from './SigningBatchDataListPaginerBar.vue';
import SigningBatchPopupSlotChrome from './SigningBatchPopupSlotChrome.vue';
import SigningBatchProgressPage from './SigningBatchProgressPage.vue';
import type { BatchSigningTask, BatchSigningTaskRow } from './types';

const props = withDefaults(
  defineProps<{
    task: BatchSigningTask;
    innerBackdrop?: boolean;
  }>(),
  {
    innerBackdrop: true,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const { ui } = useAppI18n();

const activeTask = getActiveBatchSigningTask();

const isRunning = computed(() => {
  const task = activeTask.value;
  return task != null && isBatchSigningTaskRunning(task);
});

const displayRows = ref<BatchSigningTaskRow[]>(props.task.rows);

function onPaginatedChange(rows: BatchSigningTaskRow[]) {
  displayRows.value = rows;
}

watch(
  () => props.task.rows,
  (allRows) => {
    displayRows.value = displayRows.value.map((displayRow) => {
      const updated = allRows.find((row) => row.rowIndex === displayRow.rowIndex);
      return updated ?? displayRow;
    });
  },
  { deep: true },
);

function onSystemBarClose() {
  if (isRunning.value) {
    return;
  }
  emit('close');
}

function onConfirmStopSigning() {
  stopBatchSigningTask();
}
</script>

<template>
  <SigningBatchPopupSlotChrome
    :inner-backdrop="innerBackdrop"
    :show-system-bar-close="false"
    :scroll-fade-top-enabled="false"
    :show-toolbar="false"
    content-fill
    content-inset-preset="xs"
    @close="onSystemBarClose"
  >
    <SigningBatchProgressPage :task="task" :rows="displayRows" />

    <template #footer>
      <SigningBatchDataListPaginerBar
        :items="task.rows"
        @paginated-change="onPaginatedChange"
      >
        <template v-if="isRunning" #actions>
          <EgConfirmPopover
            :title="ui('Stop Signing')"
            :message="
              ui(
                'After stopping, transactions that have not yet been signed will no longer be signed, while transactions that have already been signed will not be affected. Are you sure you want to stop the current batch signing task?',
              )
            "
            :confirm-label="ui('Confirm')"
            :close-label="ui('Close')"
            placement="top"
            :width="POPOVER_PRESET_WIDTH_BASE"
            @confirm="onConfirmStopSigning"
          >
            <template #trigger="{ onClick }">
              <EgButton
                tone="danger"
                variant="solid"
                size="md"
                @click="onClick"
              >
                {{ ui('Stop Signing') }}
              </EgButton>
            </template>
          </EgConfirmPopover>
        </template>
        <template v-else #actions>
          <EgButton
            tone="decor"
            variant="solid"
            size="md"
            @click="emit('close')"
          >
            {{ ui('Close') }}
          </EgButton>
        </template>
      </SigningBatchDataListPaginerBar>
    </template>
  </SigningBatchPopupSlotChrome>
</template>
