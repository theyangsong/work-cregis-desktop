<script setup lang="ts">
import { computed } from 'vue';
import { getActiveBatchSigningTask, isBatchSigningTaskRunning } from './batchSigningTaskStore';
import {
  batchSigningProgressPopupOpen,
  onBatchSigningProgressPopupClose,
} from './batchSigningProgressUiStore';
import SigningBatchProgressPopup from './SigningBatchProgressPopup.vue';

const activeTask = getActiveBatchSigningTask();

const progressOpen = computed({
  get: () =>
    batchSigningProgressPopupOpen.value
    && activeTask.value != null,
  set: (open: boolean) => {
    if (!open) {
      const task = activeTask.value;
      if (task && isBatchSigningTaskRunning(task)) {
        return;
      }
      onBatchSigningProgressPopupClose();
    }
  },
});
</script>

<template>
  <div
    v-if="activeTask"
    class="signing-batch-global-progress-host"
  >
    <SigningBatchProgressPopup
      v-if="batchSigningProgressPopupOpen"
      v-model:open="progressOpen"
      :task="activeTask"
      @close="onBatchSigningProgressPopupClose"
    />
  </div>
</template>

<style scoped>
.signing-batch-global-progress-host {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.signing-batch-global-progress-host :deep(.eds-popup) {
  pointer-events: auto;
}
</style>
