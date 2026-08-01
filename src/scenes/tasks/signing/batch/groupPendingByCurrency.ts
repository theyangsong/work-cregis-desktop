import {
  buildBatchSigningRowModel,
  listPendingSingleSignRowIndexes,
} from './buildBatchSigningRowModel';
import type { BatchCurrencyGroup } from './types';

export function groupPendingByCurrency(allRowIndexes: number[]): BatchCurrencyGroup[] {
  const pending = listPendingSingleSignRowIndexes(allRowIndexes);
  const map = new Map<string, BatchCurrencyGroup>();

  for (const rowIndex of pending) {
    const row = buildBatchSigningRowModel(rowIndex);
    const existing = map.get(row.currencyKey);
    if (existing) {
      existing.count += 1;
      existing.rowIndexes.push(rowIndex);
      continue;
    }

    map.set(row.currencyKey, {
      currencyKey: row.currencyKey,
      currencyLabel: row.currencyLabel,
      symbol: row.symbol,
      networkLabel: row.networkLabel,
      cryptoName: row.cryptoName,
      showNetwork: row.showNetwork,
      count: 1,
      rowIndexes: [rowIndex],
    });
  }

  return [...map.values()].sort((a, b) => a.currencyLabel.localeCompare(b.currencyLabel));
}

export function countDistinctPendingCurrencies(allRowIndexes: number[]): number {
  return groupPendingByCurrency(allRowIndexes).length;
}
