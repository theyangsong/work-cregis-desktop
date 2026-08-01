import {
  MOCK_WITHDRAWAL_QUOTA_USD,
  WITHDRAWAL_OVERAGE_FEE_RATE,
} from './batchSigning.constants';
import type { SigningBatchRowModel } from './types';

export type WithdrawalQuotaCheckResult =
  | { ok: true }
  | {
      ok: false;
      requiredUsd: number;
      remainingUsd: number;
      overageFeeUsd: number;
    };

function parseFiatNumeric(fiat: string): number {
  const cleaned = fiat.replace(/[^0-9.]/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export function checkWithdrawalQuota(signableRows: SigningBatchRowModel[]): WithdrawalQuotaCheckResult {
  const requiredUsd = signableRows.reduce(
    (sum, row) => sum + parseFiatNumeric(row.amountFiat),
    0,
  );
  const remainingUsd = MOCK_WITHDRAWAL_QUOTA_USD;

  if (requiredUsd > remainingUsd) {
    const overageAmountUsd = requiredUsd - remainingUsd;
    return {
      ok: false,
      requiredUsd,
      remainingUsd,
      overageFeeUsd: overageAmountUsd * WITHDRAWAL_OVERAGE_FEE_RATE,
    };
  }

  return { ok: true };
}
