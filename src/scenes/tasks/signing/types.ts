import type { CryptoAddressSideTags } from '@eds/desktop-components';

export type SigningStatus = 'pending' | 'signed' | 'rejected';

export type SigningAddressEntry = {
  alias: string;
  address: string;
  tags: string[];
  /** 与列表 EgCryptoAddress Tag 对齐（system / custom / +N）。 */
  addressTags?: CryptoAddressSideTags;
  amount?: string;
  purpose?: string;
  memo?: string;
};

import type { DetailProgressMemberDeviceInfo } from '../shared/detailProgressMemberDeviceInfo.types';

export type SigningProgressMember = {
  name: string;
  emailMasked: string;
  avatarName: string;
  atDisplay?: string;
  deviceInfo?: DetailProgressMemberDeviceInfo;
};

export type SigningDetail = {
  id: string;
  status: SigningStatus;
  version: number;
  amountDisplay: string;
  amountColumnLabel: string;
  /** EgDetail headline — 加密数量 + 币种符号。 */
  amountHeadline: string;
  amountRowValue: string;
  amountCryptoSymbol: string;
  amountCryptoName: string;
  amountNetworkLabel: string;
  businessType: string;
  expiryDisplay: string | null;
  expiryCountdownMinutes?: string;
  expiryCountdownSeconds?: string;
  appliedAtDisplay: string;
  payoutWallet: string;
  /** 出款钱包编号（QB + 年月日 + 8 位数字）。 */
  payoutWalletCode: string;
  /** 与列表 Payout Wallets 列右侧 Tag 同源（如 Single-Sign / Multi-Sign）。 */
  payoutWalletSignLabel: string;
  senderSummary: string;
  senderCount: number;
  senderOrderCount?: number;
  senders: SigningAddressEntry[];
  receiverSummary: string;
  receiverCount: number;
  receiverOrderCount?: number;
  receivers: SigningAddressEntry[];
  strategy: string;
  thirdPartyRef: string;
  memo: string;
  initiatorKind: 'member' | 'waas';
  initiatorDisplay: string;
  initiatorMember?: SigningProgressMember;
  initiatorNote: string;
  initiatorAtDisplay: string;
  approvalNodes: {
    title: string;
    statusLabel: string;
    atDisplay?: string;
    members: SigningProgressMember[];
  }[];
  signatureAtDisplay?: string;
  withdrawnAtDisplay?: string;
  /** 签名通过：链上交易状态 Tag 文案（i18n key）。 */
  transactionStatusLabel?: string;
  transactionStatusTag?: 'success' | 'warning' | 'danger' | 'ready' | 'invalid';
  /** 签名通过：链上交易哈希（Apply_Item txid 变体）。 */
  transactionHash?: string;
  signingMode: 'single' | 'multi';
  signingThreshold: string | null;
  signers: SigningProgressMember[];
  automationSignatureRule?: {
    name: string;
    id: string;
  };
};

export type SigningActionKind = 'pass' | 'reject';

export type SigningProgressPhase =
  | 'signing'
  | 'sign-failed'
  | 'broadcasting'
  | 'on-chain-confirming'
  | 'broadcast-success'
  | 'broadcast-failed';

export type MultiSignRoomPhase = 'waiting' | 'ready' | 'signing' | 'sign-failed';

/** 多签等待室视角：签名人（发起人）可就绪签名；参与人仅等待。 */
export type MultiSignWaitingPerspective = 'signer' | 'participant';
