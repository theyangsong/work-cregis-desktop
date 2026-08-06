import { cryptoNames, getProcessedCrypto, type CryptoName } from '@eds/desktop-components';
import { resolveCryptoNameFromSymbol } from './listFieldCryptoResolve';
import {
  currencySideAddressDefaults,
  syncCurrencyAddressesForSymbol,
} from './listFieldCurrencyAddressCustomize';
import {
  getPinnedAddressForRow,
  resolveSampleAddressForSymbol,
  sideAddressPoolIndex,
  type CryptoAddressFamily,
} from './listFieldCryptoSampleAddresses';
import {
  CURRENCY_PRESET_SYMBOLS,
  getCurrencyRowPreset,
  type CurrencyRowPreset,
} from './tasksListFieldCurrencyRowPresets';

let randomCurrencyPoolCache: string[] | null = null;

function extractTickerFromCryptoName(name: CryptoName): string {
  const ticker = name.split('-')[1]?.trim().toUpperCase();
  return ticker ?? '';
}

function buildRandomCurrencyPool(): string[] {
  if (randomCurrencyPoolCache) return randomCurrencyPoolCache;

  const seen = new Set<string>();
  for (const name of cryptoNames) {
    if (!getProcessedCrypto(name)) continue;
    const ticker = extractTickerFromCryptoName(name);
    if (!ticker || CURRENCY_PRESET_SYMBOLS.has(ticker) || seen.has(ticker)) continue;
    if (!resolveCryptoNameFromSymbol(ticker)) continue;
    seen.add(ticker);
  }

  randomCurrencyPoolCache = [...seen].sort();
  return randomCurrencyPoolCache;
}

function resolveRandomCurrencySymbol(rowIndex: number): string {
  const pool = buildRandomCurrencyPool();
  if (pool.length === 0) return 'BTC';
  const offset = rowIndex - CURRENCY_PRESET_SYMBOLS.size;
  return pool[offset % pool.length] ?? pool[0];
}

function presetToCustomize(preset: CurrencyRowPreset, rowIndex: number): Record<string, unknown> {
  const customize: Record<string, unknown> = {
    symbol: preset.symbol,
    cryptoName: preset.cryptoName,
    showNetwork: preset.showNetwork,
    networkLabel: preset.networkLabel ?? '',
    ...currencySideAddressDefaults('from', preset.symbol),
    ...currencySideAddressDefaults('to', preset.symbol),
  };

  syncCurrencyAddressesForSymbol(customize, preset.symbol, preset.addressFamily);

  const fromSlot = sideAddressPoolIndex('from', rowIndex + 1);
  const pinnedAddress = getPinnedAddressForRow(rowIndex);
  customize.fromAddress1 =
    pinnedAddress ??
    resolveSampleAddressForSymbol(preset.symbol, fromSlot, preset.addressFamily);

  return customize;
}

function resolveRandomRowPreset(rowIndex: number): CurrencyRowPreset {
  const symbol = resolveRandomCurrencySymbol(rowIndex);
  const cryptoName = resolveCryptoNameFromSymbol(symbol) ?? 'eds-zec-zcash';

  return {
    symbol,
    cryptoName,
    showNetwork: false,
  };
}

export function resolveCurrencySymbolForRow(rowIndex: number): string {
  const preset = getCurrencyRowPreset(rowIndex) ?? resolveRandomRowPreset(rowIndex);
  return preset.symbol;
}

export function buildCurrencyRowPresetCustomize(rowIndex: number): Record<string, unknown> {
  const preset = getCurrencyRowPreset(rowIndex) ?? resolveRandomRowPreset(rowIndex);
  return presetToCustomize(preset, rowIndex);
}
