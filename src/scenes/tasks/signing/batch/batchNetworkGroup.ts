import { resolveEvmShellVariantFromSymbol } from '@eds/desktop-components';
import { resolveMinerFeeProfile } from '../../shared/minerFeeProfile';
import type { BatchNetworkGroupKey } from './types';

export type BatchNetworkGroupMeta = {
  labelKey: string;
  /** EgCrypto name（与 SVG 文件名一致） */
  cryptoName: string;
};

const NETWORK_META: Record<BatchNetworkGroupKey, BatchNetworkGroupMeta> = {
  evm: {
    labelKey: 'Ethereum Mainnet',
    cryptoName: 'Ethereum Mainnet',
  },
  btc: {
    labelKey: 'Bitcoin',
    cryptoName: 'eds-btc-bitcoin',
  },
  'ton-xrp': {
    labelKey: 'The Open Network',
    cryptoName: 'The Open Network',
  },
  tron: {
    labelKey: 'Tron',
    cryptoName: 'eds-trx-tron',
  },
};

const NETWORK_LABEL_KEY: Record<BatchNetworkGroupKey, string> = {
  evm: NETWORK_META.evm.labelKey,
  btc: NETWORK_META.btc.labelKey,
  'ton-xrp': NETWORK_META['ton-xrp'].labelKey,
  tron: NETWORK_META.tron.labelKey,
};

/** 与矿工费 Popover 四套 UI 对齐：EVM(ETH壳) / BTC壳 / TON系 / TRON。 */
export function resolveBatchNetworkGroupKey(rowIndex: number): BatchNetworkGroupKey {
  const profile = resolveMinerFeeProfile(rowIndex);
  if (profile.kind === 'tron') return 'tron';
  if (profile.kind === 'ton-xrp') return 'ton-xrp';
  if (resolveEvmShellVariantFromSymbol(profile.symbol) === 'btc') return 'btc';
  return 'evm';
}

export function resolveBatchNetworkLabelKey(networkKey: BatchNetworkGroupKey): string {
  return NETWORK_LABEL_KEY[networkKey];
}

export function resolveBatchNetworkGroupMeta(
  networkKey: BatchNetworkGroupKey,
): BatchNetworkGroupMeta {
  return NETWORK_META[networkKey];
}

export const BATCH_NETWORK_GROUP_ORDER: readonly BatchNetworkGroupKey[] = [
  'evm',
  'btc',
  'ton-xrp',
  'tron',
] as const;
