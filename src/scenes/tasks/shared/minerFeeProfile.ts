import type { CryptoAddressFamily } from '../list-field/listFieldCryptoSampleAddresses';
import { buildTonLikeMinerFeeDisplay } from '../approval/minerFeeTonLikeDisplay';
import { buildTronMinerFeeDisplay } from '../approval/minerFeeTronDisplay';
import { buildTasksListFieldCurrencyCustomize } from '../list-field/tasksListFieldCurrencyDefaults';
import { resolveCurrencyRowPreset } from '../list-field/tasksListFieldCurrencyRowData';
import { parseRowIndexFromSigningId } from '../signing/signingStore';
import type { SigningDetail } from '../signing/types';

/** 矿工费 Popover UI 分组。 */
export type MinerFeeProfileKind = 'evm' | 'ton-xrp' | 'tron';

export type MinerFeeProfile = {
  kind: MinerFeeProfileKind;
  symbol: string;
  networkLabel: string;
  rowIndex: number;
};

export type MinerFeeSelection = {
  profileKind: MinerFeeProfileKind;
  displayValue: string;
};

/** BTC / ETH 等同壳（Gas fee 列表 + 自定义）；TON 系、TRON 独立布局。 */
const PROFILE_KIND_BY_FAMILY: Record<CryptoAddressFamily, MinerFeeProfileKind> = {
  evm: 'evm',
  btc: 'evm',
  zec: 'evm',
  ltc: 'evm',
  doge: 'evm',
  ton: 'ton-xrp',
  xrp: 'ton-xrp',
  trx: 'tron',
  sol: 'ton-xrp',
  sui: 'ton-xrp',
};

const DEFAULT_MINER_FEE_PROFILE_KIND: MinerFeeProfileKind = 'evm';

const POPOVER_TITLE_KEY_BY_KIND: Record<MinerFeeProfileKind, string> = {
  evm: 'Gas fee',
  'ton-xrp': 'Miner Fee',
  tron: 'Gas fee',
};

export function isEvmMinerFeeShell(kind: MinerFeeProfileKind): boolean {
  return kind === 'evm';
}

export function resolveMinerFeeProfileKind(family: CryptoAddressFamily): MinerFeeProfileKind {
  return PROFILE_KIND_BY_FAMILY[family] ?? DEFAULT_MINER_FEE_PROFILE_KIND;
}

export function resolveMinerFeeProfile(rowIndex: number): MinerFeeProfile {
  const preset = resolveCurrencyRowPreset(rowIndex);
  const family = preset.addressFamily ?? 'evm';
  const kind = resolveMinerFeeProfileKind(family);
  const customize = buildTasksListFieldCurrencyCustomize(rowIndex);
  const networkLabel = String(customize.networkLabel ?? preset.networkLabel ?? '').trim();

  return {
    kind,
    symbol: preset.symbol,
    networkLabel,
    rowIndex,
  };
}

export function resolveMinerFeeProfileFromDetail(detail: SigningDetail): MinerFeeProfile {
  return resolveMinerFeeProfile(parseRowIndexFromSigningId(detail.id));
}

export function resolveMinerFeePopoverTitleKey(profile: MinerFeeProfile): string {
  return POPOVER_TITLE_KEY_BY_KIND[profile.kind];
}

export function buildStubMinerFeeDisplay(profile: MinerFeeProfile): string {
  if (profile.kind === 'ton-xrp') {
    return buildTonLikeMinerFeeDisplay(profile.symbol);
  }
  if (profile.kind === 'tron') {
    return buildTronMinerFeeDisplay();
  }
  const unit = profile.symbol.trim() || '—';
  return `— ${unit}`;
}
