import { formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import type { BatchIneligibleReason } from './types';

export type BatchIneligibleReasonFilter = 'all' | BatchIneligibleReason;

export function formatIneligibleReasonWithCount(label: string, count: number): string {
  return `${label}（${formatGroupedNumber(count)}）`;
}
