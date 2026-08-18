/** Showcase 可逐条编辑的地址槽位数（发送方 / 接收方面板）。 */
export const MAX_CURRENCY_SIDE_ADDRESSES = 20;

/** 地址数上限（Data List Tooltip 等场景最多展示条数）。 */
export const MAX_CURRENCY_ADDRESS_COUNT = 100;

/** 单地址组合（comboMode=single-address）Body 默认最小宽度（px）。 */
export const CURRENCY_SINGLE_ADDRESS_MIN_WIDTH = 278;

export function parseCurrencyAddressCount(value: unknown): number {
  const parsed = Number(String(value ?? '1').trim() || '1');
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(Math.floor(parsed), MAX_CURRENCY_ADDRESS_COUNT);
}

export function currencyAddressTagsEnabledKey(
  side: 'from' | 'to',
  addressIndex: number,
): string {
  return `${side}Address${addressIndex}EnableTags`;
}

/** 按组合模式同步 minWidth：单地址默认 278px；切回其它模式时清除自动填充值。 */
export function syncCurrencyMinWidthForComboMode(state: Record<string, unknown>): void {
  const mode = String(state.comboMode ?? 'double-address');
  const raw = String(state.minWidth ?? '').trim();
  const singleDefault = String(CURRENCY_SINGLE_ADDRESS_MIN_WIDTH);

  if (mode === 'single-address') {
    if (!raw) {
      state.minWidth = singleDefault;
    }
    return;
  }

  if (raw === singleDefault) {
    state.minWidth = '';
  }
}
