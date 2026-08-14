import { buildTasksListFieldAmountCustomize } from '../../list-field/tasksListFieldAmountDefaults';

/** 进度弹层金额行：主行对齐列表 Amount 列；副行展示矿工费。 */
export function buildProgressAmountListCustomize(
  rowIndex: number,
  minerFeeDisplay: string,
  columnMinWidth = '',
) {
  const base = buildTasksListFieldAmountCustomize(
    columnMinWidth,
    rowIndex,
    'left',
    'Signing',
  );

  return {
    ...base,
    secondaryValue: minerFeeDisplay,
    showCountdown: false,
  };
}
