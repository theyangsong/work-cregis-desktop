import { buildGeneralStructureRowValues } from './tasksListFieldGeneralStructureRowData';
import { buildStatusRowValues } from './tasksListFieldStatusRowData';
import { buildTransferTypeRowValues } from './tasksListFieldBusinessTypeRowData';
import {
  buildApplicationTimeSecondaryValue,
  buildBusinessTypeSecondaryLabel,
} from './businessTypeDisplay';
import type { AppLocale } from '@/composables/useAppLocale';

const COUNTDOWN_SUPPRESSED_STATUS_LABELS = new Set([
  'Signature Passed',
  'Signature Reject',
]);

function shouldShowListBusinessTypeCountdown(rowIndex: number, menuItem?: string): boolean {
  const status = buildStatusRowValues(rowIndex, menuItem);
  return !COUNTDOWN_SUPPRESSED_STATUS_LABELS.has(status.label);
}

/** Showcase list-field-general-structure customizeDefaults — Data List 通用结构列。 */
export const tasksListFieldGeneralStructureDefaults: Record<string, unknown> = {
  value: 'Name (t******c@gmail.com)',
  secondaryValue: 'Wallet｜Transfer',
  lineLayout: 'double',
  minWidth: '',
  copyOnRowHover: false,
  tooltipTrigger: 'hover',
  showRightTag: false,
  showLeftTag: false,
  leftSystemType: 'stroke-solid',
  leftLabel: 'Me',
  rightSystemType: 'stroke-subtle',
  rightLabel: 'Tag',
};

export function columnMinWidthForGeneralStructureCustomize(columnMinWidth: string): string {
  return columnMinWidth.replace(/px$/i, '').trim();
}

export function buildTasksListFieldGeneralStructureCustomize(
  columnMinWidth = '',
  rowIndex?: number,
  menuItem?: string,
  _locale: AppLocale = 'en',
): Record<string, unknown> {
  const customize = { ...tasksListFieldGeneralStructureDefaults };
  const minWidth = columnMinWidthForGeneralStructureCustomize(columnMinWidth);
  if (minWidth) {
    customize.minWidth = minWidth;
  }
  if (menuItem === 'Sent Request') {
    customize.operationTypeOnly = true;
  }
  if (rowIndex != null && Number.isFinite(rowIndex)) {
    Object.assign(customize, buildGeneralStructureRowValues(rowIndex));
    customize.avatarColorSeed = `initiator-${rowIndex}`;

    const transferType = buildTransferTypeRowValues(rowIndex);
    customize.secondaryValue = buildBusinessTypeSecondaryLabel(rowIndex);
    customize.showCountdown = false;
    if (
      transferType.showCountdown
      && shouldShowListBusinessTypeCountdown(rowIndex, menuItem)
    ) {
      customize.showCountdown = true;
      customize.countdownHours = transferType.countdownHours;
      customize.countdownMinutes = transferType.countdownMinutes;
      customize.countdownSeconds = transferType.countdownSeconds;
      customize.countdownAlign = transferType.countdownAlign ?? 'left';
      customize.countdownSuffixKey = 'Expires in xx:xx';
    }
  }
  return customize;
}

/** 列表金额列副行：申请时间（与详情 appliedAt 同源）。 */
export function buildListApplicationTimeSecondaryValue(rowIndex: number): string {
  return buildApplicationTimeSecondaryValue(rowIndex);
}
