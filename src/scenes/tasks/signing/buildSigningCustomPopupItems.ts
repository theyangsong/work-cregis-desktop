import {
  createDetailApplyItemRow,
  type DetailItemData,
} from '@eds/desktop-components';
import { formatEmptyDisplayValue } from '@/utils/formatEmptyDisplay';
import { formatGroupedAmountText } from '@/utils/formatGroupedDisplay';
import { buildAmountRowValues } from '../list-field/tasksListFieldAmountRowData';
import { buildTasksListFieldCurrencyCustomize } from '../list-field/tasksListFieldCurrencyDefaults';
import { resolveCurrencyRowPreset } from '../list-field/tasksListFieldCurrencyRowData';
import { buildDetailInitiationSourceItem } from '../shared/buildDetailInitiationSourceItem';
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
  const preset = resolveCurrencyRowPreset(rowIndex);
  const customize = buildTasksListFieldCurrencyCustomize(rowIndex);
  const networkLabel = String(customize.networkLabel ?? preset.networkLabel ?? '').trim();

  return {
    symbol: preset.symbol,
    cryptoName: preset.cryptoName,
    networkLabel,
  };
}

const MINER_FEE_DISPLAYS = [
  '0.00266 ETH ≈ $1.87',
  '0.0002198 ETH ≈ $0.46',
  '0.000812 ETH ≈ $0.31',
] as const;

function resolveMinerFeeDisplay(rowIndex: number): string {
  const raw = MINER_FEE_DISPLAYS[rowIndex % MINER_FEE_DISPLAYS.length] ?? MINER_FEE_DISPLAYS[1];
  return formatGroupedAmountText(raw);
}

/** 签名进度弹窗：矿工费展示为绝对值（无 ≤ 前缀）。 */
export function formatSigningProgressMinerFeeDisplay(display: string): string {
  return formatGroupedAmountText(
    display.replace(/≤/g, '').replace(/\s+/g, ' ').trim(),
  );
}

/** Figma 656×480 签名 custom 弹窗 — 明细：币种 → 金额 → 发送方 → 接收方 → 矿工费 → Memo */
export function buildSigningCustomPopupItems(
  detail: SigningDetail,
  translate: (key: string) => string,
  minerFeeDisplay?: string | null,
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
    buildDetailInitiationSourceItem(rowIndex, translate),
    createDetailApplyItemRow('amount', {
      key: 'amount',
      title: translate('Amount'),
      value: formatGroupedAmountText(`${amount.cryptoValue} ≈ ${amount.fiatValue}`),
      tag: '',
    }),
    buildSenderItem(detail, translate),
    {
      ...buildReceiverItem(detail, translate),
      showValueAddressBook: false,
      showValueAmlSearch: false,
    },
    createDetailApplyItemRow('fee', {
      key: 'miner-fee',
      title: translate('Miner Fee'),
      value: minerFeeDisplay
        ? formatSigningProgressMinerFeeDisplay(minerFeeDisplay)
        : resolveMinerFeeDisplay(rowIndex),
    }),
    createDetailApplyItemRow('memo', {
      key: 'memo',
      title: translate('Memo'),
      value: formatEmptyDisplayValue(detail.memo),
    }),
  ];
}

export function formatSigningCustomPopupAmountHeadline(detail: SigningDetail): string {
  return formatGroupedAmountText(detail.amountHeadline);
}
