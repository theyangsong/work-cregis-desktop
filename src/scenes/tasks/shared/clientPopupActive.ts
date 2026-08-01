import { computed } from 'vue';
import { approvalFlowRegistry } from '@/scenes/tasks/approval/approvalFlowContext';
import {
  batchSigningProgressPopupOpen,
  batchSigningStopConfirmOpen,
} from '@/scenes/tasks/signing/batch/batchSigningProgressUiStore';
import { signingBatchFlowRegistry } from '@/scenes/tasks/signing/batch/signingBatchFlowContext';
import { signingFlowRegistry } from '@/scenes/tasks/signing/signingFlowContext';
import { recordDetailFlowRegistry } from './recordDetailFlowContext';

/** 任一客户端 EgPopup 是否处于打开态（非 flow 是否注册）。 */
export function isClientPopupActive(): boolean {
  const approval = approvalFlowRegistry.value;
  if (
    approval
    && (
      approval.detailOpen.value
      || approval.verifyOpen.value
      || approval.viewMoreOpen.value
    )
  ) {
    return true;
  }

  const signing = signingFlowRegistry.value;
  if (
    signing
    && (
      signing.detailOpen.value
      || signing.verifyOpen.value
      || signing.progressOpen.value
      || signing.multiSignOpen.value
      || signing.viewMoreOpen.value
    )
  ) {
    return true;
  }

  const signingBatch = signingBatchFlowRegistry.value;
  if (
    signingBatch
    && (
      signingBatch.signConfirmOpen.value
      || signingBatch.quotaAlertOpen.value
      || signingBatch.verifyOpen.value
      || signingBatch.stopConfirmOpen.value
    )
  ) {
    return true;
  }

  if (batchSigningProgressPopupOpen.value || batchSigningStopConfirmOpen.value) {
    return true;
  }

  const recordDetail = recordDetailFlowRegistry.value;
  if (
    recordDetail
    && (
      recordDetail.detailOpen.value
      || recordDetail.viewMoreOpen.value
    )
  ) {
    return true;
  }

  return false;
}

export const clientPopupActive = computed(() => isClientPopupActive());
