import { MULTI_SIGN_THRESHOLD } from '../../shared/resolveSigningRowFields';
import type { SigningDetail } from '../types';
import type { MultiSignInvitation } from './types';

/** 参与人加入邀请后进入 MultiSignWaiting — 由邀请数据构造最小 SigningDetail。 */
export function buildSigningDetailFromMultiSignInvitation(
  invitation: MultiSignInvitation,
): SigningDetail {
  const amountHeadline = `${invitation.amountDisplay} ${invitation.amountSymbol}`;

  return {
    id: invitation.id,
    status: 'pending',
    version: 1,
    amountDisplay: amountHeadline,
    amountColumnLabel: invitation.amountSymbol,
    amountHeadline,
    amountRowValue: invitation.amountDisplay,
    amountCryptoSymbol: invitation.amountSymbol,
    amountCryptoName: invitation.amountSymbol,
    amountNetworkLabel: invitation.networkLabel,
    businessType: 'Wallet Payout',
    expiryDisplay: null,
    appliedAtDisplay: invitation.invitedAtDisplay,
    payoutWallet: invitation.sender.walletName ?? 'Treasury',
    payoutWalletCode: 'QB2026010100000001',
    payoutWalletSignLabel: 'Multi-Sign',
    senderSummary: invitation.sender.address,
    senderCount: 1,
    senders: [
      {
        alias: invitation.sender.alias ?? '',
        address: invitation.sender.address,
        tags: invitation.sender.tags,
        addressTags: invitation.sender.addressTags,
      },
    ],
    receiverSummary: invitation.receiver.address,
    receiverCount: 1,
    receivers: [
      {
        alias: invitation.receiver.alias ?? '',
        address: invitation.receiver.address,
        tags: invitation.receiver.tags,
        addressTags: invitation.receiver.addressTags,
      },
    ],
    strategy: 'Multi-sign',
    thirdPartyRef: '',
    memo: '',
    initiatorKind: 'member',
    initiatorDisplay: `${invitation.inviterName} · ${invitation.inviterEmailMasked}`,
    initiatorMember: {
      name: invitation.inviterName,
      emailMasked: invitation.inviterEmailMasked,
      avatarName: invitation.inviterName,
    },
    initiatorNote: '',
    initiatorAtDisplay: invitation.invitedAtDisplay,
    approvalNodes: [],
    signingMode: 'multi',
    signingThreshold: MULTI_SIGN_THRESHOLD,
    signers: [],
  };
}
