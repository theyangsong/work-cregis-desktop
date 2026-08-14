import type { CryptoAddressSideTags } from '@eds/desktop-components';
import type { DetailProgressMemberDeviceInfo } from '../shared/detailProgressMemberDeviceInfo.types';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ApprovalListRow = {
  id: number;
  approvalId: string;
};

export type ApprovalAddressEntry = {
  alias: string;
  address: string;
  tags: string[];
  /** 与列表 EgCryptoAddress Tag 对齐（system / custom / +N）。 */
  addressTags?: CryptoAddressSideTags;
  amount?: string;
  purpose?: string;
  memo?: string;
};

export type ApprovalProgressMember = {
  name: string;
  emailMasked: string;
  avatarName: string;
  /** robot = eds-avatar-0 系统机器人头像。 */
  avatarVariant?: 'initials' | 'robot';
  hideEmail?: boolean;
  atDisplay?: string;
  deviceInfo?: DetailProgressMemberDeviceInfo;
  /** 成员行下方只读备注（如系统签名驳回原因）。 */
  remark?: string;
};

export type ApprovalDetail = {
  id: string;
  status: ApprovalStatus;
  version: number;
  amountDisplay: string;
  /** EgDetail eyebrow — 与列表 Amount 列主表头一致（i18n key）。 */
  amountColumnLabel: string;
  /** EgDetail headline — 加密数量 + 币种符号，如 `79.00001 TON`。 */
  amountHeadline: string;
  /** 详情金额行 — 仅数量与法币折算，如 `79.00001 ≈ $79.00001`。 */
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
  /** 多笔订单（multi-orders）；与 senderCount 多地址互斥。 */
  senderOrderCount?: number;
  senders: ApprovalAddressEntry[];
  receiverSummary: string;
  receiverCount: number;
  receiverOrderCount?: number;
  receivers: ApprovalAddressEntry[];
  strategy: string;
  thirdPartyRef: string;
  memo: string;
  initiatorKind: 'member' | 'waas';
  initiatorDisplay: string;
  initiatorMember?: ApprovalProgressMember;
  initiatorNote: string;
  initiatorAtDisplay: string;
  approvalNodes: {
    title: string;
    statusLabel: string;
    atDisplay?: string;
    members: ApprovalProgressMember[];
  }[];
  signatureAtDisplay?: string;
  withdrawnAtDisplay?: string;
  /** 已审批 + 签名通过：链上交易状态 Tag 文案（i18n key）。 */
  transactionStatusLabel?: string;
  transactionStatusTag?: 'success' | 'warning' | 'danger' | 'ready' | 'invalid';
  /** 已审批 + 签名通过：链上交易哈希（Apply_Item txid 变体）。 */
  transactionHash?: string;
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
