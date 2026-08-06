import { buildGeneralStructureRowValues } from './tasksListFieldGeneralStructureRowData';

/** Showcase list-field-general-structure customizeDefaults — Data List 通用结构列。 */
export const tasksListFieldGeneralStructureDefaults: Record<string, unknown> = {
  value: 'Name (t******c@gmail.com)',
  secondaryValue: '2026-07-19 14:30:00',
  lineLayout: 'double',
  minWidth: '',
  copyOnRowHover: false,
  tooltipTrigger: 'hover',
  showRightTag: false,
  showLeftTag: false,
  leftSystemType: 'stroke-solid',
  leftLabel: 'Me',
  rightSystemType: 'stroke-subtle',
  rightLabel: 'Tag',
};

export function columnMinWidthForGeneralStructureCustomize(columnMinWidth: string): string {
  return columnMinWidth.replace(/px$/i, '').trim();
}

export function buildTasksListFieldGeneralStructureCustomize(
  columnMinWidth = '',
  rowIndex?: number,
): Record<string, unknown> {
  const customize = { ...tasksListFieldGeneralStructureDefaults };
  const minWidth = columnMinWidthForGeneralStructureCustomize(columnMinWidth);
  if (minWidth) {
    customize.minWidth = minWidth;
  }
  if (rowIndex != null && Number.isFinite(rowIndex)) {
    Object.assign(customize, buildGeneralStructureRowValues(rowIndex));
  }
  return customize;
}
