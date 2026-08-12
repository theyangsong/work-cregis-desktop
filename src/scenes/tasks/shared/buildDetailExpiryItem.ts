import {
  createDetailApplyItemRow,
  type DetailItemData,
} from '@eds/desktop-components';

export type DetailExpiryCountdownFields = {
  expiryCountdownMinutes?: string;
  expiryCountdownSeconds?: string;
};

export function buildExpiryDetailItem(
  detail: DetailExpiryCountdownFields,
  translate: (key: string) => string,
): DetailItemData | null {
  if (!detail.expiryCountdownMinutes) return null;

  return {
    ...createDetailApplyItemRow('text', {
      key: 'expiry',
      title: translate('Expiry'),
      value: '',
    }),
    titleIcon: 'eds-clocks',
  };
}
