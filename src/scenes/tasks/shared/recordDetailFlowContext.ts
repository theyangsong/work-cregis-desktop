import { shallowRef } from 'vue';
import type { useRecordDetailFlow } from './useRecordDetailFlow';

export type RecordDetailFlowInstance = ReturnType<typeof useRecordDetailFlow>;

export const recordDetailFlowRegistry = shallowRef<RecordDetailFlowInstance | null>(null);

export function registerRecordDetailFlow(flow: RecordDetailFlowInstance | null) {
  recordDetailFlowRegistry.value = flow;
}
