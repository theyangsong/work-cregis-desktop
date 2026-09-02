import {
  buildBusinessTypeSecondaryLabel,
} from '../../list-field/businessTypeDisplay';
import { buildCurrencySideAddressData } from '../../list-field/listFieldCurrencyAddressCustomize';
import { resolveListFieldAddressLineModel } from '../../list-field/listFieldAddressLineModel';
import { buildAmountRowValues } from '../../list-field/tasksListFieldAmountRowData';
import {
  buildPayoutWalletsColumnValues,
  isMultiSignRow,
} from '../../list-field/tasksListFieldBusinessTypeRowData';
import { buildTasksListFieldBusinessTypeCustomize } from '../../list-field/tasksListFieldBusinessTypeDefaults';
import { buildTasksListFieldCurrencyCustomize } from '../../list-field/tasksListFieldCurrencyDefaults';
import { buildCurrencyAddressTags } from '../../list-field/listFieldCurrencyTagCustomize';
import type { CryptoAddressSideTags } from '@eds/desktop-components';
import {
  checkSigningPending,
  signingIdFromRowIndex,
} from '../signingStore';
import type { CryptoName } from '@eds/desktop-components';
import type { BatchAddressDisplay, SigningBatchRowModel } from './types';

/** 与列表第一列副行（Type of Business）同源。 */
export function resolveBatchBusinessType(rowIndex: number): string {
  return buildBusinessTypeSecondaryLabel(rowIndex);
}

export function buildCurrencyKey(symbol: string, networkLabel: string): string {
  return `${symbol}|${networkLabel.trim() || 'native'}`;
}

export function buildCurrencyLabel(symbol: string, networkLabel: string): string {
  const network = networkLabel.trim();
  return network ? `${symbol} · ${network}` : symbol;
}

function tagCustomizeForAddressSide(
  prefix: 'from' | 'to',
  customize: Record<string, unknown>,
  rowIndex: number,
): Record<string, unknown> {
  if (prefix === 'from') {
    return buildTasksListFieldBusinessTypeCustomize('', rowIndex, 'Signing');
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
  customize: Record<string, unknown>,
  rowIndex: number,
): string[] {
  const tagCustomize = tagCustomizeForAddressSide(prefix, customize, rowIndex);
  const tags = buildCurrencyAddressTags(prefix, 1, tagCustomize);
  return [...normalizeTagList(tags.system), ...normalizeTagList(tags.custom)]
    .map((tag) => String(tag.label ?? '').trim())
    .filter(Boolean);
}

function formatAddressDisplay(
  prefix: 'from' | 'to',
  customize: Record<string, unknown>,
  rowIndex: number,
): BatchAddressDisplay {
  const side = buildCurrencySideAddressData(prefix, customize);
  const model = resolveListFieldAddressLineModel(prefix, customize);

  return {
    alias: model.alias,
    address: side.address,
    tags: collectAddressTagLabels(prefix, customize, rowIndex),
    displayLine: model.primaryText,
  };
}

export function buildBatchSigningRowModel(rowIndex: number): SigningBatchRowModel {
  const customize = buildTasksListFieldCurrencyCustomize(rowIndex, '', 'Signing');
  const symbol = String(customize.symbol ?? 'ZEC');
  const showNetwork = Boolean(customize.showNetwork);
  const networkLabel = showNetwork ? String(customize.networkLabel ?? '').trim() : '';
  const cryptoName = String(customize.cryptoName ?? '') as CryptoName;
  const currencyKey = buildCurrencyKey(symbol, networkLabel);
  const currencyLabel = buildCurrencyLabel(symbol, networkLabel);
  const amount = buildAmountRowValues(rowIndex);
  const wallet = buildPayoutWalletsColumnValues(rowIndex);
  const businessType = resolveBatchBusinessType(rowIndex);
  const amountFull = `${amount.cryptoValue} ${amount.cryptoSymbol}`;

  return {
    rowIndex,
    signingId: signingIdFromRowIndex(rowIndex),
    currencyKey,
    symbol,
    networkLabel,
    currencyLabel,
    cryptoName,
    showNetwork,
    walletName: wallet.value,
    sender: formatAddressDisplay('from', customize, rowIndex),
    receiver: formatAddressDisplay('to', customize, rowIndex),
    businessType,
    amountCrypto: `${amount.cryptoValue} ${amount.cryptoSymbol}`,
    amountFiat: amount.fiatValue,
    amountFull,
    isSingleSign: !isMultiSignRow(rowIndex),
  };
}

export function buildBatchSigningRowModels(rowIndexes: number[]): SigningBatchRowModel[] {
  return rowIndexes.map(buildBatchSigningRowModel);
}

export function listPendingSigningRowIndexes(allRowIndexes: number[]): number[] {
  return allRowIndexes.filter((rowIndex) => {
    const id = signingIdFromRowIndex(rowIndex);
    return checkSigningPending(id, rowIndex);
  });
}

export function listPendingSingleSignRowIndexes(allRowIndexes: number[]): number[] {
  return allRowIndexes.filter((rowIndex) => {
    if (!buildBatchSigningRowModel(rowIndex).isSingleSign) return false;
    const id = signingIdFromRowIndex(rowIndex);
    return checkSigningPending(id, rowIndex);
  });
}
