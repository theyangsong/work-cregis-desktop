import { shallowRef } from 'vue';
import type { SigningBatchFlowInstance } from './useSigningBatchFlow';

export const signingBatchFlowRegistry = shallowRef<SigningBatchFlowInstance | null>(null);

export function registerSigningBatchFlow(flow: SigningBatchFlowInstance | null) {
  signingBatchFlowRegistry.value = flow;
}
