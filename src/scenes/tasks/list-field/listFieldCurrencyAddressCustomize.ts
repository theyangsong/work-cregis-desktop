import {
  addressMatchesFamily,
  resolveAddressFamily,
  resolveSampleAddressForSymbol,
  sideAddressPoolIndex,
  type CryptoAddressFamily,
} from './listFieldCryptoSampleAddresses';
import {
  MAX_CURRENCY_SIDE_ADDRESSES,
  currencyAddressTagsEnabledKey,
  parseCurrencyAddressCount,
} from './listFieldCurrencyShared';

function resolveDefaultSideAddress(
  symbol: string,
  prefix: 'from' | 'to',
  itemIndex: number,
  familyOverride?: CryptoAddressFamily,
): string {
  return resolveSampleAddressForSymbol(
    symbol,
    sideAddressPoolIndex(prefix, itemIndex),
    familyOverride,
  );
}

export function syncCurrencyAddressesForSymbol(
  state: Record<string, unknown>,
  symbol: string,
  familyOverride?: CryptoAddressFamily,
): void {
  const family = resolveAddressFamily(symbol, familyOverride);

  for (const prefix of ['from', 'to'] as const) {
    const count = parseCurrencyAddressCount(state[`${prefix}AddressCount`]);

    for (let index = 1; index <= Math.min(count, MAX_CURRENCY_SIDE_ADDRESSES); index += 1) {
      const key = `${prefix}Address${index}`;
      const current = String(state[key] ?? '').trim();
      if (!current || !addressMatchesFamily(current, family)) {
        state[key] = resolveDefaultSideAddress(symbol, prefix, index, familyOverride);
      }
    }
  }
}

export function currencySideAddressDefaults(
  prefix: 'from' | 'to',
  symbol = 'ZEC',
): Record<string, string | boolean> {
  const defaults: Record<string, string | boolean> = {
    [`${prefix}AddressCount`]: '1',
  };

  for (let index = 1; index <= MAX_CURRENCY_SIDE_ADDRESSES; index += 1) {
    defaults[`${prefix}Address${index}`] =
      index === 1 ? resolveDefaultSideAddress(symbol, prefix, index) : '';
    defaults[`${prefix}Alias${index}`] = '';
    defaults[currencyAddressTagsEnabledKey(prefix, index)] = index === 1;
  }

  return defaults;
}

export type CurrencySideAddressData = {
  address: string;
  alias: string;
  count: number;
  addresses: string[];
};

export function buildCurrencySideAddressData(
  prefix: 'from' | 'to',
  state: Record<string, unknown>,
): CurrencySideAddressData {
  const symbol = String(state.symbol ?? 'ZEC');
  const count = parseCurrencyAddressCount(state[`${prefix}AddressCount`]);
  const rawAddresses: string[] = [];
  const rawAliases: string[] = [];

  for (let index = 1; index <= count; index += 1) {
    if (index <= MAX_CURRENCY_SIDE_ADDRESSES) {
      const address = String(state[`${prefix}Address${index}`] ?? '').trim();
      rawAddresses.push(address || resolveDefaultSideAddress(symbol, prefix, index));
      rawAliases.push(String(state[`${prefix}Alias${index}`] ?? '').trim());
      continue;
    }

    rawAddresses.push(resolveDefaultSideAddress(symbol, prefix, index));
    rawAliases.push('');
  }

  const address = rawAddresses[0] ?? resolveDefaultSideAddress(symbol, prefix, 1);
  const alias = rawAliases[0] ?? '';
  const addresses = rawAddresses.map((item, index) => {
    const itemAlias = rawAliases[index];
    return itemAlias ? `${itemAlias} ${item}` : item;
  });

  return { address, alias, count, addresses };
}

export { currencyAddressTagsEnabledKey, parseCurrencyAddressCount } from './listFieldCurrencyShared';
