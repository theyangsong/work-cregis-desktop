import type { CryptoAddressSideTags } from '@eds/desktop-components';

export type MultiSignInvitationStatus = 'pending' | 'expired' | 'cancelled';

export type MultiSignInvitationAddress = {
  walletName?: string;
  /** 地址别名（EgTag solid-brand）；与 walletName 钱包名不同。 */
  alias?: string;
  address: string;
  tags: string[];
  addressTags?: CryptoAddressSideTags;
};

export type MultiSignInvitation = {
  id: string;
  status: MultiSignInvitationStatus;
  inviterName: string;
  inviterEmailMasked: string;
  invitedAtDisplay: string;
  amountDisplay: string;
  amountSymbol: string;
  networkLabel: string;
  taskAvatarColorIndex?: number;
  sender: MultiSignInvitationAddress;
  receiver: MultiSignInvitationAddress;
};

export type MultiSignInvitationJoinResult = 'joined' | 'expired' | 'shard-missing';
