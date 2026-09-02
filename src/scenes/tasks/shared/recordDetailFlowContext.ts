import { shallowRef } from 'vue';
import type { useRecordDetailFlow } from './useRecordDetailFlow';

export type RecordDetailFlowInstance = ReturnType<typeof useRecordDetailFlow>;

export const recordDetailFlowRegistry = shallowRef<RecordDetailFlowInstance | null>(null);

/** Popup host 与列表页同级挂载；菜单项单独注册，供 Detail 撤回判定。 */
export const recordDetailMenuItemRegistry = shallowRef<string | undefined>(undefined);

export function registerRecordDetailFlow(
  flow: RecordDetailFlowInstance | null,
  menuItem?: string,
) {
  recordDetailFlowRegistry.value = flow;
  recordDetailMenuItemRegistry.value = menuItem;
}
