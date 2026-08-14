import { ref, shallowRef } from 'vue';
import {
  batchSigningProgressPopupOpen,
  batchSigningStopConfirmOpen,
} from './batchSigningProgressUiStore';
import type { SigningBatchFlowInstance } from './useSigningBatchFlow';

export const signingBatchFlowRegistry = shallowRef<SigningBatchFlowInstance | null>(null);

/** 签名列表批处理多选（Batch Bar）激活；为 true 时不铺 Popover 底层拦截层。 */
export const signingBatchSelectModeActive = ref(false);

export function registerSigningBatchFlow(flow: SigningBatchFlowInstance | null) {
  signingBatchFlowRegistry.value = flow;
}

export function setSigningBatchSelectModeActive(active: boolean) {
  signingBatchSelectModeActive.value = active;
}

/** 批处理会话进行中：不启用 click Popover 全屏拦截（避免挡 Batch Bar / 确认弹窗 / 矿工费 Popover）。 */
export function shouldSuppressFloatingOverlayInteractionBlock(): boolean {
  if (signingBatchSelectModeActive.value) {
    return true;
  }

  const flow = signingBatchFlowRegistry.value;
  if (
    flow?.signConfirmOpen.value
    || flow?.quotaAlertOpen.value
    || flow?.verifyOpen.value
    || flow?.stopConfirmOpen.value
  ) {
    return true;
  }

  if (batchSigningProgressPopupOpen.value || batchSigningStopConfirmOpen.value) {
    return true;
  }

  return false;
}
