import type { GasFeeNetwork } from '@eds/desktop-components';
import type { MinerFeeProfile } from './minerFeeProfile';

/** 业务 MinerFeeProfile → EgGasFeePopover network（batch stub 无对应 network）。 */
export function resolveGasFeeNetworkFromProfile(
  profile: MinerFeeProfile,
): GasFeeNetwork | null {
  if (profile.kind === 'tron') {
    return 'tron';
  }
  if (profile.kind === 'ton-xrp') {
    return 'ton';
  }
  if (profile.kind === 'evm') {
    return profile.symbol.trim().toUpperCase() === 'BTC' ? 'bitcoin' : 'ethereum';
  }
  return null;
}
