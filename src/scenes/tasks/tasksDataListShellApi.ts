import { shallowRef } from 'vue';

/** 列表页 · Shell 外 QA 可调用的反馈 API。 */
export type TasksDataListShellApi = {
  setListEmpty: (empty: boolean) => void;
  setListLoading: (loading: boolean) => void;
  showDangerToast: (message: string) => void;
  showSuccessFeedback: (messageKey: string) => void;
};

export const tasksDataListShellApiRegistry = shallowRef<TasksDataListShellApi | null>(null);

export function registerTasksDataListShellApi(api: TasksDataListShellApi | null) {
  tasksDataListShellApiRegistry.value = api;
}
