import {
  parseAmountSortValue,
  type TasksDataListSortOrder,
} from '../../tasksDataListSort';
import type { SigningBatchRowModel } from './types';

export function sortSigningBatchRowsByAmount(
  rows: readonly SigningBatchRowModel[],
  order: TasksDataListSortOrder,
): SigningBatchRowModel[] {
  const direction = order === 'asc' ? 1 : -1;
  return [...rows].sort((rowA, rowB) => {
    const amountA = parseAmountSortValue(rowA.amountCrypto);
    const amountB = parseAmountSortValue(rowB.amountCrypto);
    return (amountA - amountB) * direction;
  });
}
