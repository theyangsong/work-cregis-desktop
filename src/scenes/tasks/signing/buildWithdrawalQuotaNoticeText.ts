import { formatGroupedNumber } from '@eds/desktop-components';
import { MOCK_WITHDRAWAL_QUOTA_USD } from './batch/batchSigning.constants';

export function buildWithdrawalQuotaNoticeText(
  translate: (key: string) => string,
): string {
  return translate(
    'Team withdrawal quota remaining: ${amount}. Upgrade to increase quota or enjoy unlimited withdrawal.',
  ).replace('${amount}', formatGroupedNumber(MOCK_WITHDRAWAL_QUOTA_USD));
}
