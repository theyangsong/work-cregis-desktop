import { buildCurrencySideAddressData } from '../../list-field/listFieldCurrencyAddressCustomize';
import { CURRENCY_CUSTOM_TAG_DEFAULT_LABELS } from '../../list-field/listFieldCurrencyTagCustomize';
import { buildAmountRowValues } from '../../list-field/tasksListFieldAmountRowData';
import {
  buildPayoutWalletsColumnValues,
  buildTransferTypeRowValues,
  isMultiSignRow,
} from '../../list-field/tasksListFieldBusinessTypeRowData';
import { buildTasksListFieldCurrencyCustomize } from '../../list-field/tasksListFieldCurrencyDefaults';
import {
  checkSigningPending,
  signingIdFromRowIndex,
} from '../signingStore';
import type { CryptoName } from '@eds/desktop-components';
import type { BatchAddressDisplay, SigningBatchRowModel } from './types';

const EXTENDED_BUSINESS_TYPES = [
  'Manual Transfer',
  'Wallet Payout',
  'Sub-Address Payout',
  'Swap',
  'Contract Authorization',
  'CSPN',
  'Revoke Authorization',
  'Remittance',
] as const;

function seededFraction(rowIndex: number, salt: number): number {
  const x = Math.sin((rowIndex + 1) * 9973 + salt * 7919) * 10000;
  return x - Math.floor(x);
}

export function resolveBatchBusinessType(rowIndex: number): string {
  const transfer = buildTransferTypeRowValues(rowIndex).value;
  if (seededFraction(rowIndex, 23) > 0.82) {
    const extendedIndex = Math.floor(seededFraction(rowIndex, 29) * EXTENDED_BUSINESS_TYPES.length);
    return EXTENDED_BUSINESS_TYPES[extendedIndex] ?? transfer;
  }
  return transfer;
}

export function buildCurrencyKey(symbol: string, networkLabel: string): string {
  return `${symbol}|${networkLabel.trim() || 'native'}`;
}

export function buildCurrencyLabel(symbol: string, networkLabel: string): string {
  const network = networkLabel.trim();
  return network ? `${symbol} · ${network}` : symbol;
}

function demoAddressTags(rowIndex: number, salt: number): string[] {
  if (seededFraction(rowIndex, salt) > 0.45) return [];
  const index = Math.floor(seededFraction(rowIndex, salt + 1) * CURRENCY_CUSTOM_TAG_DEFAULT_LABELS.length);
  return [CURRENCY_CUSTOM_TAG_DEFAULT_LABELS[index] ?? 'Custom'];
}

function formatAddressDisplay(
  prefix: 'from' | 'to',
  customize: Record<string, unknown>,
  rowIndex: number,
): BatchAddressDisplay {
  const side = buildCurrencySideAddressData(prefix, customize);
  const tags = demoAddressTags(rowIndex, prefix === 'from' ? 3 : 5);
  const aliasPart = side.alias.trim();
  const displayLine = aliasPart
    ? `${aliasPart} · ${side.address}${tags.length ? ` · ${tags.join(' · ')}` : ''}`
    : `${side.address}${tags.length ? ` · ${tags.join(' · ')}` : ''}`;

  return {
    alias: aliasPart,
    address: side.address,
    tags,
    displayLine,
  };
}

export function buildBatchSigningRowModel(rowIndex: number): SigningBatchRowModel {
  const customize = buildTasksListFieldCurrencyCustomize(rowIndex);
  const symbol = String(customize.symbol ?? 'ZEC');
  const showNetwork = Boolean(customize.showNetwork);
  const networkLabel = showNetwork ? String(customize.networkLabel ?? '').trim() : '';
  const cryptoName = String(customize.cryptoName ?? '') as CryptoName;
  const currencyKey = buildCurrencyKey(symbol, networkLabel);
  const currencyLabel = buildCurrencyLabel(symbol, networkLabel);
  const amount = buildAmountRowValues(rowIndex);
  const wallet = buildPayoutWalletsColumnValues(rowIndex);
  const businessType = resolveBatchBusinessType(rowIndex);
  const amountFull = networkLabel
    ? `${amount.cryptoValue} ${amount.cryptoSymbol} · ${networkLabel}`
    : `${amount.cryptoValue} ${amount.cryptoSymbol}`;

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
