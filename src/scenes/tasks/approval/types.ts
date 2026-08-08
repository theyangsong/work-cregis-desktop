export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ApprovalListRow = {
  id: number;
  approvalId: string;
};

export type ApprovalAddressEntry = {
  alias: string;
  address: string;
  tags: string[];
  amount?: string;
  purpose?: string;
  memo?: string;
};

export type ApprovalProgressMember = {
  name: string;
  emailMasked: string;
  avatarName: string;
};

export type ApprovalDetail = {
  id: string;
  status: ApprovalStatus;
  version: number;
  amountDisplay: string;
  /** EgDetail eyebrow — 与列表 Amount 列主表头一致（i18n key）。 */
  amountColumnLabel: string;
  /** EgDetail headline — 与列表该行 Amount 主行数值一致。 */
  amountHeadline: string;
  businessType: string;
  expiryDisplay: string | null;
  appliedAtDisplay: string;
  payoutWallet: string;
  senderSummary: string;
  senderCount: number;
  senders: ApprovalAddressEntry[];
  receiverSummary: string;
  receiverCount: number;
  receivers: ApprovalAddressEntry[];
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
    members: ApprovalProgressMember[];
  }[];
  signingMode: 'single' | 'multi';
  signingThreshold: string | null;
  signers: ApprovalProgressMember[];
};

export type ApprovalActionKind = 'pass' | 'reject';

export type ApprovalSubmitPayload = {
  action: ApprovalActionKind;
  remark: string;
  password: string;
};

export type ApprovalBatchPayload = ApprovalSubmitPayload & {
  ids: string[];
};
