/** 空值占位：列表 / 详情 / 弹窗侧栏统一展示。 */
export const EMPTY_DISPLAY = '--';

export function formatEmptyDisplayValue(value: string | null | undefined): string {
  const trimmed = String(value ?? '').trim();
  return trimmed || EMPTY_DISPLAY;
}
