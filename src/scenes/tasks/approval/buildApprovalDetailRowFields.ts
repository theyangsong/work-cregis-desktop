import { buildAmountRowValues } from '../list-field/tasksListFieldAmountRowData';
import {
  buildPayoutWalletsColumnValues,
  buildTransferTypeRowValues,
} from '../list-field/tasksListFieldBusinessTypeRowData';
import { buildGeneralStructureRowValues } from '../list-field/tasksListFieldGeneralStructureRowData';
import { buildTasksListFieldCurrencyCustomize } from '../list-field/tasksListFieldCurrencyDefaults';
import { buildCurrencySideAddressData } from '../list-field/listFieldCurrencyAddressCustomize';
import { getCurrencyRowPreset } from '../list-field/tasksListFieldCurrencyRowPresets';
import { DATA_LIST_FIGMA_COLUMNS } from '../tasksDataListPageData';
import type { ApprovalAddressEntry } from './types';

export function formatApprovalAmountDisplay(rowIndex: number): string {
  const amount = buildAmountRowValues(rowIndex);
  const customize = buildTasksListFieldCurrencyCustomize(rowIndex);
  const preset = getCurrencyRowPreset(rowIndex);
  const showNetwork = Boolean(customize.showNetwork ?? preset?.showNetwork);
  const networkLabel = String(customize.networkLabel ?? preset?.networkLabel ?? '').trim();
  const networkPart = showNetwork && networkLabel ? `-${networkLabel}` : '';
  return `${amount.cryptoValue} ${amount.cryptoSymbol}${networkPart} ≈ ${amount.fiatValue}`;
}

export function formatApprovalCreatedTime(rowIndex: number): string {
  return buildGeneralStructureRowValues(rowIndex).secondaryValue;
}

export function formatApprovalPayoutWallet(rowIndex: number): string {
  const wallet = buildPayoutWalletsColumnValues(rowIndex);
  const signLabel = wallet.rightLabel ?? 'Single-Sign';
  return `${wallet.value} · ${signLabel}`;
}

export function formatApprovalExpiryDisplay(rowIndex: number): string | null {
  const transfer = buildTransferTypeRowValues(rowIndex);
  if (!transfer.showCountdown) return null;
  const minutes = String(transfer.countdownMinutes ?? '30').padStart(2, '0');
  const seconds = String(transfer.countdownSeconds ?? '00').padStart(2, '0');
  return `${minutes}:${seconds} Until Expiry`;
}

function buildSideAddressEntries(
  prefix: 'from' | 'to',
  customize: Record<string, unknown>,
  rowIndex: number,
): ApprovalAddressEntry[] {
  const side = buildCurrencySideAddressData(prefix, customize);
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
      tags: [],
      amount: amountLabel,
    });
  }

  if (entries.length === 0) {
    entries.push({
      alias: side.alias,
      address: side.address,
      tags: [],
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

  return {
    amountDisplay: formatApprovalAmountDisplay(rowIndex),
    amountColumnLabel: DATA_LIST_FIGMA_COLUMNS.amount.label,
    amountHeadline: buildAmountRowValues(rowIndex).cryptoValue,
    businessType: transferType.value,
    expiryDisplay: formatApprovalExpiryDisplay(rowIndex),
    appliedAtDisplay: formatApprovalCreatedTime(rowIndex),
    payoutWallet: formatApprovalPayoutWallet(rowIndex),
    senderSummary: fromSide.address,
    senderCount: fromSide.count,
    senders,
    receiverSummary: toSide.address,
    receiverCount: toSide.count,
    receivers,
  };
}
