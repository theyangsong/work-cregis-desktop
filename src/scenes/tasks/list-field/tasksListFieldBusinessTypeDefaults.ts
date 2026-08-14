import {
  buildCurrencySideAddressData,
  currencySideAddressDefaults,
} from './listFieldCurrencyAddressCustomize';
import { currencyAddressTagsEnabledKey } from './listFieldCurrencyShared';
import {
  currencyAddressCustomTagLabelOverrides,
  currencyTagShowKey,
} from './listFieldCurrencyTagCustomize';
import { buildTasksListFieldCurrencyCustomize } from './tasksListFieldCurrencyDefaults';
import type { AppLocale } from '@/composables/useAppLocale';
import { buildPayoutWalletsColumnValues, buildSenderWalletDisplayName } from './tasksListFieldBusinessTypeRowData';

/** 第 2 条（0-based index 1）：发送方展示 1 个自定义 Tag（Coinbase）。 */
export const SENDER_DEMO_ROW_COINBASE_TAG_INDEX = 1;

const defaultFromSide = currencySideAddressDefaults('from', 'ZEC');
const defaultFromAddress = buildCurrencySideAddressData('from', {
  symbol: 'ZEC',
  ...defaultFromSide,
});

/** 发送方列：别名 / 地址 + 副行钱包名（与详情出款钱包同源）。 */
export const tasksListFieldBusinessTypeDefaults: Record<string, unknown> = {
  ...defaultFromSide,
  symbol: 'ZEC',
  minWidth: '',
  address: defaultFromAddress.address,
  addressSecondaryText: '',
  addressTooltipTrigger: 'hover',
  showRowTag: false,
  rightLabel: 'Multi-Sign',
  rowTagSystemType: 'gray',
};

export function columnMinWidthForBusinessTypeCustomize(columnMinWidth: string): string {
  return columnMinWidth.replace(/px$/i, '').trim();
}

export function buildTasksListFieldBusinessTypeCustomize(
  columnMinWidth = '',
  rowIndex?: number,
  menuItem?: string,
  locale: AppLocale = 'en',
): Record<string, unknown> {
  const customize = { ...tasksListFieldBusinessTypeDefaults };
  const minWidth = columnMinWidthForBusinessTypeCustomize(columnMinWidth);
  if (minWidth) {
    customize.minWidth = minWidth;
  }
  if (rowIndex != null && Number.isFinite(rowIndex)) {
    const currencyCustomize = buildTasksListFieldCurrencyCustomize(rowIndex, columnMinWidth);
    const wallet = buildPayoutWalletsColumnValues(rowIndex);
    const fromAddress = buildCurrencySideAddressData('from', currencyCustomize);

    Object.assign(customize, currencyCustomize, {
      minWidth: customize.minWidth,
      address: fromAddress.address,
      addressSecondaryText: buildSenderWalletDisplayName(rowIndex, locale),
      showRowTag: wallet.rightLabel === 'Multi-Sign',
      rightLabel: wallet.rightLabel,
      rowTagSystemType: 'gray',
      addressTooltipTrigger: 'hover',
    });

    if (rowIndex === SENDER_DEMO_ROW_COINBASE_TAG_INDEX) {
      Object.assign(customize, {
        [currencyAddressTagsEnabledKey('from', 1)]: true,
        [currencyTagShowKey('from', 1, 'system')]: false,
        ...currencyAddressCustomTagLabelOverrides('from', 1, ['Coinbase'], true),
      });
    }
  }
  return customize;
}
