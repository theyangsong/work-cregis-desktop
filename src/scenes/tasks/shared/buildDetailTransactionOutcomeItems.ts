import {
  createDetailApplyItemRow,
  type DetailItemData,
  type TagStatus,
} from '@eds/desktop-components';

export type DetailTransactionOutcomeFields = {
  transactionStatusLabel?: string;
  transactionStatusTag?: TagStatus;
  transactionHash?: string;
};

function mockDetailTransactionHash(rowIndex: number): string {
  const hex = Array.from({ length: 64 }, (_, offset) => {
    const n = (rowIndex + 1) * 9973 + offset * 17;
    return (n % 16).toString(16);
  }).join('');
  return `0x${hex}`;
}

export function buildDetailTransactionOutcomeFields(
  rowIndex: number,
): DetailTransactionOutcomeFields {
  return {
    transactionStatusLabel: 'Success',
    transactionStatusTag: 'success',
    transactionHash: mockDetailTransactionHash(rowIndex),
  };
}

export function buildDetailTransactionStatusItem(
  detail: DetailTransactionOutcomeFields,
  translate: (key: string) => string,
): DetailItemData | null {
  if (!detail.transactionStatusLabel) return null;

  return {
    ...createDetailApplyItemRow('status', {
      key: 'transaction-status',
      title: translate('Transaction status'),
      tag: translate(detail.transactionStatusLabel),
    }),
    tagFamily: 'status',
    tagStatus: detail.transactionStatusTag ?? 'success',
    valueTagOnly: true,
    value: '',
  };
}

export function buildDetailTransactionHashItem(
  detail: DetailTransactionOutcomeFields,
  translate: (key: string) => string,
): DetailItemData | null {
  const hash = detail.transactionHash?.trim();
  if (!hash) return null;

  return {
    ...createDetailApplyItemRow('txid', {
      key: 'transaction-hash',
      title: translate('Transaction hash'),
      value: hash,
    }),
    showValueCopy: false,
    showValueBrowser: false,
  };
}
