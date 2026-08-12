import { cryptoNames, getProcessedCrypto, type CryptoName } from '@eds/desktop-components';
import { resolveCryptoNameFromSymbol } from './listFieldCryptoResolve';
import {
  currencySideAddressDefaults,
  syncCurrencyAddressesForSymbol,
} from './listFieldCurrencyAddressCustomize';
import {
  getPinnedAddressForRow,
  resolveAddressFamily,
  resolveSampleAddressForSymbol,
  sideAddressPoolIndex,
} from './listFieldCryptoSampleAddresses';
import {
  CURRENCY_PRESET_SYMBOLS,
  FIXED_CURRENCY_PRESET_ROW_COUNT,
  getCurrencyRowPreset,
  type CurrencyRowPreset,
} from './tasksListFieldCurrencyRowPresets';
import { resolveSigningBatchDemoCurrencyPreset } from '../signing/batch/signingBatchDemoRowDistribution';

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
  const offset = rowIndex - FIXED_CURRENCY_PRESET_ROW_COUNT;
  if (offset < 0) return pool[0] ?? 'BTC';
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
    addressFamily: resolveAddressFamily(symbol),
  };
}

/** 任意行的有效币种 preset（含随机池行与 addressFamily 推断）。 */
export function resolveCurrencyRowPreset(rowIndex: number): CurrencyRowPreset {
  const demo = resolveSigningBatchDemoCurrencyPreset(rowIndex);
  if (demo) return demo;
  return getCurrencyRowPreset(rowIndex) ?? resolveRandomRowPreset(rowIndex);
}

export function resolveCurrencySymbolForRow(rowIndex: number): string {
  return resolveCurrencyRowPreset(rowIndex).symbol;
}

export function buildCurrencyRowPresetCustomize(rowIndex: number): Record<string, unknown> {
  return presetToCustomize(resolveCurrencyRowPreset(rowIndex), rowIndex);
}
