import type { AppLocale } from '@/composables/useAppLocale';
import { isSigningBatchDemoSingleSignRow } from '../signing/batch/signingBatchDemoRowDistribution';

export type PayoutWalletsColumnValues = {
  value: string;
  rightLabel?: string;
};

export type SwapBusinessAction = 'transfer' | 'contract-auth' | 'revoke-auth';

export type TransferTypeRowValues = {
  value: string;
  swapAction?: SwapBusinessAction;
  showCountdown?: boolean;
  /** 列表 H:MM:SS 演示用；详情仍仅用 countdownMinutes / countdownSeconds。 */
  countdownHours?: string;
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

/** 前 8 行固定钱包名（0-based rowIndex 0–7）；rowIndex 2 保留长文案用于列宽溢出演示。 */
const PAYOUT_WALLET_NAME_PRESETS: readonly string[] = [
  'Treasury',
  'Operations',
  'Payroll Payout Wallet',
  'Reserve',
  'Escrow',
  'Liquidity',
  'Vendor',
  'Marketing',
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
  'Sub-Address Transfer',
  'Swap',
] as const;

/** @deprecated 使用 TRANSFER_TYPES */
export const BUSINESS_TYPES = TRANSFER_TYPES;

/** 前 8 行固定展示：发起方副行「来源｜动作」demo（rowIndex 0–6 定稿，7 起 fallback）。 */
const TRANSFER_TYPE_ROW_PRESETS: readonly TransferTypeRowValues[] = [
  { value: 'Swap', swapAction: 'contract-auth' },
  { value: 'Sub-Address Payout' },
  { value: 'Manual Transfer' },
  { value: 'Sub-Address Transfer' },
  {
    value: 'Swap',
    swapAction: 'transfer',
    showCountdown: true,
    countdownHours: '1',
    countdownMinutes: '23',
    countdownSeconds: '45',
    countdownAlign: 'left',
  },
  { value: 'Wallet Payout' },
  { value: 'Swap', swapAction: 'revoke-auth' },
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

function withSwapCountdownFallback(
  values: TransferTypeRowValues,
  rowIndex: number,
): TransferTypeRowValues {
  if (values.value !== 'Swap' || values.showCountdown) return values;
  if (values.swapAction != null && values.swapAction !== 'transfer') return values;

  const hours = rowIndex % 5;
  const minutes = 10 + (rowIndex * 3) % 50;
  const seconds = (rowIndex * 7) % 60;
  return {
    ...values,
    swapAction: values.swapAction ?? 'transfer',
    showCountdown: true,
    countdownHours: String(hours),
    countdownMinutes: String(minutes),
    countdownSeconds: String(seconds),
    countdownAlign: 'left',
  };
}

function buildRandomSignTagLabel(rowIndex: number): string {
  const index = Math.floor(seededFraction(rowIndex, 17) * PAYOUT_WALLET_SIGN_TAGS.length);
  return PAYOUT_WALLET_SIGN_TAGS[index] ?? PAYOUT_WALLET_SIGN_TAGS[0];
}

function buildRandomPayoutWalletName(rowIndex: number): string {
  const prefixIndex = Math.floor(seededFraction(rowIndex, 11) * PAYOUT_WALLET_NAME_PREFIXES.length);
  return PAYOUT_WALLET_NAME_PREFIXES[prefixIndex] ?? PAYOUT_WALLET_NAME_PREFIXES[0];
}

/** 出款钱包编号：QB + 年月日 + 8 位数字（按 rowIndex 稳定随机）。 */
export function buildPayoutWalletCode(rowIndex: number): string {
  const year = 2026;
  const month = String((rowIndex % 12) + 1).padStart(2, '0');
  const day = String((rowIndex % 28) + 1).padStart(2, '0');
  const digits = String(Math.floor(seededFraction(rowIndex, 29) * 100_000_000)).padStart(8, '0');
  return `QB${year}${month}${day}${digits}`;
}

/** 第三列 Payout Wallets 单元格。 */
export function buildPayoutWalletsColumnValues(rowIndex: number): PayoutWalletsColumnValues {
  if (isSigningBatchDemoSingleSignRow(rowIndex)) {
    return {
      value: buildRandomPayoutWalletName(rowIndex),
      rightLabel: 'Single-Sign',
    };
  }

  const preset = PAYOUT_WALLET_NAME_PRESETS[rowIndex];
  const signPreset = PAYOUT_WALLET_SIGN_TAG_PRESETS[rowIndex];
  return {
    value: preset ?? buildRandomPayoutWalletName(rowIndex),
    rightLabel: signPreset ?? buildRandomSignTagLabel(rowIndex),
  };
}

/** 发送方副行：除溢出演示行外，短钱包名池（稳定随机）。 */
const SENDER_WALLET_SECONDARY_EN_NAMES = [
  'Ops Wallet',
  'Main Vault',
  'Hot Wallet',
  'Reserve',
  'Treasury',
  'Vendor',
  'Escrow',
  'Settlement',
  'Liquidity',
  'Marketing',
  'Compliance',
  'Client Fund',
  'APAC Ops',
  'EMEA Hub',
  'Cold Pool',
] as const;

const SENDER_WALLET_SECONDARY_ZH_NAMES = [
  '运营钱包',
  '主钱包',
  '热钱包',
  '储备金',
  '财库',
  '供应商',
  '托管仓',
  '清算池',
  '流动性',
  '市场金',
  '合规户',
  '客户金',
  '亚太户',
  '欧洲户',
  '冷池',
] as const;

/** 中文站：中文名 40%；英文站：英文名 60%（即中文名 40%）。 */
function senderWalletSecondaryChineseRatio(locale: AppLocale): number {
  return locale === 'zh-CN' ? 0.4 : 0.4;
}

function buildRandomSenderWalletSecondaryText(rowIndex: number, locale: AppLocale): string {
  const useChinese = seededFraction(rowIndex, 43) < senderWalletSecondaryChineseRatio(locale);
  const pool = useChinese ? SENDER_WALLET_SECONDARY_ZH_NAMES : SENDER_WALLET_SECONDARY_EN_NAMES;
  const index = Math.floor(seededFraction(rowIndex, 47) * pool.length);
  return pool[index] ?? pool[0];
}

/** 发送方列主行（EgListFieldAddressLine walletAsPrimary）/ 详情出款钱包 — 同一 rowIndex 同一文案。 */
const SENDER_WALLET_SECONDARY_PAYROLL_OVERFLOW_INDEX = 1;

export function buildSenderWalletDisplayName(
  rowIndex: number,
  locale: AppLocale = 'en',
): string {
  if (rowIndex === SENDER_WALLET_SECONDARY_PAYROLL_OVERFLOW_INDEX) {
    return 'Payroll Payout Wallet';
  }
  return buildRandomSenderWalletSecondaryText(rowIndex, locale);
}

export function resolveSenderWalletSecondaryText(
  rowIndex: number,
  _walletValue: string,
  locale: AppLocale = 'en',
): string {
  return buildSenderWalletDisplayName(rowIndex, locale);
}

/** 出款钱包是否为多签（批量签名须排除）。 */
export function isMultiSignRow(rowIndex: number): boolean {
  return buildPayoutWalletsColumnValues(rowIndex).rightLabel === 'Multi-Sign';
}

/** 业务类型 / 详情枚举（Wallet Payout / Swap 等）。 */
export function buildTransferTypeRowValues(rowIndex: number): TransferTypeRowValues {
  const preset = TRANSFER_TYPE_ROW_PRESETS[rowIndex];
  const values = preset ?? buildRandomTransferTypeRowValues(rowIndex);
  return withSwapCountdownFallback(values, rowIndex);
}

/** @deprecated 使用 buildPayoutWalletsColumnValues / buildTransferTypeRowValues */
export function buildBusinessTypeRowValues(rowIndex: number): PayoutWalletsColumnValues {
  return buildPayoutWalletsColumnValues(rowIndex);
}
