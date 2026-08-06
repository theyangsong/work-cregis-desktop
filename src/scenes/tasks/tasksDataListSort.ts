import { buildAmountRowValues } from './list-field/tasksListFieldAmountRowData';
import { buildGeneralStructureRowValues } from './list-field/tasksListFieldGeneralStructureRowData';

export type TasksDataListSortKey = 'created-time' | 'amount';
export type TasksDataListSortOrder = 'asc' | 'desc';

export type TasksDataListActiveSort = {
  key: TasksDataListSortKey;
  order: TasksDataListSortOrder;
};

export function parseCreatedTimeSortValue(secondaryValue: string): number {
  const parsed = Date.parse(secondaryValue.trim().replace(' ', 'T'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseAmountSortValue(cryptoValue: string): number {
  const normalized = cryptoValue.replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareRowIndices(
  rowIndexA: number,
  rowIndexB: number,
  key: TasksDataListSortKey,
): number {
  if (key === 'created-time') {
    const timeA = parseCreatedTimeSortValue(
      buildGeneralStructureRowValues(rowIndexA).secondaryValue,
    );
    const timeB = parseCreatedTimeSortValue(
      buildGeneralStructureRowValues(rowIndexB).secondaryValue,
    );
    return timeA - timeB;
  }

  const amountA = parseAmountSortValue(buildAmountRowValues(rowIndexA).cryptoValue);
  const amountB = parseAmountSortValue(buildAmountRowValues(rowIndexB).cryptoValue);
  return amountA - amountB;
}

export function sortDataListRows(
  rows: Record<string, unknown>[],
  sort: TasksDataListActiveSort,
): Record<string, unknown>[] {
  const direction = sort.order === 'asc' ? 1 : -1;
  return [...rows].sort((rowA, rowB) => {
    const indexA = Number(rowA.id);
    const indexB = Number(rowB.id);
    if (!Number.isFinite(indexA) || !Number.isFinite(indexB)) return 0;
    return compareRowIndices(indexA, indexB, sort.key) * direction;
  });
}
