import type { CurrencyRowPreset } from '../../list-field/tasksListFieldCurrencyRowPresets';
import { CURRENCY_ROW_PRESETS } from '../../list-field/tasksListFieldCurrencyRowPresets';
import { DATA_LIST_SIGNING_ROW_COUNT } from '../../tasksDataListPageData';

/** 批签矿工费 batch stub 演示：BTC / ADA / FIL 各 5 条、TRON 6 条（列表末尾）。 */
export const SIGNING_BATCH_MINER_FEE_STUB_DEMO_PRESETS = {
  btc: {
    symbol: 'BTC',
    cryptoName: 'eds-btc-bitcoin',
    showNetwork: false,
    addressFamily: 'btc',
  },
  ada: {
    symbol: 'ADA',
    cryptoName: 'eds-ada-cardano',
    showNetwork: false,
    addressFamily: 'evm',
  },
  fil: {
    symbol: 'FIL',
    cryptoName: 'eds-fil-filecoin',
    showNetwork: false,
    addressFamily: 'evm',
  },
  tron: {
    symbol: 'TRX',
    cryptoName: 'eds-trx-tron',
    showNetwork: false,
    addressFamily: 'trx',
  },
} as const satisfies Record<string, CurrencyRowPreset>;

const MINER_FEE_STUB_DEMO_SYMBOLS: ReadonlySet<string> = new Set(
  Object.values(SIGNING_BATCH_MINER_FEE_STUB_DEMO_PRESETS).map((preset) => preset.symbol),
);

/**
 * 批处理 / 网络选择 Flotation 演示数据：
 * 堆在待签名列表末尾，不占用前部固定 preset / 随机池展示行。
 */
const DEMO_BUCKETS: ReadonlyArray<{ length: number; preset: CurrencyRowPreset }> = [
  { length: 15, preset: CURRENCY_ROW_PRESETS[3]! },
  { length: 10, preset: CURRENCY_ROW_PRESETS[0]! },
  { length: 12, preset: CURRENCY_ROW_PRESETS[4]! },
  { length: 8, preset: CURRENCY_ROW_PRESETS[1]! },
  { length: 5, preset: SIGNING_BATCH_MINER_FEE_STUB_DEMO_PRESETS.btc },
  { length: 5, preset: SIGNING_BATCH_MINER_FEE_STUB_DEMO_PRESETS.ada },
  { length: 5, preset: SIGNING_BATCH_MINER_FEE_STUB_DEMO_PRESETS.fil },
  { length: 6, preset: SIGNING_BATCH_MINER_FEE_STUB_DEMO_PRESETS.tron },
];

const DEMO_ROW_COUNT = DEMO_BUCKETS.reduce((sum, bucket) => sum + bucket.length, 0);
const DEMO_START_ROW_INDEX = DATA_LIST_SIGNING_ROW_COUNT - DEMO_ROW_COUNT;

const MINER_FEE_STUB_DEMO_ROW_COUNT = 21;

const MINER_FEE_STUB_DEMO_START_ROW_INDEX =
  DEMO_START_ROW_INDEX
  + DEMO_BUCKETS.slice(0, -4).reduce((sum, bucket) => sum + bucket.length, 0);

export const SIGNING_BATCH_MINER_FEE_STUB_DEMO_ROW_INDEXES = {
  btc: Array.from({ length: 5 }, (_, index) => MINER_FEE_STUB_DEMO_START_ROW_INDEX + index),
  ada: Array.from({ length: 5 }, (_, index) => MINER_FEE_STUB_DEMO_START_ROW_INDEX + 5 + index),
  fil: Array.from({ length: 5 }, (_, index) => MINER_FEE_STUB_DEMO_START_ROW_INDEX + 10 + index),
  tron: Array.from({ length: 6 }, (_, index) => MINER_FEE_STUB_DEMO_START_ROW_INDEX + 15 + index),
} as const;

export function resolveSigningBatchDemoCurrencyPreset(
  rowIndex: number,
): CurrencyRowPreset | undefined {
  if (rowIndex < DEMO_START_ROW_INDEX) return undefined;

  const offset = rowIndex - DEMO_START_ROW_INDEX;
  if (offset >= DEMO_ROW_COUNT) return undefined;

  let cursor = 0;
  for (const bucket of DEMO_BUCKETS) {
    if (offset < cursor + bucket.length) {
      return bucket.preset;
    }
    cursor += bucket.length;
  }

  return undefined;
}

/** 列表末尾 BTC / ADA / FIL / TRON 批签矿工费 stub 演示行。 */
export function isSigningBatchMinerFeeStubDemoRow(rowIndex: number): boolean {
  return rowIndex >= MINER_FEE_STUB_DEMO_START_ROW_INDEX
    && rowIndex < MINER_FEE_STUB_DEMO_START_ROW_INDEX + MINER_FEE_STUB_DEMO_ROW_COUNT;
}

export function resolveSigningBatchMinerFeeStubDemoSymbol(
  rowIndex: number,
): keyof typeof SIGNING_BATCH_MINER_FEE_STUB_DEMO_PRESETS | null {
  if (!isSigningBatchMinerFeeStubDemoRow(rowIndex)) return null;
  const preset = resolveSigningBatchDemoCurrencyPreset(rowIndex);
  if (!preset) return null;
  const symbol = preset.symbol.trim().toUpperCase();
  if (symbol === 'BTC') return 'btc';
  if (symbol === 'ADA') return 'ada';
  if (symbol === 'FIL') return 'fil';
  if (symbol === 'TRX') return 'tron';
  return null;
}

/** 演示桶内行一律单签，供批处理计数与多选。 */
export function isSigningBatchDemoSingleSignRow(rowIndex: number): boolean {
  return resolveSigningBatchDemoCurrencyPreset(rowIndex) != null;
}

export function isSigningBatchMinerFeeStubDemoSymbol(symbol: string): boolean {
  return MINER_FEE_STUB_DEMO_SYMBOLS.has(symbol.trim().toUpperCase());
}

export const SIGNING_BATCH_DEMO_MIN_ROW_COUNT = DATA_LIST_SIGNING_ROW_COUNT;
