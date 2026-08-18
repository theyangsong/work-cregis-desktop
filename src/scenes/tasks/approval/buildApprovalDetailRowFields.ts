import { buildAmountRowValues } from '../list-field/tasksListFieldAmountRowData';
import {
  buildBusinessTypeSecondaryLabel,
  buildApplicationTimeSecondaryValue,
} from '../list-field/businessTypeDisplay';
import {
  buildPayoutWalletsColumnValues,
  buildPayoutWalletCode,
  buildSenderWalletDisplayName,
  buildTransferTypeRowValues,
} from '../list-field/tasksListFieldBusinessTypeRowData';
import type { AppLocale } from '@/composables/useAppLocale';
import { translateUiText } from '@/i18n/translateUiText';
import { buildTasksListFieldBusinessTypeCustomize } from '../list-field/tasksListFieldBusinessTypeDefaults';
import { buildTasksListFieldCurrencyCustomize } from '../list-field/tasksListFieldCurrencyDefaults';
import { buildCurrencySideAddressData } from '../list-field/listFieldCurrencyAddressCustomize';
import { buildCurrencyAddressTags } from '../list-field/listFieldCurrencyTagCustomize';
import type { CryptoAddressSideTags } from '@eds/desktop-components';
import { parseCurrencyOrderCount } from '../list-field/listFieldCurrencyShared';
import { resolveCurrencyRowPreset } from '../list-field/tasksListFieldCurrencyRowData';
import { DATA_LIST_FIGMA_COLUMNS } from '../tasksDataListPageData';
import type { ApprovalAddressEntry } from './types';

export function formatApprovalAmountDisplay(rowIndex: number): string {
  const amount = buildAmountRowValues(rowIndex);
  return `${amount.cryptoValue} ${amount.cryptoSymbol} ≈ ${amount.fiatValue}`;
}

export function formatApprovalCreatedTime(rowIndex: number): string {
  return buildApplicationTimeSecondaryValue(rowIndex);
}

export function formatApprovalPayoutWallet(
  rowIndex: number,
  locale: AppLocale = 'en',
): string {
  return buildSenderWalletDisplayName(rowIndex, locale);
}

export function formatApprovalPayoutWalletSignLabel(rowIndex: number): string {
  return buildPayoutWalletsColumnValues(rowIndex).rightLabel ?? 'Single-Sign';
}

export function formatApprovalExpiryDisplay(
  rowIndex: number,
  locale: AppLocale = 'zh-CN',
): string | null {
  const transfer = buildTransferTypeRowValues(rowIndex);
  if (!transfer.showCountdown) return null;
  const minutes = String(transfer.countdownMinutes ?? '30').padStart(2, '0');
  const seconds = String(transfer.countdownSeconds ?? '00').padStart(2, '0');
  const suffix = translateUiText(locale, 'Until Expiry');
  return `${minutes}:${seconds} ${suffix}`;
}

function tagCustomizeForAddressSide(
  prefix: 'from' | 'to',
  customize: Record<string, unknown>,
  rowIndex: number,
): Record<string, unknown> {
  if (prefix === 'from') {
    return buildTasksListFieldBusinessTypeCustomize('', rowIndex);
  }
  return customize;
}

function normalizeTagList(
  tags?: CryptoAddressSideTags['system'] | CryptoAddressSideTags['custom'],
) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : [tags];
  return list.filter((tag) => tag.show !== false);
}

function collectAddressTagLabels(
  prefix: 'from' | 'to',
  addressIndex: number,
  customize: Record<string, unknown>,
): string[] {
  const tags = buildCurrencyAddressTags(prefix, addressIndex, customize);
  return [...normalizeTagList(tags.system), ...normalizeTagList(tags.custom)]
    .map((tag) => String(tag.label ?? '').trim())
    .filter(Boolean);
}

function buildSideAddressEntries(
  prefix: 'from' | 'to',
  customize: Record<string, unknown>,
  rowIndex: number,
): ApprovalAddressEntry[] {
  const side = buildCurrencySideAddressData(prefix, customize);
  const tagCustomize = tagCustomizeForAddressSide(prefix, customize, rowIndex);
  const amount = buildAmountRowValues(rowIndex);
  const amountLabel = `${amount.cryptoValue} ${amount.cryptoSymbol}`;
  const entries: ApprovalAddressEntry[] = [];

  for (let index = 1; index <= side.count; index += 1) {
    const addressKey = `${prefix}Address${index}`;
    const aliasKey = `${prefix}Alias${index}`;
    const address = String(customize[addressKey] ?? '').trim() || side.address;
    const alias = String(customize[aliasKey] ?? '').trim();
    entries.push({
      alias,
      address,
      tags: collectAddressTagLabels(prefix, index, tagCustomize),
      addressTags: buildCurrencyAddressTags(prefix, index, tagCustomize),
      amount: amountLabel,
    });
  }

  if (entries.length === 0) {
    entries.push({
      alias: side.alias,
      address: side.address,
      tags: collectAddressTagLabels(prefix, 1, tagCustomize),
      addressTags: buildCurrencyAddressTags(prefix, 1, tagCustomize),
      amount: amountLabel,
    });
  }

  return entries;
}

/** 与 Data List 同行索引对齐的详情字段（列表有数据源的项）。 */
export function buildApprovalDetailRowFields(rowIndex: number) {
  const customize = buildTasksListFieldCurrencyCustomize(rowIndex);
  const fromSide = buildCurrencySideAddressData('from', customize);
  const toSide = buildCurrencySideAddressData('to', customize);
  const senders = buildSideAddressEntries('from', customize, rowIndex);
  const receivers = buildSideAddressEntries('to', customize, rowIndex);
  const transferType = buildTransferTypeRowValues(rowIndex);

  const amount = buildAmountRowValues(rowIndex);
  const currencyPreset = resolveCurrencyRowPreset(rowIndex);
  const networkLabel = String(
    customize.networkLabel ?? currencyPreset.networkLabel ?? '',
  ).trim();

  return {
    amountDisplay: formatApprovalAmountDisplay(rowIndex),
    amountColumnLabel: DATA_LIST_FIGMA_COLUMNS.amount.label,
    amountHeadline: `${amount.cryptoValue} ${amount.cryptoSymbol} ≈ ${amount.fiatValue}`,
    amountRowValue: `${amount.cryptoValue} ≈ ${amount.fiatValue}`,
    amountCryptoSymbol: amount.cryptoSymbol,
    amountCryptoName: currencyPreset.cryptoName,
    amountNetworkLabel: networkLabel,
    businessType: buildBusinessTypeSecondaryLabel(rowIndex),
    expiryDisplay: formatApprovalExpiryDisplay(rowIndex),
    expiryCountdownMinutes: transferType.showCountdown
      ? String(transferType.countdownMinutes ?? '30')
      : undefined,
    expiryCountdownSeconds: transferType.showCountdown
      ? String(transferType.countdownSeconds ?? '00')
      : undefined,
    appliedAtDisplay: formatApprovalCreatedTime(rowIndex),
    payoutWallet: formatApprovalPayoutWallet(rowIndex),
    payoutWalletCode: buildPayoutWalletCode(rowIndex),
    payoutWalletSignLabel: formatApprovalPayoutWalletSignLabel(rowIndex),
    senderSummary: fromSide.address,
    senderCount: fromSide.count,
    senderOrderCount: parseCurrencyOrderCount(customize.fromOrderCount) || undefined,
    senders,
    receiverSummary: toSide.address,
    receiverCount: toSide.count,
    receiverOrderCount: parseCurrencyOrderCount(customize.toOrderCount) || undefined,
    receivers,
  };
}
