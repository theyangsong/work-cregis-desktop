import {
  buildBusinessTypeSecondaryLabel,
} from './businessTypeDisplay';
import { buildTransferTypeRowValues } from './tasksListFieldBusinessTypeRowData';
import { buildStatusRowValues } from './tasksListFieldStatusRowData';

const COUNTDOWN_SUPPRESSED_STATUS_LABELS = new Set([
  'Signature Passed',
  'Signature Reject',
]);

function shouldShowOperationTypeCountdown(rowIndex: number, menuItem?: string): boolean {
  const status = buildStatusRowValues(rowIndex, menuItem);
  return !COUNTDOWN_SUPPRESSED_STATUS_LABELS.has(status.label);
}

export function columnMinWidthForOperationTypeCustomize(columnMinWidth: string): string {
  return columnMinWidth.replace(/px$/i, '').trim();
}

/** Sent Request · 业务类型列：仅「来源｜动作」composite，不含发起方/状态 Tag。 */
export function buildTasksListFieldOperationTypeCustomize(
  columnMinWidth = '',
  rowIndex?: number,
  menuItem?: string,
): Record<string, unknown> {
  const compositeKey = rowIndex == null || !Number.isFinite(rowIndex)
    ? 'Wallet｜Transfer'
    : buildBusinessTypeSecondaryLabel(rowIndex);

  const customize: Record<string, unknown> = {
    operationTypeOnly: true,
    lineLayout: 'double',
    value: '',
    secondaryValue: compositeKey,
    compositeKey,
    initiatorIconKind: 'none',
    showLeftTag: false,
    showRightTag: false,
    tooltipTrigger: 'hover',
    minWidth: columnMinWidthForOperationTypeCustomize(columnMinWidth),
    showCountdown: false,
    countdownHours: '0',
    countdownMinutes: '30',
    countdownSeconds: '00',
    countdownAlign: 'left',
    countdownSuffixKey: 'Expires in xx:xx',
  };

  if (rowIndex == null || !Number.isFinite(rowIndex)) {
    return customize;
  }

  const transferType = buildTransferTypeRowValues(rowIndex);
  if (
    transferType.showCountdown
    && shouldShowOperationTypeCountdown(rowIndex, menuItem)
  ) {
    customize.showCountdown = true;
    customize.countdownHours = transferType.countdownHours;
    customize.countdownMinutes = transferType.countdownMinutes;
    customize.countdownSeconds = transferType.countdownSeconds;
    customize.countdownAlign = transferType.countdownAlign ?? 'left';
  }

  return customize;
}
