export const EXPIRY_COUNTDOWN_LOOP_SECONDS = 60 * 60;

export function parseExpiryCountdownTotal(minutes: string, seconds: string): number {
  const parsedMinutes = Math.max(0, Number.parseInt(minutes, 10) || 0);
  const parsedSeconds = Math.max(0, Math.min(59, Number.parseInt(seconds, 10) || 0));
  return parsedMinutes * 60 + parsedSeconds;
}

export function formatExpiryCountdownTotal(total: number): string {
  const minutePart = Math.floor(total / 60);
  const secondPart = total % 60;
  return `${String(minutePart).padStart(2, '0')}:${String(secondPart).padStart(2, '0')}`;
}
