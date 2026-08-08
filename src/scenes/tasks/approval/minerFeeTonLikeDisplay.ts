import { formatGroupedAmountText } from '@/utils/formatGroupedDisplay';

export type TonLikeMinerFeeQuote = {
  cryptoAmount: string;
  usdApprox: string;
};

/** 演示用固定矿工费（TON 类：单档只读报价，无 fast/normal/slow）。 */
const TON_LIKE_FEE_QUOTES: Record<string, TonLikeMinerFeeQuote> = {
  TON: { cryptoAmount: '0.00000000877', usdApprox: '$0.03' },
  XRP: { cryptoAmount: '0.000012', usdApprox: '$0.01' },
  SOL: { cryptoAmount: '0.000005', usdApprox: '$0.02' },
  MNT: { cryptoAmount: '0.00018', usdApprox: '$0.02' },
  SUI: { cryptoAmount: '0.00042', usdApprox: '$0.02' },
  DEEP: { cryptoAmount: '0.0012', usdApprox: '$0.03' },
};

const DEFAULT_TON_LIKE_QUOTE: TonLikeMinerFeeQuote = {
  cryptoAmount: '0.00001',
  usdApprox: '$0.03',
};

export function resolveTonLikeMinerFeeQuote(symbol: string): TonLikeMinerFeeQuote {
  const upper = symbol.trim().toUpperCase();
  return TON_LIKE_FEE_QUOTES[upper] ?? DEFAULT_TON_LIKE_QUOTE;
}

export function buildTonLikeMinerFeeDisplay(symbol: string, quote?: TonLikeMinerFeeQuote): string {
  const resolved = quote ?? resolveTonLikeMinerFeeQuote(symbol);
  const ticker = symbol.trim().toUpperCase() || '—';
  return formatGroupedAmountText(`${resolved.cryptoAmount} ${ticker} ≈ ${resolved.usdApprox}`);
}
