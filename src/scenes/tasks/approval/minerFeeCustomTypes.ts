import type { MinerFeeEvmShellVariant } from './minerFeeEvmShellVariant';

export type MinerFeeCustomMode = 'advanced' | 'normal';

export type MinerFeeCustomDraft = {
  mode: MinerFeeCustomMode;
  maxFee: string;
  maxPriorityFee: string;
  gasPrice: string;
  gasLimit: string;
  /** BTC 自定义：费率（sats/vB）。 */
  feeRate: string;
};

export type MinerFeeCustomSaved = {
  cryptoRange: string;
  usdRange: string;
};

export const DEFAULT_ETH_MINER_FEE_CUSTOM_DRAFT: MinerFeeCustomDraft = {
  mode: 'advanced',
  maxFee: '59',
  maxPriorityFee: '1.8',
  gasPrice: '59',
  gasLimit: '1.8',
  feeRate: '3',
};

export const DEFAULT_BTC_MINER_FEE_CUSTOM_DRAFT: MinerFeeCustomDraft = {
  mode: 'normal',
  maxFee: '',
  maxPriorityFee: '',
  gasPrice: '',
  gasLimit: '',
  feeRate: '3',
};

/** @deprecated 使用 DEFAULT_ETH_MINER_FEE_CUSTOM_DRAFT */
export const DEFAULT_MINER_FEE_CUSTOM_DRAFT = DEFAULT_ETH_MINER_FEE_CUSTOM_DRAFT;

export function defaultMinerFeeCustomDraft(
  variant: MinerFeeEvmShellVariant,
): MinerFeeCustomDraft {
  return variant === 'btc'
    ? { ...DEFAULT_BTC_MINER_FEE_CUSTOM_DRAFT }
    : { ...DEFAULT_ETH_MINER_FEE_CUSTOM_DRAFT };
}

export function buildMinerFeeCustomPreview(
  draft: MinerFeeCustomDraft,
  variant: MinerFeeEvmShellVariant = 'eth',
): MinerFeeCustomSaved {
  if (variant === 'btc') {
    const rate = Number.parseFloat(draft.feeRate) || 3;
    const scale = rate / 3;
    const btcValue = 0.000000000577 * scale;
    const usdValue = 0.01 * scale;
    return {
      cryptoRange: `${btcValue.toFixed(12)} BTC`,
      usdRange: `≈ $${usdValue.toFixed(2)}`,
    };
  }

  const gasLimit = Number.parseFloat(draft.gasLimit) || 1.8;
  const feeBasis =
    draft.mode === 'normal'
      ? Number.parseFloat(draft.gasPrice) || 59
      : Number.parseFloat(draft.maxFee) || 59;
  const scale = (feeBasis / 59) * (gasLimit / 1.8);
  const ethValue = 0.00023 * scale;
  const usdValue = 0.56 * scale;

  return {
    cryptoRange: `${ethValue.toFixed(5)} ETH`,
    usdRange: `≤$${usdValue.toFixed(2)}`,
  };
}
