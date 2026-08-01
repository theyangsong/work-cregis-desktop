import { formatGroupedNumber } from '@eds/desktop-components';
import type { BatchSummaryBreakdown, SigningBatchRowModel } from './types';

function parseFiatNumeric(fiat: string): number {
  const cleaned = fiat.replace(/[^0-9.]/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

function formatUsdTotal(total: number): string {
  if (total < 1) {
    return `$0.${String(Math.max(1, Math.round(total * 100))).padStart(2, '0')}`;
  }
  const rounded = Math.round(total * 100) / 100;
  const [whole, frac = '00'] = rounded.toFixed(2).split('.');
  return `$${formatGroupedNumber(Number(whole))}.${frac}`;
}

export function buildBatchSummary(rows: SigningBatchRowModel[]): BatchSummaryBreakdown {
  const businessTypeMap = new Map<string, number>();
  const walletMap = new Map<string, number>();
  let totalFiat = 0;
  const cryptoParts = new Map<string, number>();

  for (const row of rows) {
    businessTypeMap.set(row.businessType, (businessTypeMap.get(row.businessType) ?? 0) + 1);
    walletMap.set(row.walletName, (walletMap.get(row.walletName) ?? 0) + 1);
    totalFiat += parseFiatNumeric(row.amountFiat);
    const [amountRaw, symbolRaw] = row.amountCrypto.split(' ');
    const amount = Number.parseFloat((amountRaw ?? '0').replace(/,/g, ''));
    const symbol = symbolRaw ?? row.symbol;
    if (Number.isFinite(amount)) {
      cryptoParts.set(symbol, (cryptoParts.get(symbol) ?? 0) + amount);
    }
  }

  const cryptoSummary = [...cryptoParts.entries()]
    .map(([symbol, amount]) => {
      const formatted = Number.isInteger(amount)
        ? formatGroupedNumber(amount)
        : formatGroupedNumber(Math.round(amount * 1_000_000) / 1_000_000);
      return `${formatted} ${symbol}`;
    })
    .join(' + ');

  return {
    businessTypes: [...businessTypeMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    wallets: [...walletMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    totalCrypto: cryptoSummary || '0',
    totalFiat: formatUsdTotal(totalFiat),
  };
}

export function formatBreakdownLine(
  items: Array<{ label: string; count: number }>,
): string {
  return items.map((item) => `${item.label}（${item.count}）`).join('、');
}
