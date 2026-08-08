/** ETH / BTC 共用 MinerFeeEvmPopoverPanel 壳，仅文案与字段不同。 */
export type MinerFeeEvmShellVariant = 'eth' | 'btc';

export function resolveMinerFeeEvmShellVariant(symbol: string): MinerFeeEvmShellVariant {
  return symbol.trim().toUpperCase() === 'BTC' ? 'btc' : 'eth';
}

export function minerFeeSpeedCryptoRangeKey(
  variant: MinerFeeEvmShellVariant,
  speed: 'fast' | 'normal' | 'slow',
): string {
  const asset = variant === 'btc' ? 'btc' : 'eth';
  return `Miner fee ${speed} ${asset} range`;
}

export function minerFeeSpeedUsdRangeKey(
  variant: MinerFeeEvmShellVariant,
  speed: 'fast' | 'normal' | 'slow',
): string {
  if (variant === 'btc') {
    return `Miner fee ${speed} btc usd range`;
  }
  // ETH 沿用原有 i18n 键（无 asset 段）：Miner fee fast usd range
  return `Miner fee ${speed} usd range`;
}
