import { buildPayoutWalletsColumnValues } from './tasksListFieldBusinessTypeRowData';
import { buildGeneralStructureRowValues } from './tasksListFieldGeneralStructureRowData';

/** Showcase list-field-general-structure — Payout Wallets 列（单行 Title + Tooltip）。 */
export const tasksListFieldBusinessTypeDefaults: Record<string, unknown> = {
  value: 'Payout Wallets',
  lineLayout: 'single',
  minWidth: '',
  copyOnRowHover: false,
  tooltipTrigger: 'hover',
  showRightTag: true,
  showLeftTag: false,
  rightSystemType: 'gray',
  rightLabel: 'Single-Sign',
};

export function columnMinWidthForBusinessTypeCustomize(columnMinWidth: string): string {
  return columnMinWidth.replace(/px$/i, '').trim();
}

export function buildTasksListFieldBusinessTypeCustomize(
  columnMinWidth = '',
  rowIndex?: number,
  menuItem?: string,
): Record<string, unknown> {
  const customize = { ...tasksListFieldBusinessTypeDefaults };
  const minWidth = columnMinWidthForBusinessTypeCustomize(columnMinWidth);
  if (minWidth) {
    customize.minWidth = minWidth;
  }
  if (rowIndex != null && Number.isFinite(rowIndex)) {
    if (menuItem === 'Sent Request') {
      const wallet = buildPayoutWalletsColumnValues(rowIndex);
      const createdTime = buildGeneralStructureRowValues(rowIndex).secondaryValue;
      Object.assign(customize, {
        lineLayout: 'double',
        value: wallet.value,
        secondaryValue: createdTime,
        showRightTag: true,
        showLeftTag: false,
        rightLabel: wallet.rightLabel,
        rightSystemType: 'gray',
      });
      return customize;
    }
    Object.assign(customize, buildPayoutWalletsColumnValues(rowIndex));
  }
  return customize;
}
