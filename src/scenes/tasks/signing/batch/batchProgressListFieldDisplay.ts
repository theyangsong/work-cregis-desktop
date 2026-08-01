/** 进度弹层列表无数据占位（双连字符）。 */
import { EMPTY_DISPLAY } from '@/utils/formatEmptyDisplay';

export const BATCH_PROGRESS_EMPTY_DISPLAY = EMPTY_DISPLAY;

export function isProgressEmptyDisplay(text: string): boolean {
  return !text || text === '—' || text === BATCH_PROGRESS_EMPTY_DISPLAY;
}

/** 地址默认展示：前 6 + ... + 后 6（如 `0x28C6...0215F3`）。 */
export function formatProgressAddressDisplay(value: string): string {
  const text = value.trim();
  if (!text || text.includes('...') || isProgressEmptyDisplay(text)) return text;
  if (text.length <= 6 + 6 + 3) return text;
  return `${text.slice(0, 6)}...${text.slice(-6)}`;
}

/** list-field-time 单行：YYYY-MM-DD HH:MM:SS */
export function formatProgressListFieldDatetime(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
