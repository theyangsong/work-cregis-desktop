import {
  createDetailApplyItemRow,
  type DetailItemData,
  type DetailSectionData,
} from '@eds/desktop-components';
import { formatGroupedAmountText, formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import { DATA_LIST_FIGMA_COLUMNS } from '../tasksDataListPageData';
import type { ApprovalDetail } from './types';

const DETAIL_ITEM_TITLES = {
  amount: DATA_LIST_FIGMA_COLUMNS.amount.label,
  businessType: DATA_LIST_FIGMA_COLUMNS.amount.secondaryLabel ?? 'Type of Business',
  expiry: 'Expiry',
  appliedAt: DATA_LIST_FIGMA_COLUMNS.sortable.secondaryLabel ?? 'Created Time',
  payoutWallet: DATA_LIST_FIGMA_COLUMNS.businessType.label,
  sender: 'From Address',
  receiver: DATA_LIST_FIGMA_COLUMNS.combo.secondaryLabel ?? 'To Address',
  strategy: 'Triggered Policy',
  thirdParty: 'Third-party Reference',
  memo: 'Memo',
} as const;

function buildSenderItem(
  detail: ApprovalDetail,
  translate: (key: string) => string,
): DetailItemData {
  const primary = detail.senders[0];
  const address = primary?.address ?? detail.senderSummary;

  if (detail.senderCount > 1) {
    /** §7 例外：多地址「View more」暂无 Apply_Item 变体；仅展示字段 + Link。 */
    return {
      key: 'sender',
      title: translate(DETAIL_ITEM_TITLES.sender),
      value: `${address} (${formatGroupedNumber(detail.senderCount)})`,
      showValueLink: true,
      valueLinkLabel: translate('View more'),
    };
  }

  return createDetailApplyItemRow('sender', {
    key: 'sender',
    title: translate(DETAIL_ITEM_TITLES.sender),
    value: address,
    tag: primary?.alias || undefined,
  });
}

function buildReceiverItem(
  detail: ApprovalDetail,
  translate: (key: string) => string,
): DetailItemData {
  const primary = detail.receivers[0];
  const address = primary?.address ?? detail.receiverSummary;

  if (detail.receiverCount > 1) {
    /** §7 例外：多地址「View more」暂无 Apply_Item 变体；仅展示字段 + Link。 */
    return {
      key: 'receiver',
      title: translate(DETAIL_ITEM_TITLES.receiver),
      value: `${address} (${formatGroupedNumber(detail.receiverCount)})`,
      showValueLink: true,
      valueLinkLabel: translate('View more'),
    };
  }

  return createDetailApplyItemRow('receiver', {
    key: 'receiver',
    title: translate(DETAIL_ITEM_TITLES.receiver),
    value: address,
    tag: primary?.alias || undefined,
  });
}

export function buildApprovalDetailSections(
  detail: ApprovalDetail,
  translate: (key: string) => string = (key) => key,
): DetailSectionData[] {
  const transactionItems: DetailItemData[] = [
    createDetailApplyItemRow('amount', {
      key: 'amount',
      title: translate(DETAIL_ITEM_TITLES.amount),
      value: formatGroupedAmountText(detail.amountDisplay),
    }),
    createDetailApplyItemRow('type', {
      key: 'business-type',
      title: translate(DETAIL_ITEM_TITLES.businessType),
      value: translate(detail.businessType),
    }),
  ];

  if (detail.expiryDisplay) {
    const [countdownTime = detail.expiryDisplay] = detail.expiryDisplay.split(' Until Expiry');
    transactionItems.push(
      createDetailApplyItemRow('text', {
        key: 'expiry',
        title: translate(DETAIL_ITEM_TITLES.expiry),
        value: `${countdownTime.trim()} ${translate('Until Expiry')}`.trim(),
      }),
    );
  }

  transactionItems.push(
    createDetailApplyItemRow('time', {
      key: 'applied-at',
      title: translate(DETAIL_ITEM_TITLES.appliedAt),
      value: detail.appliedAtDisplay,
    }),
    createDetailApplyItemRow('text', {
      key: 'payout-wallet',
      title: translate(DETAIL_ITEM_TITLES.payoutWallet),
      value: detail.payoutWallet,
    }),
    buildSenderItem(detail, translate),
    buildReceiverItem(detail, translate),
    createDetailApplyItemRow('text', {
      key: 'strategy',
      title: translate(DETAIL_ITEM_TITLES.strategy),
      value: detail.strategy,
    }),
    createDetailApplyItemRow('tripartite-number', {
      key: 'third-party',
      title: translate(DETAIL_ITEM_TITLES.thirdParty),
      value: detail.thirdPartyRef,
    }),
    createDetailApplyItemRow('memo', {
      key: 'memo',
      title: translate(DETAIL_ITEM_TITLES.memo),
      value: detail.memo,
    }),
  );

  return [
    {
      key: 'transaction',
      title: translate('Transaction'),
      showDivider: true,
      items: transactionItems,
    },
  ];
}

export function buildAddressMoreSummary(
  detail: ApprovalDetail,
  side: 'sender' | 'receiver',
): string {
  const entries = side === 'sender' ? detail.senders : detail.receivers;
  return entries
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.alias ? `${entry.alias} · ` : ''}${entry.address}\n   Amount: ${entry.amount ?? '-'}\n   Purpose: ${entry.purpose ?? '-'}\n   Memo: ${entry.memo ?? '-'}`,
    )
    .join('\n\n');
}
