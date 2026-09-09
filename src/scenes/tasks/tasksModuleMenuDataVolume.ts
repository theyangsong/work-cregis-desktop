import { ref } from 'vue';
import {
  DATA_LIST_APPROVAL_ROW_COUNT,
  DATA_LIST_SIGNING_ROW_COUNT,
  isTasksDataListMenuItem,
  type TasksDataListMenuItemLabel,
} from './tasksDataListPageData';

type TodoModuleMenuItemLabel = Extract<TasksDataListMenuItemLabel, 'Approval' | 'Signing'>;

/** Module Menu EgMessage：跟列表数据量，与待办 / 批处理资格无关。 */
export const tasksModuleMenuDataVolumes = ref<
  Record<TodoModuleMenuItemLabel, number>
>({
  Approval: DATA_LIST_APPROVAL_ROW_COUNT,
  Signing: DATA_LIST_SIGNING_ROW_COUNT,
});

export function syncTasksModuleMenuDataVolume(
  menuItem: string,
  rowCount: number,
) {
  if (menuItem !== 'Approval' && menuItem !== 'Signing') return;
  tasksModuleMenuDataVolumes.value[menuItem] = Math.max(0, rowCount);
}
