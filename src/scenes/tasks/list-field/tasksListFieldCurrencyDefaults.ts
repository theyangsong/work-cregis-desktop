import {
  currencySideAddressDefaults,
} from './listFieldCurrencyAddressCustomize';
import { applyCurrencyDemoRowOverrides } from './tasksListFieldCurrencyDemoRow';
import { buildCurrencyRowPresetCustomize } from './tasksListFieldCurrencyRowData';
import {
  applyCurrencyRowTagVisibility,
  currencyTagCustomizeDefaults,
} from './listFieldCurrencyTagCustomize';

/** Showcase list-field-currency customizeDefaults — Data List 首列币种。 */
export const tasksListFieldCurrencyDefaults: Record<string, unknown> = {
  minWidth: '278',
  symbol: 'ZEC',
  showNetwork: true,
  networkLabel: 'Base',
  entryBadgeMode: 'none',
  addressTooltipTrigger: 'hover',
  comboMode: 'single-address',
  ...currencySideAddressDefaults('from', 'ZEC'),
  ...currencySideAddressDefaults('to', 'ZEC'),
  ...currencyTagCustomizeDefaults(),
};

export function columnMinWidthForCurrencyCustomize(columnMinWidth: string): string {
  return columnMinWidth.replace(/px$/i, '').trim();
}

export function buildTasksListFieldCurrencyCustomize(
  rowIndex?: number,
  columnMinWidth = '',
): Record<string, unknown> {
  let customize = { ...tasksListFieldCurrencyDefaults };
  const minWidth = columnMinWidthForCurrencyCustomize(columnMinWidth);
  if (minWidth) {
    customize.minWidth = minWidth;
  }
  if (rowIndex != null) {
    customize = { ...customize, ...buildCurrencyRowPresetCustomize(rowIndex) };
    customize = applyCurrencyDemoRowOverrides(customize, rowIndex);
    return applyCurrencyRowTagVisibility(customize, rowIndex);
  }
  return customize;
}
