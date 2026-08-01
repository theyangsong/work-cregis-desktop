import type { ApprovalProgressMember } from '../approval/types';
import type { TagStatus } from '@eds/desktop-components';

export type DetailApprovalProgressStep = {
  key: string;
  title: string;
  atDisplay: string;
  completed: boolean;
  statusLabel?: string;
  statusTag?: TagStatus;
  members: ApprovalProgressMember[];
  subtitle?: string;
  /** true：subtitle 为 catalog key，展示为 (翻译)。 */
  subtitleWrapParens?: boolean;
  memberPresentation?: 'acted-rows' | 'pending-inline';
  /** 时间线圆点色；默认已完成用 brand，danger 用于撤回节点。 */
  markerTone?: 'brand' | 'danger';
};

export type DetailApprovalProgressInput = {
  appliedAtDisplay: string;
  initiatorKind: 'member' | 'waas';
  initiatorDisplay: string;
  initiatorAtDisplay: string;
  initiatorMember?: ApprovalProgressMember;
  approvalNodes: Array<{
    title: string;
    subtitle?: string;
    statusLabel: string;
    atDisplay?: string;
    members: ApprovalProgressMember[];
  }>;
  signingThreshold: string | null;
  signingMode: 'single' | 'multi';
  signers: ApprovalProgressMember[];
  signatureAtDisplay?: string;
  withdrawnAtDisplay?: string;
};
