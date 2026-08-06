import { buildAmountRowValues } from './tasksListFieldAmountRowData';
import { buildTransferTypeRowValues } from './tasksListFieldBusinessTypeRowData';

/** Showcase list-field-amount customizeDefaults — Data List 金额列。 */
export const tasksListFieldAmountDefaults: Record<string, unknown> = {
  amountType: 'conversion',
  fiatValue: '$12,500.01',
  cryptoValue: '12,500.000001',
  cryptoSymbol: 'USDT',
  minWidth: '',
  tooltipTrigger: 'hover',
};

export function columnMinWidthForAmountCustomize(columnMinWidth: string): string {
  return columnMinWidth.replace(/px$/i, '').trim();
}

export function buildTasksListFieldAmountCustomize(
  columnMinWidth = '',
  rowIndex?: number,
  columnAlign: 'left' | 'center' | 'right' = 'left',
): Record<string, unknown> {
  const customize = { ...tasksListFieldAmountDefaults };
  const minWidth = columnMinWidthForAmountCustomize(columnMinWidth);
  if (minWidth) {
    customize.minWidth = minWidth;
  }
  if (columnAlign === 'right') {
    customize.alignEnd = true;
  }
  if (rowIndex != null && Number.isFinite(rowIndex)) {
    const rowAmount = buildAmountRowValues(rowIndex);
    customize.cryptoSymbol = rowAmount.cryptoSymbol;
    customize.cryptoValue = rowAmount.cryptoValue;
    customize.fiatValue = rowAmount.fiatValue;

    const transferType = buildTransferTypeRowValues(rowIndex);
    customize.secondaryValue = transferType.value;
    if (transferType.showCountdown) {
      customize.showCountdown = true;
      customize.countdownMinutes = transferType.countdownMinutes;
      customize.countdownSeconds = transferType.countdownSeconds;
      customize.countdownAlign = transferType.countdownAlign ?? 'left';
    }
  }
  return customize;
}
