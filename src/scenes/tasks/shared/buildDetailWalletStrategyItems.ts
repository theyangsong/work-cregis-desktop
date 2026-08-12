import {
  createDetailApplyItemRow,
  type DetailItemData,
} from '@eds/desktop-components';

export function buildPayoutWalletDetailItem(
  detail: { payoutWallet: string; payoutWalletCode: string; payoutWalletSignLabel: string },
  translate: (key: string) => string,
  titleKey: string,
): DetailItemData {
  return {
    ...createDetailApplyItemRow('text', {
      key: 'payout-wallet',
      title: translate(titleKey),
      value: detail.payoutWallet,
      tag: translate(detail.payoutWalletSignLabel),
    }),
    titleIcon: 'eds-wallet',
    tagFamily: 'system',
    tagSystemType: 'gray',
    showValueCopy: true,
    inlineValueEntries: true,
    valueEntries: [
      { value: detail.payoutWallet },
      { value: detail.payoutWalletCode, valueMuted: true },
    ],
    valueCopyText: detail.payoutWalletCode,
  };
}

export function buildStrategyDetailItem(
  detail: { strategy: string },
  translate: (key: string) => string,
  titleKey: string,
): DetailItemData {
  return {
    ...createDetailApplyItemRow('text', {
      key: 'strategy',
      title: translate(titleKey),
      value: detail.strategy,
    }),
    titleIcon: 'eds-engine',
  };
}
