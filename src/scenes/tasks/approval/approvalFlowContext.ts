import { shallowRef } from 'vue';
import type { useApprovalFlow } from './useApprovalFlow';

export type ApprovalFlowInstance = ReturnType<typeof useApprovalFlow>;

/** 审批 Popup 流程实例；由 Tasks 页注册，客户端 shell 消费（EgPopup 挂载规则）。 */
export const approvalFlowRegistry = shallowRef<ApprovalFlowInstance | null>(null);

export function registerApprovalFlow(flow: ApprovalFlowInstance | null) {
  approvalFlowRegistry.value = flow;
}
