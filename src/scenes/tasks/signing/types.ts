export type SigningStatus = 'pending' | 'signed' | 'rejected';

export type SigningAddressEntry = {
  alias: string;
  address: string;
  tags: string[];
  amount?: string;
  purpose?: string;
  memo?: string;
};

export type SigningProgressMember = {
  name: string;
  emailMasked: string;
  avatarName: string;
};

export type SigningDetail = {
  id: string;
  status: SigningStatus;
  version: number;
  amountDisplay: string;
  amountColumnLabel: string;
  amountHeadline: string;
  businessType: string;
  expiryDisplay: string | null;
  appliedAtDisplay: string;
  payoutWallet: string;
  senderSummary: string;
  senderCount: number;
  senders: SigningAddressEntry[];
  receiverSummary: string;
  receiverCount: number;
  receivers: SigningAddressEntry[];
  strategy: string;
  thirdPartyRef: string;
  memo: string;
  initiatorKind: 'member' | 'waas';
  initiatorDisplay: string;
  initiatorNote: string;
  initiatorAtDisplay: string;
  approvalNodes: {
    title: string;
    statusLabel: string;
    members: SigningProgressMember[];
  }[];
  signingMode: 'single' | 'multi';
  signingThreshold: string | null;
  signers: SigningProgressMember[];
};

export type SigningActionKind = 'pass' | 'reject';

export type SigningProgressPhase =
  | 'signing'
  | 'sign-failed'
  | 'broadcasting'
  | 'on-chain-confirming'
  | 'broadcast-success'
  | 'broadcast-failed';

export type MultiSignRoomPhase = 'waiting' | 'ready';
