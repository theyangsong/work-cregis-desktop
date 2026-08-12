import { computed, ref } from 'vue';
import {
  clearBatchSigningTask,
  getActiveBatchSigningTask,
  isBatchSigningTaskIncomplete,
} from './batchSigningTaskStore';

/**
 * 批量签名进度呈现：
 * - popup：全屏 EgPopup（签名进行中不可收起 / 点遮罩关闭）
 * - hidden：无任务或用户已关闭结果页
 */
export type BatchSigningProgressPresentation = 'hidden' | 'popup';

const presentation = ref<BatchSigningProgressPresentation>('hidden');

/** 停止签名确认弹窗。 */
export const batchSigningStopConfirmOpen = ref(false);

export const batchSigningProgressPopupOpen = computed(
  () => presentation.value === 'popup',
);

let listRefreshHandler: (() => void) | null = null;

export function setBatchSigningListRefreshHandler(handler: (() => void) | null) {
  listRefreshHandler = handler;
}

export function getBatchSigningProgressPresentation() {
  return presentation;
}

export function openBatchSigningProgressPopup() {
  if (!getActiveBatchSigningTask().value) return;
  presentation.value = 'popup';
}

export function closeBatchSigningProgress() {
  clearBatchSigningTask();
  presentation.value = 'hidden';
  batchSigningStopConfirmOpen.value = false;
  listRefreshHandler?.();
}

export function onBatchSigningProgressPopupClose() {
  const task = getActiveBatchSigningTask().value;
  if (!task) {
    closeBatchSigningProgress();
    return;
  }
  if (isBatchSigningTaskIncomplete(task)) {
    return;
  }
  closeBatchSigningProgress();
}

/** 离开列表页 / 切换菜单时：进行中进度弹窗保持打开，不收起。 */
export function suspendBatchSigningProgressPopup() {
  const task = getActiveBatchSigningTask().value;
  if (!task) {
    presentation.value = 'hidden';
  }
}

export function hasActiveBatchSigningSession(): boolean {
  return getActiveBatchSigningTask().value != null;
}
