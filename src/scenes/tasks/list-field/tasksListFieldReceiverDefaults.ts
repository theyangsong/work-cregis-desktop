import { buildTasksListFieldCurrencyCustomize } from './tasksListFieldCurrencyDefaults';

/** 接收方列 min-width 与原先币种列一致。 */
export function buildTasksListFieldReceiverCustomize(
  rowIndex?: number,
  columnMinWidth = '',
  menuItem?: string,
): Record<string, unknown> {
  return buildTasksListFieldCurrencyCustomize(rowIndex, columnMinWidth, menuItem);
}
