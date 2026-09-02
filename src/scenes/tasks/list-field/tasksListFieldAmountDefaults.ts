import { buildAmountRowValues } from './tasksListFieldAmountRowData';
import { buildTransferTypeRowValues } from './tasksListFieldBusinessTypeRowData';
import { resolveCurrencyRowPreset } from './tasksListFieldCurrencyRowData';
import { buildBusinessTypeSecondaryLabel } from './businessTypeDisplay';
import {
  buildListApplicationTimeSecondaryValue,
  shouldShowListBusinessTypeCountdown,
} from './tasksListFieldGeneralStructureDefaults';
import { isSentRequestDataListMenu } from '../tasksDataListPageData';

/** Showcase list-field-amount customizeDefaults — Data List 金额列。 */
export const tasksListFieldAmountDefaults: Record<string, unknown> = {
  amountType: 'conversion',
  fiatValue: '$12,500.01',
  cryptoValue: '12,500.000001',
  cryptoSymbol: 'USDT',
  showCryptoIcon: true,
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
  menuItem?: string,
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
    const currencyPreset = resolveCurrencyRowPreset(rowIndex);
    const rowAmount = buildAmountRowValues(rowIndex);
    customize.cryptoSymbol = rowAmount.cryptoSymbol;
    customize.cryptoName = currencyPreset.cryptoName;
    customize.cryptoValue = rowAmount.cryptoValue;
    customize.fiatValue = rowAmount.fiatValue;
    customize.showNetwork = currencyPreset.showNetwork;
    customize.networkLabel = currencyPreset.networkLabel ?? '';
    customize.showCountdown = false;

    if (isSentRequestDataListMenu(menuItem)) {
      customize.secondaryValue = buildBusinessTypeSecondaryLabel(rowIndex);
      const transferType = buildTransferTypeRowValues(rowIndex);
      if (
        transferType.showCountdown
        && shouldShowListBusinessTypeCountdown(rowIndex, menuItem)
      ) {
        customize.showCountdown = true;
        customize.countdownHours = transferType.countdownHours;
        customize.countdownMinutes = transferType.countdownMinutes;
        customize.countdownSeconds = transferType.countdownSeconds;
        customize.countdownAlign = transferType.countdownAlign ?? 'left';
        customize.countdownSuffixKey = 'Expires in xx:xx';
      }
    } else {
      customize.secondaryValue = buildListApplicationTimeSecondaryValue(rowIndex);
    }
  }
  return customize;
}
