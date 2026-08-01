import type { TagStatus } from '@eds/desktop-components';

export function formatProgressAtDisplay(raw: string, fallback = ''): string {
  const utcMatch = raw.match(/^UTC[+-]\d{2}:\d{2}\s+(.+)$/);
  if (utcMatch) return utcMatch[1]!;
  return raw.trim() || fallback;
}

export function progressStatusLabelKey(statusLabel: string): string {
  const label = statusLabel.trim();
  if (label === 'Approval Passed') return 'Approval Passed';
  if (label === 'Pending Approval' || label === 'approving') return 'Pending Approval';
  if (label === 'Approval Reject') return 'Approval Reject';
  if (label === 'Signed' || label === 'Signature Passed') return 'Signature Passed';
  if (label === 'Signature Reject') return 'Signature Reject';
  return label;
}

export function resolveProgressStatusTag(statusLabel: string): TagStatus {
  if (
    statusLabel === 'Approval Passed'
    || statusLabel === 'Signed'
    || statusLabel === 'Signature Passed'
  ) {
    return 'success';
  }
  if (
    statusLabel === 'Pending Approval'
    || statusLabel === 'approving'
    || statusLabel === 'Waiting for signature'
  ) {
    return 'warning';
  }
  if (statusLabel === 'Pending Signature') return 'ready';
  if (
    statusLabel === 'Approval Reject'
    || statusLabel === 'Signature Reject'
    || statusLabel === 'Failed'
  ) {
    return 'danger';
  }
  if (
    statusLabel === 'Withdrawn'
    || statusLabel === 'Canceled'
    || statusLabel === 'Expired'
  ) {
    return 'invalid';
  }
  return 'ready';
}

export function isProgressStepCompleted(statusLabel: string): boolean {
  return (
    statusLabel === 'Approval Passed'
    || statusLabel === 'Signed'
    || statusLabel === 'Signature Passed'
  );
}
