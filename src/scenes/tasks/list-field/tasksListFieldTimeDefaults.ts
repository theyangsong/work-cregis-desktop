import { buildApplicationTimeSecondaryValue } from './businessTypeDisplay';

/** Showcase list-field-time customizeDefaults — 申请时间列。 */
export const tasksListFieldTimeDefaults: Record<string, unknown> = {
  datetime: '2026-07-19 14:30:00',
  lineLayout: 'single',
  minWidth: '',
  tooltipTrigger: 'hover',
};

export function columnMinWidthForTimeCustomize(columnMinWidth: string): string {
  return columnMinWidth.replace(/px$/i, '').trim();
}

export function buildTasksListFieldTimeCustomize(
  columnMinWidth = '',
  rowIndex?: number,
): Record<string, unknown> {
  const customize = { ...tasksListFieldTimeDefaults };
  const minWidth = columnMinWidthForTimeCustomize(columnMinWidth);
  if (minWidth) {
    customize.minWidth = minWidth;
  }
  if (rowIndex != null && Number.isFinite(rowIndex)) {
    customize.datetime = buildApplicationTimeSecondaryValue(rowIndex);
  }
  return customize;
}
