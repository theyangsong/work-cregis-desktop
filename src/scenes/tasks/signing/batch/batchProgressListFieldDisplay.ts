/** 进度弹层列表无数据占位（双连字符）。 */
export const BATCH_PROGRESS_EMPTY_DISPLAY = '--';

export function isProgressEmptyDisplay(text: string): boolean {
  return !text || text === '—' || text === BATCH_PROGRESS_EMPTY_DISPLAY;
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
