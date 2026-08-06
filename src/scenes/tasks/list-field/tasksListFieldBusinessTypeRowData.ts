export type PayoutWalletsColumnValues = {
  value: string;
  rightLabel?: string;
};

export type TransferTypeRowValues = {
  value: string;
  showCountdown?: boolean;
  countdownMinutes?: string;
  countdownSeconds?: string;
  countdownAlign?: 'left' | 'center' | 'right';
};

export const PAYOUT_WALLETS_COLUMN_VALUE = 'Payout Wallets';

const PAYOUT_WALLET_NAME_PREFIXES = [
  'Treasury',
  'Operations',
  'Payroll',
  'Reserve',
  'Corporate',
  'Escrow',
  'Liquidity',
  'Settlement',
  'Vendor',
  'Marketing',
  'Compliance',
  'Main',
  'APAC',
  'EMEA',
  'Client',
] as const;

const PAYOUT_WALLET_NAME_SUFFIXES = [
  'Wallet',
  'Hot Wallet',
  'Cold Wallet',
  'Payout Wallet',
  'Fund',
  'Pool',
] as const;

/** 前 8 行固定钱包名（0-based rowIndex 0–7）。 */
const PAYOUT_WALLET_NAME_PRESETS: readonly string[] = [
  'Treasury Wallet',
  'Operations Hot Wallet',
  'Payroll Payout Wallet',
  'USDT Reserve Wallet',
  'Corporate Escrow Wallet',
  'Liquidity Pool',
  'Vendor Settlement Wallet',
  'Marketing Fund Wallet',
] as const;

const PAYOUT_WALLET_SIGN_TAGS = ['Single-Sign', 'Multi-Sign'] as const;

/** 前 8 行固定右侧 Tag（0-based rowIndex 0–7）。 */
const PAYOUT_WALLET_SIGN_TAG_PRESETS: readonly string[] = [
  'Single-Sign',
  'Multi-Sign',
  'Single-Sign',
  'Multi-Sign',
  'Multi-Sign',
  'Single-Sign',
  'Multi-Sign',
  'Single-Sign',
] as const;

export const TRANSFER_TYPES = [
  'Wallet Payout',
  'Sub-Address Payout',
  'Manual Transfer',
  'Swap',
  'Remittance',
] as const;

/** @deprecated 使用 TRANSFER_TYPES */
export const BUSINESS_TYPES = TRANSFER_TYPES;

/** 前 8 行固定展示：5 种转账类型打乱顺序循环（现用于金额列副行）。 */
const TRANSFER_TYPE_ROW_PRESETS: readonly TransferTypeRowValues[] = [
  { value: 'Manual Transfer' },
  { value: 'Sub-Address Payout' },
  { value: 'Swap' },
  { value: 'Remittance' },
  { value: 'Wallet Payout' },
  { value: 'Swap' },
  { value: 'Manual Transfer' },
  { value: 'Wallet Payout' },
] as const;

function seededFraction(rowIndex: number, salt: number): number {
  const x = Math.sin((rowIndex + 1) * 9973 + salt * 7919) * 10000;
  return x - Math.floor(x);
}

function buildRandomTransferTypeRowValues(rowIndex: number): TransferTypeRowValues {
  const typeIndex = Math.floor(seededFraction(rowIndex, 1) * TRANSFER_TYPES.length);
  return { value: TRANSFER_TYPES[typeIndex] ?? TRANSFER_TYPES[0] };
}

function withSwapCountdown(values: TransferTypeRowValues, rowIndex: number): TransferTypeRowValues {
  if (values.value !== 'Swap') return values;

  const minutes = 15 + (rowIndex % 4) * 5;
  return {
    ...values,
    showCountdown: true,
    countdownMinutes: String(minutes),
    countdownSeconds: '00',
    countdownAlign: 'left',
  };
}

function buildRandomSignTagLabel(rowIndex: number): string {
  const index = Math.floor(seededFraction(rowIndex, 17) * PAYOUT_WALLET_SIGN_TAGS.length);
  return PAYOUT_WALLET_SIGN_TAGS[index] ?? PAYOUT_WALLET_SIGN_TAGS[0];
}

function buildRandomPayoutWalletName(rowIndex: number): string {
  const prefixIndex = Math.floor(seededFraction(rowIndex, 11) * PAYOUT_WALLET_NAME_PREFIXES.length);
  const suffixIndex = Math.floor(seededFraction(rowIndex, 13) * PAYOUT_WALLET_NAME_SUFFIXES.length);
  const prefix = PAYOUT_WALLET_NAME_PREFIXES[prefixIndex] ?? PAYOUT_WALLET_NAME_PREFIXES[0];
  const suffix = PAYOUT_WALLET_NAME_SUFFIXES[suffixIndex] ?? PAYOUT_WALLET_NAME_SUFFIXES[0];
  return `${prefix} ${suffix}`;
}

/** 第三列 Payout Wallets 单元格。 */
export function buildPayoutWalletsColumnValues(rowIndex: number): PayoutWalletsColumnValues {
  const preset = PAYOUT_WALLET_NAME_PRESETS[rowIndex];
  const signPreset = PAYOUT_WALLET_SIGN_TAG_PRESETS[rowIndex];
  return {
    value: preset ?? buildRandomPayoutWalletName(rowIndex),
    rightLabel: signPreset ?? buildRandomSignTagLabel(rowIndex),
  };
}

/** 金额列副行：转账类型（Manual Transfer / Swap 等）。 */
export function buildTransferTypeRowValues(rowIndex: number): TransferTypeRowValues {
  const preset = TRANSFER_TYPE_ROW_PRESETS[rowIndex];
  const values = preset ?? buildRandomTransferTypeRowValues(rowIndex);
  return withSwapCountdown(values, rowIndex);
}

/** @deprecated 使用 buildPayoutWalletsColumnValues / buildTransferTypeRowValues */
export function buildBusinessTypeRowValues(rowIndex: number): PayoutWalletsColumnValues {
  return buildPayoutWalletsColumnValues(rowIndex);
}
