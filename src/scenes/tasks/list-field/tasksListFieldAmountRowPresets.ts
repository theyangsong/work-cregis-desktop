/** 金额列第 1–8 条固定展示（0-based rowIndex 0–7），长短参差，含刻意溢出用例。 */
export type AmountRowPreset = {
  cryptoValue: string;
  fiatValue: string;
};

export const AMOUNT_ROW_PRESETS: readonly AmountRowPreset[] = [
  { cryptoValue: '24,500.50', fiatValue: '$24,500.50' },
  { cryptoValue: '700732,879.00000012', fiatValue: '$700732,879.00000012' },
  { cryptoValue: '0.0842', fiatValue: '$24.06' },
  { cryptoValue: '128,456.789012', fiatValue: '$32,114,197.25' },
  { cryptoValue: '12,345.67', fiatValue: '$12,345.67' },
  { cryptoValue: '50', fiatValue: '$360' },
  { cryptoValue: '234,567.890123', fiatValue: '$89,423.45' },
  { cryptoValue: '0.5', fiatValue: '$0.12' },
] as const;

export function getAmountRowPreset(rowIndex: number): AmountRowPreset | undefined {
  return AMOUNT_ROW_PRESETS[rowIndex];
}
