import {
  createDetailApplyItemRow,
  type DetailItemData,
} from '@eds/desktop-components';
import { buildAmountRowValues } from '../list-field/tasksListFieldAmountRowData';
import { buildTasksListFieldCurrencyCustomize } from '../list-field/tasksListFieldCurrencyDefaults';
import { getCurrencyRowPreset } from '../list-field/tasksListFieldCurrencyRowPresets';
import {
  buildReceiverItem,
  buildSenderItem,
} from './buildSigningDetailSections';
import { parseRowIndexFromSigningId } from './signingStore';
import type { SigningDetail } from './types';

export type SigningCustomPopupCurrencyMeta = {
  symbol: string;
  cryptoName: string;
  networkLabel: string;
};

export function resolveSigningCustomPopupCurrencyMeta(
  detail: SigningDetail,
): SigningCustomPopupCurrencyMeta {
  const rowIndex = parseRowIndexFromSigningId(detail.id);
  const preset = getCurrencyRowPreset(rowIndex);
  const customize = buildTasksListFieldCurrencyCustomize(rowIndex);
  const symbol = preset?.symbol ?? 'USDT';
  const cryptoName = preset?.cryptoName ?? 'eds-usdt-tether usd';
  const networkLabel = String(customize.networkLabel ?? preset?.networkLabel ?? '').trim();

  return {
    symbol,
    cryptoName,
    networkLabel,
  };
}

const MINER_FEE_DISPLAYS = [
  '0.00266 ETH ≈ $1.87',
  '0.0002198 ETH ≈ $0.46',
  '0.000812 ETH ≈ $0.31',
] as const;

function resolveMinerFeeDisplay(rowIndex: number): string {
  return MINER_FEE_DISPLAYS[rowIndex % MINER_FEE_DISPLAYS.length] ?? MINER_FEE_DISPLAYS[1];
}

/** Figma 656×516 签名 custom 弹窗 — 明细：币种 → 金额 → 发送方 → 接收方 → 矿工费 → Memo */
export function buildSigningCustomPopupItems(
  detail: SigningDetail,
  translate: (key: string) => string,
): DetailItemData[] {
  const rowIndex = parseRowIndexFromSigningId(detail.id);
  const currency = resolveSigningCustomPopupCurrencyMeta(detail);
  const amount = buildAmountRowValues(rowIndex);

  return [
    createDetailApplyItemRow('crypto', {
      key: 'currency',
      title: translate('Token'),
      value: currency.symbol,
      valueSymbolCrypto: currency.cryptoName,
      valueIcon: currency.cryptoName,
      tag: currency.networkLabel || undefined,
    }),
    createDetailApplyItemRow('amount', {
      key: 'amount',
      title: translate('Amount'),
      value: `${amount.cryptoValue} ≈ ${amount.fiatValue}`,
      tag: '',
    }),
    buildSenderItem(detail, translate),
    buildReceiverItem(detail, translate),
    createDetailApplyItemRow('fee', {
      key: 'miner-fee',
      title: translate('Miner Fee'),
      value: resolveMinerFeeDisplay(rowIndex),
    }),
    createDetailApplyItemRow('memo', {
      key: 'memo',
      title: translate('Memo'),
      value: detail.memo,
    }),
  ];
}

export function formatSigningCustomPopupAmountHeadline(
  detail: SigningDetail,
  currency: SigningCustomPopupCurrencyMeta,
): string {
  return `${detail.amountHeadline} ${currency.symbol}`.trim();
}
