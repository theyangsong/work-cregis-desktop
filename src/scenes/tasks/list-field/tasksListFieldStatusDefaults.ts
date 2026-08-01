import { buildStatusRowValues, defaultStatusRowValues } from './tasksListFieldStatusRowData';

/** Showcase list-field-status customizeDefaults — Data List Status 列。 */
export const tasksListFieldStatusDefaults: Record<string, unknown> = {
  size: 'lg',
  family: 'status',
  status: 'success',
  label: 'Success',
  truncate: true,
  minWidth: '',
};

export function columnMinWidthForStatusCustomize(columnMinWidth: string): string {
  return columnMinWidth.replace(/px$/i, '').trim();
}

export function buildTasksListFieldStatusCustomize(
  columnMinWidth = '',
  rowIndex?: number,
  menuItem?: string,
): Record<string, unknown> {
  const customize = { ...tasksListFieldStatusDefaults };
  const defaultStatus = defaultStatusRowValues(menuItem);
  customize.status = defaultStatus.status;
  customize.label = defaultStatus.label;

  const minWidth = columnMinWidthForStatusCustomize(columnMinWidth);
  if (minWidth) {
    customize.minWidth = minWidth;
  }
  if (rowIndex != null && Number.isFinite(rowIndex)) {
    const rowStatus = buildStatusRowValues(rowIndex, menuItem);
    customize.status = rowStatus.status;
    customize.label = rowStatus.label;
  }
  return customize;
}
