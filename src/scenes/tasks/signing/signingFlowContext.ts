import { shallowRef } from 'vue';
import type { useSigningFlow } from './useSigningFlow';

export type SigningFlowInstance = ReturnType<typeof useSigningFlow>;

export const signingFlowRegistry = shallowRef<SigningFlowInstance | null>(null);

export function registerSigningFlow(flow: SigningFlowInstance | null) {
  signingFlowRegistry.value = flow;
}
