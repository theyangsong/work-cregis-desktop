import type { CurrencyRowPreset } from '../../list-field/tasksListFieldCurrencyRowPresets';
import { CURRENCY_ROW_PRESETS } from '../../list-field/tasksListFieldCurrencyRowPresets';
import { DATA_LIST_SIGNING_ROW_COUNT } from '../../tasksDataListPageData';

/**
 * 批处理 / 网络选择 Flotation 演示数据：
 * 堆在待签名列表末尾，不占用前部固定 preset / 随机池展示行。
 */
const DEMO_BUCKETS: ReadonlyArray<{ length: number; preset: CurrencyRowPreset }> = [
  { length: 30, preset: CURRENCY_ROW_PRESETS[3]! },
  { length: 10, preset: CURRENCY_ROW_PRESETS[0]! },
  { length: 12, preset: CURRENCY_ROW_PRESETS[4]! },
  { length: 8, preset: CURRENCY_ROW_PRESETS[1]! },
];

const DEMO_ROW_COUNT = DEMO_BUCKETS.reduce((sum, bucket) => sum + bucket.length, 0);
const DEMO_START_ROW_INDEX = DATA_LIST_SIGNING_ROW_COUNT - DEMO_ROW_COUNT;

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

/** 演示桶内行一律单签，供批处理计数与多选。 */
export function isSigningBatchDemoSingleSignRow(rowIndex: number): boolean {
  return resolveSigningBatchDemoCurrencyPreset(rowIndex) != null;
}

export const SIGNING_BATCH_DEMO_MIN_ROW_COUNT = DATA_LIST_SIGNING_ROW_COUNT;
