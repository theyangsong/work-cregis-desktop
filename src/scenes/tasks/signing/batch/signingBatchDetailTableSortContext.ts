import type { InjectionKey, Ref } from 'vue';
import type { TasksDataListSortOrder } from '../../tasksDataListSort';

export type SigningBatchDetailAmountSortContext = {
  amountSortOrder: Ref<TasksDataListSortOrder | ''>;
  setAmountSortOrder: (order: TasksDataListSortOrder | null) => void;
};

export const signingBatchDetailAmountSortKey: InjectionKey<SigningBatchDetailAmountSortContext> =
  Symbol('signingBatchDetailAmountSort');
