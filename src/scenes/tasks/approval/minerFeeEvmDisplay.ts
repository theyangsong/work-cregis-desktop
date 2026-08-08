import type { MinerFeeCustomSaved } from './minerFeeCustomTypes';
import type { MinerFeeOptionId } from './MinerFeeListPanel.vue';
import { formatGroupedAmountText } from '@/utils/formatGroupedDisplay';
import {
  minerFeeSpeedCryptoRangeKey,
  minerFeeSpeedUsdRangeKey,
  resolveMinerFeeEvmShellVariant,
  type MinerFeeEvmShellVariant,
} from './minerFeeEvmShellVariant';

function firstRangeSegment(text: string): string {
  const segment = text.split('~')[0]?.trim();
  return segment || text.trim();
}

export function buildEvmMinerFeeDisplay(
  optionId: MinerFeeOptionId | null,
  customSaved: MinerFeeCustomSaved | null,
  translate: (key: string) => string,
  symbol = 'ETH',
): string | null {
  if (!optionId) {
    return null;
  }

  const variant = resolveMinerFeeEvmShellVariant(symbol);

  if (optionId === 'custom') {
    if (!customSaved) {
      return null;
    }
    if (variant === 'btc') {
      return formatGroupedAmountText(`${customSaved.cryptoRange} ${customSaved.usdRange}`);
    }
    return formatGroupedAmountText(`${customSaved.cryptoRange} ≈ ${customSaved.usdRange}`);
  }

  const cryptoKey = minerFeeSpeedCryptoRangeKey(variant, optionId);
  const usdKey = minerFeeSpeedUsdRangeKey(variant, optionId);

  const cryptoText = translate(cryptoKey);
  const usdText = translate(usdKey);

  if (variant === 'btc') {
    return formatGroupedAmountText(`${cryptoText} ${usdText}`);
  }

  return formatGroupedAmountText(`${firstRangeSegment(cryptoText)} ≈ ${firstRangeSegment(usdText)}`);
}

export function resolveEvmShellVariantFromSymbol(symbol: string): MinerFeeEvmShellVariant {
  return resolveMinerFeeEvmShellVariant(symbol);
}
