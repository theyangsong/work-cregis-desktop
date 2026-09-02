import { MAX_CURRENCY_SIDE_ADDRESSES, currencyAddressTagsEnabledKey } from './listFieldCurrencyShared';
import {
  CURRENCY_CUSTOM_TAG_DEFAULT_COUNT,
  CURRENCY_DEMO_ROW_TON_AML_TAG_INDEX,
  CURRENCY_DEMO_ROW_WITH_TAGS_INDEX,
  currencyAddressBlacklistTagOverrides,
  currencyAddressCustomTagOverrides,
  currencyTagShowKey,
} from './listFieldCurrencyTagCustomize';
import {
  resolveSampleAddressForSymbol,
  sideAddressPoolIndex,
} from './listFieldCryptoSampleAddresses';
import { resolveCurrencyRowPreset } from './tasksListFieldCurrencyRowData';
import { tasksDataListShowsAddressBlacklist } from '../tasksDataListPageData';

function seededFraction(seed: number): number {
  const x = Math.sin(seed * 9973) * 10000;
  return x - Math.floor(x);
}

/** 第 1 条（0-based index 0）：接收方地址别名。 */
export const CURRENCY_DEMO_ROW_FIRST_TO_ALIAS_INDEX = 0;

/** 第 20 条（0-based index 19）：接收方 20 地址。 */
export const CURRENCY_DEMO_ROW_MULTI_TO_ADDRESSES_INDEX = 19;
const CURRENCY_DEMO_ROW_MULTI_TO_ADDRESS_COUNT = MAX_CURRENCY_SIDE_ADDRESSES;

function buildDemoSideAddressOverrides(
  customize: Record<string, unknown>,
  prefix: 'from' | 'to',
  count: number,
  rowIndex: number,
): Record<string, unknown> {
  const symbol = String(customize.symbol ?? 'ZEC');
  const preset = resolveCurrencyRowPreset(rowIndex);
  const familyOverride = preset.addressFamily;

  const primaryKey = `${prefix}Address1`;
  const primary = String(customize[primaryKey] ?? '').trim();
  const used = new Set<string>(primary ? [primary] : []);
  const entries: Record<string, unknown> = {};

  const indexOrder = Array.from({ length: count - 1 }, (_, offset) => offset + 2);
  for (let i = indexOrder.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededFraction(rowIndex * 53 + i) * (i + 1));
    [indexOrder[i], indexOrder[j]] = [indexOrder[j], indexOrder[i]];
  }

  let cursor = 0;
  for (const addressIndex of indexOrder) {
    let poolIndex = sideAddressPoolIndex(prefix, addressIndex + rowIndex * 3);
    let address = resolveSampleAddressForSymbol(symbol, poolIndex, familyOverride);

    while (used.has(address) && cursor < count * 4) {
      cursor += 1;
      poolIndex = sideAddressPoolIndex(prefix, addressIndex + rowIndex * 3 + cursor * 7);
      address = resolveSampleAddressForSymbol(symbol, poolIndex, familyOverride);
    }

    used.add(address);
    if (addressIndex <= MAX_CURRENCY_SIDE_ADDRESSES) {
      entries[`${prefix}Address${addressIndex}`] = address;
    }
  }

  return entries;
}

/** 第 3 条演示行：发送方 23 笔订单（单地址）；接收方 Blacklist + 5 自定义 Tag。 */
export function applyCurrencyDemoRowOverrides(
  customize: Record<string, unknown>,
  rowIndex: number,
  menuItem?: string,
): Record<string, unknown> {
  const showBlacklist = tasksDataListShowsAddressBlacklist(menuItem);

  if (rowIndex === CURRENCY_DEMO_ROW_FIRST_TO_ALIAS_INDEX) {
    return {
      ...customize,
      toAlias1: 'Alex Mah.',
    };
  }

  /** 第 2 条（TON）：接收方单地址 + 黑名单 tag（仅待审批 / 待签名）。 */
  if (rowIndex === CURRENCY_DEMO_ROW_TON_AML_TAG_INDEX) {
    if (!showBlacklist) return customize;

    return {
      ...customize,
      [currencyAddressTagsEnabledKey('from', 1)]: false,
      [currencyAddressTagsEnabledKey('to', 1)]: true,
      [currencyTagShowKey('to', 1, 'custom')]: false,
      ...currencyAddressBlacklistTagOverrides('to', 1, 1, true),
    };
  }

  if (rowIndex === CURRENCY_DEMO_ROW_WITH_TAGS_INDEX) {
    return {
      ...customize,
      fromAddressCount: '1',
      fromOrderCount: '23',
      fromAlias1: 'Mr. Wang',
      [currencyAddressTagsEnabledKey('from', 1)]: false,
      [currencyAddressTagsEnabledKey('to', 1)]: true,
      ...(showBlacklist ? currencyAddressBlacklistTagOverrides('to', 1, 1, true) : {}),
      ...currencyAddressCustomTagOverrides('to', 1, CURRENCY_CUSTOM_TAG_DEFAULT_COUNT, true),
    };
  }

  if (rowIndex === CURRENCY_DEMO_ROW_MULTI_TO_ADDRESSES_INDEX) {
    return {
      ...customize,
      toAddressCount: String(CURRENCY_DEMO_ROW_MULTI_TO_ADDRESS_COUNT),
      ...buildDemoSideAddressOverrides(
        customize,
        'to',
        CURRENCY_DEMO_ROW_MULTI_TO_ADDRESS_COUNT,
        rowIndex,
      ),
    };
  }

  return customize;
}
