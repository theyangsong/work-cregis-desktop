import {
  createDetailApplyItemRow,
  type DetailItemData,
  type DetailSectionData,
} from '@eds/desktop-components';
import { DATA_LIST_FIGMA_COLUMNS } from '../tasksDataListPageData';
import {
  buildDetailAddressSideItem,
} from '../shared/buildDetailAddressSideItems';
import { buildDetailCurrencyAmountItems } from '../shared/buildDetailCurrencyAmountItems';
import { buildDetailInitiationSourceItem } from '../shared/buildDetailInitiationSourceItem';
import {
  buildDetailTransactionHashItem,
  buildDetailTransactionStatusItem,
} from '../shared/buildDetailTransactionOutcomeItems';
import {
  buildPayoutWalletDetailItem,
  buildStrategyDetailItem,
} from '../shared/buildDetailWalletStrategyItems';
import { buildExpiryDetailItem } from '../shared/buildDetailExpiryItem';
import { buildSenderWalletDisplayName } from '../list-field/tasksListFieldBusinessTypeRowData';
import type { AppLocale } from '@/composables/useAppLocale';
import { formatEmptyDisplayValue } from '@/utils/formatEmptyDisplay';
import { parseRowIndexFromSigningId } from './signingStore';
import type { SigningDetail } from './types';

const DETAIL_ITEM_TITLES = {
  amount: DATA_LIST_FIGMA_COLUMNS.amount.label,
  expiry: 'Expiration Time',
  appliedAt: 'Created Time',
  payoutWallet: DATA_LIST_FIGMA_COLUMNS.businessType.label,
  sender: 'Sender',
  receiver: DATA_LIST_FIGMA_COLUMNS.combo.secondaryLabel ?? 'Receiver',
  strategy: 'Triggered Policy',
  thirdParty: 'Third-party Reference',
  memo: 'Memo',
} as const;

export function buildSenderItem(
  detail: SigningDetail,
  translate: (key: string) => string,
): DetailItemData {
  const primary = detail.senders[0];
  return buildDetailAddressSideItem('sender', {
    key: 'sender',
    title: translate(DETAIL_ITEM_TITLES.sender),
    primary,
    summary: detail.senderSummary,
    count: detail.senderCount,
    orderCount: detail.senderOrderCount,
    entries: detail.senders,
    expandLabel: translate('Expand {count}'),
    ordersLabel: translate('{count} Orders'),
    translate,
  });
}

export function buildReceiverItem(
  detail: SigningDetail,
  translate: (key: string) => string,
): DetailItemData {
  const primary = detail.receivers[0];
  return buildDetailAddressSideItem('receiver', {
    key: 'receiver',
    title: translate(DETAIL_ITEM_TITLES.receiver),
    primary,
    summary: detail.receiverSummary,
    count: detail.receiverCount,
    orderCount: detail.receiverOrderCount,
    entries: detail.receivers,
    expandLabel: translate('Expand {count}'),
    ordersLabel: translate('{count} Orders'),
    translate,
  });
}

export function buildSigningDetailSections(
  detail: SigningDetail,
  translate: (key: string) => string = (key) => key,
  locale: AppLocale = 'en',
): DetailSectionData[] {
  const transactionItems: DetailItemData[] = [
    ...buildDetailCurrencyAmountItems(detail, translate),
    buildDetailInitiationSourceItem(parseRowIndexFromSigningId(detail.id), translate),
  ];

  const transactionStatusItem = buildDetailTransactionStatusItem(detail, translate);
  if (transactionStatusItem) {
    transactionItems.push(transactionStatusItem);
  }

  const expiryItem = buildExpiryDetailItem(detail, translate);
  if (expiryItem) {
    transactionItems.push(expiryItem);
  }

  transactionItems.push(
    createDetailApplyItemRow('time', {
      key: 'applied-at',
      title: translate(DETAIL_ITEM_TITLES.appliedAt),
      value: detail.appliedAtDisplay,
    }),
    buildPayoutWalletDetailItem(
      {
        ...detail,
        payoutWallet: buildSenderWalletDisplayName(parseRowIndexFromSigningId(detail.id), locale),
      },
      translate,
      DETAIL_ITEM_TITLES.payoutWallet,
    ),
    buildSenderItem(detail, translate),
    buildReceiverItem(detail, translate),
  );

  const transactionHashItem = buildDetailTransactionHashItem(detail, translate);
  if (transactionHashItem) {
    transactionItems.push(transactionHashItem);
  }

  transactionItems.push(
    buildStrategyDetailItem(detail, translate, DETAIL_ITEM_TITLES.strategy),
    createDetailApplyItemRow('tripartite-number', {
      key: 'third-party',
      title: translate(DETAIL_ITEM_TITLES.thirdParty),
      value: detail.thirdPartyRef,
    }),
    createDetailApplyItemRow('memo', {
      key: 'memo',
      title: translate(DETAIL_ITEM_TITLES.memo),
      value: formatEmptyDisplayValue(detail.memo),
    }),
  );

  return [
    {
      key: 'transaction',
      title: translate('Transaction Information'),
      items: transactionItems,
    },
  ];
}

export function buildAddressMoreSummary(
  detail: SigningDetail,
  side: 'sender' | 'receiver',
): string {
  const entries = side === 'sender' ? detail.senders : detail.receivers;
  return entries
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.alias ? `${entry.alias} · ` : ''}${entry.address}\n   ${side === 'sender' ? 'From' : 'To'}: ${entry.address}\n   Amount: ${entry.amount ?? '-'}\n   Purpose: ${entry.purpose ?? '-'}\n   Memo: ${entry.memo ?? '-'}`,
    )
    .join('\n\n');
}
