import {
  createDetailApplyItemRow,
  type DetailItemData,
} from '@eds/desktop-components';

export type DetailCurrencyAmountFields = {
  amountRowValue: string;
  amountCryptoSymbol: string;
  amountCryptoName: string;
  amountNetworkLabel: string;
};

export function buildDetailCurrencyAmountItems(
  detail: DetailCurrencyAmountFields,
  translate: (key: string) => string,
): DetailItemData[] {
  return [
    createDetailApplyItemRow('crypto', {
      key: 'currency',
      title: translate('Token'),
      value: detail.amountCryptoSymbol,
      valueSymbolCrypto: detail.amountCryptoName,
      valueIcon: detail.amountCryptoName,
      tag: detail.amountNetworkLabel.trim() ? detail.amountNetworkLabel : '',
    }),
  ];
}
