<script setup lang="ts">
import { computed, toRef } from 'vue';
import { EgPopup } from '@eds/desktop-components';
import { usePopupShellLifecycle } from '../../shared/usePopupShellLifecycle';
import {
  getActiveBatchSigningTask,
  isBatchSigningTaskRunning,
} from './batchSigningTaskStore';
import {
  BATCH_SIGN_PROGRESS_POPUP_HEIGHT,
  BATCH_SIGN_PROGRESS_POPUP_WIDTH,
} from './batchSigning.constants';
import SigningBatchProgressShell from './SigningBatchProgressShell.vue';
import type { BatchSigningTask } from './types';

const props = defineProps<{
  open: boolean;
  task: BatchSigningTask;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  close: [];
}>();

const activeTask = getActiveBatchSigningTask();

const isRunning = computed(() => {
  const task = activeTask.value;
  return task != null && isBatchSigningTaskRunning(task);
});

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  onClosed: () => {
    if (isRunning.value) {
      return;
    }
    emit('update:open', false);
    emit('close');
  },
});

const guardedPopupOpen = computed({
  get: () => popupOpen.value,
  set: (value: boolean) => {
    if (value) {
      popupOpen.value = true;
      return;
    }
    if (!isRunning.value) {
      popupOpen.value = false;
    }
  },
});

function onClose() {
  popupOpen.value = false;
}

function onPopupClose() {
  if (popupOpen.value) {
    return;
  }
  onPopupClosed();
}

</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="guardedPopupOpen"
    uses="custom"
    :box-width="BATCH_SIGN_PROGRESS_POPUP_WIDTH"
    :box-height="BATCH_SIGN_PROGRESS_POPUP_HEIGHT"
    @close="onPopupClose"
  >
    <SigningBatchProgressShell
      :task="task"
      @close="onClose"
    />
  </EgPopup>
</template>
