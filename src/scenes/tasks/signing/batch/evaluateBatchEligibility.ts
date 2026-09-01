import { resolveAddressFamily } from '../../list-field/listFieldCryptoSampleAddresses';
import { resolveCurrencyRowPreset } from '../../list-field/tasksListFieldCurrencyRowData';
import { buildBatchSigningRowModel } from './buildBatchSigningRowModel';
import { isSigningBatchMinerFeeStubDemoRow } from './signingBatchDemoRowDistribution';
import type { BatchEligibilityResult, BatchIneligibleReason, SigningBatchRowModel } from './types';

function seededFraction(rowIndex: number, salt: number): number {
  const x = Math.sin((rowIndex + 1) * 9973 + salt * 7919) * 10000;
  return x - Math.floor(x);
}

function isTronFamily(symbol: string, rowIndex: number): boolean {
  const preset = resolveCurrencyRowPreset(rowIndex);
  const family = preset.addressFamily ?? resolveAddressFamily(symbol, preset.addressFamily);
  return family === 'trx';
}

function mockReasonForRow(rowIndex: number): BatchIneligibleReason | null {
  const bucket = Math.floor(seededFraction(rowIndex, 41) * 20);
  if (bucket === 0) return 'wallet-shard-missing';
  if (bucket === 1) return 'non-whitelist';
  if (bucket === 2) return 'blacklist';
  return null;
}

function parseFiatNumeric(fiat: string): number {
  const cleaned = fiat.replace(/[^0-9.]/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

function parseCryptoNumeric(cryptoValue: string): number {
  const cleaned = cryptoValue.replace(/,/g, '').split(' ')[0] ?? '0';
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

function groupRowsBySender(rows: SigningBatchRowModel[]): Map<string, SigningBatchRowModel[]> {
  const map = new Map<string, SigningBatchRowModel[]>();
  for (const row of rows) {
    const key = row.sender.address;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

export function evaluateBatchEligibility(
  rowIndexes: number[],
): BatchEligibilityResult {
  const rows = rowIndexes.map(buildBatchSigningRowModel);
  const signable: SigningBatchRowModel[] = [];
  const ineligible: BatchEligibilityResult['ineligible'] = [];
  const deferredBySender = new Map<string, SigningBatchRowModel[]>();

  for (const row of rows) {
    const mockReason = isSigningBatchMinerFeeStubDemoRow(row.rowIndex)
      ? null
      : mockReasonForRow(row.rowIndex);
    if (mockReason) {
      ineligible.push({ row, reason: mockReason });
      continue;
    }
    const senderKey = row.sender.address;
    const list = deferredBySender.get(senderKey) ?? [];
    list.push(row);
    deferredBySender.set(senderKey, list);
  }

  for (const [, senderRows] of deferredBySender) {
    const totalFiat = senderRows.reduce(
      (sum, row) => sum + parseFiatNumeric(row.amountFiat),
      0,
    );
    const totalCrypto = senderRows.reduce(
      (sum, row) => sum + parseCryptoNumeric(row.amountCrypto),
      0,
    );

    if (totalFiat > 25_000 || totalCrypto > 500) {
      for (const row of senderRows) {
        ineligible.push({ row, reason: 'insufficient-balance' });
      }
      continue;
    }

    const sample = senderRows[0]!;
    const tron = isTronFamily(sample.symbol, sample.rowIndex);
    const minerFeeStubDemoBatch = senderRows.every((row) =>
      isSigningBatchMinerFeeStubDemoRow(row.rowIndex),
    );
    const maxMinerFeeRows = tron || minerFeeStubDemoBatch
      ? senderRows.length
      : Math.max(1, Math.floor(seededFraction(sample.rowIndex, 53) * senderRows.length) + 1);

    senderRows.forEach((row, index) => {
      if (!tron && index >= maxMinerFeeRows) {
        ineligible.push({ row, reason: 'insufficient-miner-fee' });
        return;
      }
      signable.push(row);
    });
  }

  return { signable, ineligible };
}

export const BATCH_INELIGIBLE_REASON_LABELS: Record<BatchIneligibleReason, string> = {
  'wallet-shard-missing': 'Wallet Shard Not Imported',
  'non-whitelist': 'Non-whitelisted Address',
  blacklist: 'Blacklisted Address',
  'insufficient-balance': 'Insufficient Balance',
  'insufficient-miner-fee': 'Insufficient miner fee',
};

/** 不可签名原因分组与列表展示顺序（同类型相邻）。 */
export const BATCH_INELIGIBLE_REASON_ORDER: readonly BatchIneligibleReason[] = [
  'blacklist',
  'non-whitelist',
  'wallet-shard-missing',
  'insufficient-balance',
  'insufficient-miner-fee',
];

const ineligibleReasonOrderIndex = new Map(
  BATCH_INELIGIBLE_REASON_ORDER.map((reason, index) => [reason, index]),
);

function compareIneligibleByReason(
  a: BatchEligibilityResult['ineligible'][number],
  b: BatchEligibilityResult['ineligible'][number],
): number {
  const reasonDelta =
    (ineligibleReasonOrderIndex.get(a.reason) ?? Number.MAX_SAFE_INTEGER)
    - (ineligibleReasonOrderIndex.get(b.reason) ?? Number.MAX_SAFE_INTEGER);
  if (reasonDelta !== 0) {
    return reasonDelta;
  }
  return a.row.rowIndex - b.row.rowIndex;
}

export function sortIneligibleByReasonOrder(
  ineligible: BatchEligibilityResult['ineligible'],
): BatchEligibilityResult['ineligible'] {
  return [...ineligible].sort(compareIneligibleByReason);
}

export function groupIneligibleByReason(
  ineligible: BatchEligibilityResult['ineligible'],
): Array<{ reason: BatchIneligibleReason; rows: SigningBatchRowModel[] }> {
  const map = new Map<BatchIneligibleReason, SigningBatchRowModel[]>();
  for (const item of sortIneligibleByReasonOrder(ineligible)) {
    const list = map.get(item.reason) ?? [];
    list.push(item.row);
    map.set(item.reason, list);
  }
  return BATCH_INELIGIBLE_REASON_ORDER
    .filter((reason) => map.has(reason))
    .map((reason) => ({
      reason,
      rows: map.get(reason) ?? [],
    }));
}

export function groupSignableBySender(
  signable: SigningBatchRowModel[],
): Array<{ senderKey: string; senderLabel: string; rows: SigningBatchRowModel[] }> {
  const map = groupRowsBySender(signable);
  return [...map.entries()].map(([senderKey, rows]) => ({
    senderKey,
    senderLabel: rows[0]?.sender.displayLine ?? senderKey,
    rows,
  }));
}
