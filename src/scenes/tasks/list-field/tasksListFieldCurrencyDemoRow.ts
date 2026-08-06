import { MAX_CURRENCY_SIDE_ADDRESSES, currencyAddressTagsEnabledKey } from './listFieldCurrencyShared';
import {
  CURRENCY_CUSTOM_TAG_DEFAULT_COUNT,
  CURRENCY_DEMO_ROW_WITH_TAGS_INDEX,
  currencyAddressCustomTagOverrides,
} from './listFieldCurrencyTagCustomize';
import {
  resolveSampleAddressForSymbol,
  sideAddressPoolIndex,
} from './listFieldCryptoSampleAddresses';
import { getCurrencyRowPreset } from './tasksListFieldCurrencyRowPresets';

function seededFraction(seed: number): number {
  const x = Math.sin(seed * 9973) * 10000;
  return x - Math.floor(x);
}

/** 演示行 from 地址：保留首条别名，其余槽位用不同 index 打散，避免 23 条过于雷同。 */
function buildDemoFromAddressOverrides(
  customize: Record<string, unknown>,
  count: number,
  rowIndex: number,
): Record<string, unknown> {
  const symbol = String(customize.symbol ?? 'ZEC');
  const preset = getCurrencyRowPreset(rowIndex);
  const familyOverride = preset?.addressFamily;

  const primary = String(customize.fromAddress1 ?? '').trim();
  const used = new Set<string>(primary ? [primary] : []);
  const entries: Record<string, unknown> = {};

  const indexOrder = Array.from({ length: count - 1 }, (_, offset) => offset + 2);
  for (let i = indexOrder.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededFraction(rowIndex * 53 + i) * (i + 1));
    [indexOrder[i], indexOrder[j]] = [indexOrder[j], indexOrder[i]];
  }

  let cursor = 0;
  for (const addressIndex of indexOrder) {
    let poolIndex = sideAddressPoolIndex('from', addressIndex + rowIndex * 3);
    let address = resolveSampleAddressForSymbol(symbol, poolIndex, familyOverride);

    while (used.has(address) && cursor < count * 4) {
      cursor += 1;
      poolIndex = sideAddressPoolIndex('from', addressIndex + rowIndex * 3 + cursor * 7);
      address = resolveSampleAddressForSymbol(symbol, poolIndex, familyOverride);
    }

    used.add(address);
    if (addressIndex <= MAX_CURRENCY_SIDE_ADDRESSES) {
      entries[`fromAddress${addressIndex}`] = address;
    }
  }

  return entries;
}

/** 第 3 条演示行：发送方 23 地址、首条别名 Mr. Wang；Danger + 5 个自定义 Tag。 */
export function applyCurrencyDemoRowOverrides(
  customize: Record<string, unknown>,
  rowIndex: number,
): Record<string, unknown> {
  if (rowIndex !== CURRENCY_DEMO_ROW_WITH_TAGS_INDEX) {
    return customize;
  }

  return {
    ...customize,
    fromAddressCount: '23',
    fromAlias1: 'Mr. Wang',
    ...buildDemoFromAddressOverrides(customize, 23, rowIndex),
    [currencyAddressTagsEnabledKey('from', 1)]: true,
    [currencyAddressTagsEnabledKey('to', 1)]: true,
    ...currencyAddressCustomTagOverrides('from', 1, CURRENCY_CUSTOM_TAG_DEFAULT_COUNT, true),
    ...currencyAddressCustomTagOverrides('to', 1, CURRENCY_CUSTOM_TAG_DEFAULT_COUNT, true),
  };
}
