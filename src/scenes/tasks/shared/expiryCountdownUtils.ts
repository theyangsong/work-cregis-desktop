export const EXPIRY_COUNTDOWN_LOOP_SECONDS = 60 * 60;

export function parseExpiryCountdownTotal(
  minutes: string,
  seconds: string,
  hours = '0',
): number {
  const parsedHours = Math.max(0, Number.parseInt(hours, 10) || 0);
  const parsedMinutes = Math.max(0, Number.parseInt(minutes, 10) || 0);
  const parsedSeconds = Math.max(0, Math.min(59, Number.parseInt(seconds, 10) || 0));
  return parsedHours * 3600 + parsedMinutes * 60 + parsedSeconds;
}

/** 详情：MM:SS（不含小时）。 */
export function formatExpiryCountdownTotal(total: number): string {
  const minutePart = Math.floor(total / 60);
  const secondPart = total % 60;
  return `${String(minutePart).padStart(2, '0')}:${String(secondPart).padStart(2, '0')}`;
}

/** 列表：H:MM:SS 绝对时分秒（小时不补零）。 */
export function formatExpiryCountdownHms(total: number): string {
  const hourPart = Math.floor(total / 3600);
  const minutePart = Math.floor((total % 3600) / 60);
  const secondPart = total % 60;
  return `${hourPart}:${String(minutePart).padStart(2, '0')}:${String(secondPart).padStart(2, '0')}`;
}
