import {
  buildTransferTypeRowValues,
  type TransferTypeRowValues,
} from './tasksListFieldBusinessTypeRowData';

/** 业务类型副行 i18n 键（经 ui() 翻译为「来源｜动作」）。 */
export const BUSINESS_TYPE_SECONDARY_LABEL_KEYS = {
  waasWalletPayout: 'Wallet｜Withdrawal',
  waasSubPayout: 'Sub-Address｜Withdrawal',
  memberWalletTransfer: 'Wallet｜Transfer',
  memberSubTransfer: 'Sub-Address｜Transfer',
  swapTransfer: 'Swap App｜Transfer',
  swapContractAuth: 'Swap App｜Contract Authorization',
  swapRevokeAuth: 'Swap App｜Revoke Authorization',
} as const;

/** 金额列副行：申请时间（与详情 appliedAt 同源）。 */
export const APPLICATION_TIME_ROW_PRESETS: readonly string[] = [
  '2026-07-19 14:30:00',
  '2026-07-18 09:15:42',
  '2026-07-17 22:08:11',
  '2026-07-16 11:02:33',
  '2026-07-15 16:44:05',
  '2026-07-14 08:20:18',
  '2026-07-13 19:55:27',
  '2026-07-12 03:12:09',
];

function seededFraction(rowIndex: number, salt: number): number {
  const x = Math.sin((rowIndex + 1) * 9973 + salt * 7919) * 10000;
  return x - Math.floor(x);
}

export function buildApplicationTimeSecondaryValue(rowIndex: number): string {
  const preset = APPLICATION_TIME_ROW_PRESETS[rowIndex];
  if (preset) return preset;

  const hour = String(Math.floor(seededFraction(rowIndex, 2) * 24)).padStart(2, '0');
  const minute = String(Math.floor(seededFraction(rowIndex, 3) * 60)).padStart(2, '0');
  const day = String((rowIndex % 27) + 1).padStart(2, '0');
  return `2026-07-${day} ${hour}:${minute}:00`;
}

function resolveBusinessTypeSecondaryKey(transfer: TransferTypeRowValues): string {
  if (transfer.value === 'Wallet Payout') {
    return BUSINESS_TYPE_SECONDARY_LABEL_KEYS.waasWalletPayout;
  }
  if (transfer.value === 'Sub-Address Payout') {
    return BUSINESS_TYPE_SECONDARY_LABEL_KEYS.waasSubPayout;
  }
  if (transfer.value === 'Manual Transfer') {
    return BUSINESS_TYPE_SECONDARY_LABEL_KEYS.memberWalletTransfer;
  }
  if (transfer.value === 'Sub-Address Transfer') {
    return BUSINESS_TYPE_SECONDARY_LABEL_KEYS.memberSubTransfer;
  }
  if (transfer.value === 'Swap') {
    if (transfer.swapAction === 'contract-auth') {
      return BUSINESS_TYPE_SECONDARY_LABEL_KEYS.swapContractAuth;
    }
    if (transfer.swapAction === 'revoke-auth') {
      return BUSINESS_TYPE_SECONDARY_LABEL_KEYS.swapRevokeAuth;
    }
    return BUSINESS_TYPE_SECONDARY_LABEL_KEYS.swapTransfer;
  }
  return transfer.value;
}

/** 发起方列副行：业务类型「来源｜动作」 composite i18n 键。 */
export function buildBusinessTypeSecondaryLabel(rowIndex: number): string {
  return resolveBusinessTypeSecondaryKey(buildTransferTypeRowValues(rowIndex));
}

/** 将 composite 键拆为来源 / 动作（列表副行用 EgDivider 连接）。 */
export function splitBusinessTypeSecondaryKey(
  compositeKey: string,
): { sourceKey: string; actionKey: string } | null {
  const separatorIndex = compositeKey.indexOf('｜');
  if (separatorIndex < 0) return null;
  const sourceKey = compositeKey.slice(0, separatorIndex).trim();
  const actionKey = compositeKey.slice(separatorIndex + 1).trim();
  if (!sourceKey || !actionKey) return null;
  return { sourceKey, actionKey };
}
