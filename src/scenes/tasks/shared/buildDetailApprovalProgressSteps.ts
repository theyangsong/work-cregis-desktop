import type { ApprovalProgressMember } from '../approval/types';
import type {
  DetailApprovalProgressInput,
  DetailApprovalProgressStep,
  DetailAutomationSignatureRule,
} from './detailApprovalProgress.types';
import { parseSigningThreshold } from '../signing/multiSignWaiting.constants';
import {
  formatProgressAtDisplay,
  isProgressStepCompleted,
  progressStatusLabelKey,
  resolveProgressStatusTag,
} from './detailApprovalProgressDisplay';

const FIRST_APPROVAL_NODE_PASSED_MEMBER_REMARK =
  "I'm Elon Musk, and I have a lot of money. Yes, I'm not interested in money.";

function parseWaasInitiatorDisplay(display: string): { name: string; ipLabel: string } {
  const match = /^(.+?) · IP (.+)$/.exec(display.trim());
  if (!match) {
    return { name: display.trim(), ipLabel: '' };
  }
  return { name: match[1]!.trim(), ipLabel: `IP ${match[2]!.trim()}` };
}

function buildWaasInitiatorMember(
  initiatorDisplay: string,
  atDisplay?: string,
  initiatorMember?: ApprovalProgressMember,
): ApprovalProgressMember {
  const { name, ipLabel } = parseWaasInitiatorDisplay(initiatorDisplay);
  const ip = ipLabel.replace(/^IP\s+/i, '').trim() || '203.0.113.10';
  return {
    name,
    emailMasked: initiatorMember?.emailMasked ?? '',
    avatarName: name,
    atDisplay,
    deviceInfo: {
      deviceType: 'MacOS(v3.6.0)',
      deviceId: 'AXSMJSAXJQ',
      ip,
    },
  };
}

function resolveInitiatorStepMembers(
  detail: DetailApprovalProgressInput,
  atDisplay: string,
): ApprovalProgressMember[] {
  if (detail.initiatorKind === 'waas') {
    return [
      buildWaasInitiatorMember(
        detail.initiatorDisplay,
        atDisplay,
        detail.initiatorMember,
      ),
    ];
  }
  if (detail.initiatorMember) {
    return membersWithActedDeviceInfo([detail.initiatorMember]);
  }
  return [];
}

function withFirstApprovalNodePassedRemarks(
  nodeIndex: number,
  statusLabel: string,
  members: ApprovalProgressMember[],
): ApprovalProgressMember[] {
  if (nodeIndex !== 0 || statusLabel !== 'Approval Passed') return members;
  return members.map((member) => ({
    ...member,
    remark: FIRST_APPROVAL_NODE_PASSED_MEMBER_REMARK,
  }));
}

export type BuildDetailApprovalProgressOptions = {
  thresholdSubtitle?: string;
  /** workflow = 待办详情；record = 已办/记录类详情。 */
  viewMode?: 'workflow' | 'record';
  /** 记录类详情：与列表 Status 列对齐。 */
  listStatusLabel?: string;
  /**
   * 待审批详情：上游审批节点 1 在 Tag 为待审批时，展示多人或签 inline（/ 分隔）。
   * 仅 Approval 待办详情传入；签名/记录详情勿开。
   */
  applyFirstApprovalNodePendingDemo?: boolean;
};

/** 仅已审批/签名的成员保留 deviceInfo（有个人 atDisplay）。 */
function membersWithActedDeviceInfo(
  members: ApprovalProgressMember[],
): ApprovalProgressMember[] {
  return members.map((member) => {
    if (!member.deviceInfo || member.atDisplay) return member;
    const { deviceInfo: _deviceInfo, ...rest } = member;
    return rest;
  });
}

function stripMemberActionFields(member: ApprovalProgressMember): ApprovalProgressMember {
  const { atDisplay: _atDisplay, deviceInfo: _deviceInfo, ...rest } = member;
  return rest;
}

function resolveApprovalNodeMembers(
  node: DetailApprovalProgressInput['approvalNodes'][number],
  completed: boolean,
): {
  members: ApprovalProgressMember[];
  memberPresentation: 'acted-rows' | 'pending-inline';
} {
  if (completed) {
    return {
      members: membersWithActedDeviceInfo(
        node.members.filter((member) => Boolean(member.atDisplay)),
      ),
      memberPresentation: 'acted-rows',
    };
  }

  return {
    members: node.members.map(stripMemberActionFields),
    memberPresentation: 'acted-rows',
  };
}

/** 审批节点 1（APAC）：待审批时多人或签，姓名 / 分隔单行展示。 */
function resolveFirstApprovalNodePendingInlineMembers(
  node: DetailApprovalProgressInput['approvalNodes'][number],
): ApprovalProgressMember[] {
  return node.members.map(stripMemberActionFields);
}

function applyFirstApprovalNodePendingInlineIfNeeded(
  step: DetailApprovalProgressStep,
  node: DetailApprovalProgressInput['approvalNodes'][number],
  nodeIndex: number,
  statusLabel: string,
): boolean {
  if (nodeIndex !== 0) return false;
  if (!isInFlightApprovalStatus(statusLabel)) return false;

  step.members = resolveFirstApprovalNodePendingInlineMembers(node);
  step.memberPresentation = 'pending-inline';
  return true;
}

function normalizeFirstApprovalNodePendingInline(
  steps: DetailApprovalProgressStep[],
  detail: DetailApprovalProgressInput,
): void {
  const step = steps.find((item) => item.key === 'approval-0');
  const node = detail.approvalNodes[0];
  if (!step || !node) return;
  if (step.statusLabel !== progressStatusLabelKey('Pending Approval')) return;

  step.members = resolveFirstApprovalNodePendingInlineMembers(node);
  step.memberPresentation = 'pending-inline';
}

function resolveRecordSignatureMembers(
  detail: DetailApprovalProgressInput,
  signers: ApprovalProgressMember[],
): ApprovalProgressMember[] {
  const maxSigners =
    detail.signingMode === 'multi'
      ? parseSigningThreshold(detail.signingThreshold).required
      : 1;
  const acted = signers.filter((member) => Boolean(member.atDisplay));
  if (acted.length > 0) {
    return membersWithActedDeviceInfo(acted.slice(0, maxSigners));
  }

  const atDisplay = detail.signatureAtDisplay ?? detail.appliedAtDisplay;

  return membersWithActedDeviceInfo(
    signers.slice(0, Math.max(1, maxSigners)).map((member) => ({
      ...member,
      atDisplay,
    })),
  );
}

/** 签名驳回：任一成员驳回即终止流程，仅展示驳回人。 */
function resolveSignatureRejectMembers(
  detail: DetailApprovalProgressInput,
  signers: ApprovalProgressMember[],
): ApprovalProgressMember[] {
  const acted = signers.filter((member) => Boolean(member.atDisplay));
  if (acted.length > 0) {
    return membersWithActedDeviceInfo(acted.slice(0, 1));
  }

  const first = signers[0];
  if (!first) return [];

  const atDisplay = detail.signatureAtDisplay ?? detail.appliedAtDisplay;
  return membersWithActedDeviceInfo([{ ...first, atDisplay }]);
}

function isApprovalChainComplete(detail: DetailApprovalProgressInput): boolean {
  return detail.approvalNodes.every((node) => {
    const label = node.statusLabel.trim();
    return label === 'Approval Passed' || label === 'Approval Reject';
  });
}

function hasApprovalReject(detail: DetailApprovalProgressInput): boolean {
  return detail.approvalNodes.some(
    (node) => node.statusLabel.trim() === 'Approval Reject',
  );
}

function shouldShowSignatureStep(
  detail: DetailApprovalProgressInput,
  listStatusLabel?: string,
): boolean {
  if (listStatusLabel === 'Approval Reject' || listStatusLabel === 'Withdrawn') return false;
  return !hasApprovalReject(detail);
}

function buildWithdrawnStep(
  detail: DetailApprovalProgressInput,
): DetailApprovalProgressStep {
  const atDisplay = formatProgressAtDisplay(
    detail.withdrawnAtDisplay ?? detail.appliedAtDisplay,
    detail.appliedAtDisplay,
  );

  if (detail.initiatorKind === 'waas') {
    return {
      key: 'withdrawn',
      title: 'Withdraw',
      atDisplay,
      completed: true,
      members: [
        buildWaasInitiatorMember(
          detail.initiatorDisplay,
          atDisplay,
          detail.initiatorMember,
        ),
      ],
      memberPresentation: 'acted-rows',
      markerTone: 'danger',
    };
  }

  const initiator = detail.initiatorMember;
  return {
    key: 'withdrawn',
    title: 'Withdraw',
    atDisplay,
    completed: true,
    members: initiator
      ? membersWithActedDeviceInfo([{ ...initiator, atDisplay }])
      : [],
    memberPresentation: 'acted-rows',
    markerTone: 'danger',
  };
}

function resolveSignatureStep(
  detail: DetailApprovalProgressInput,
  signers: ApprovalProgressMember[],
  viewMode: 'workflow' | 'record',
): {
  members: ApprovalProgressMember[];
  memberPresentation: 'acted-rows' | 'pending-inline';
  statusLabel?: string;
  statusTag?: ReturnType<typeof resolveProgressStatusTag>;
  completed: boolean;
} {
  const approvalsComplete = isApprovalChainComplete(detail);
  const completed =
    approvalsComplete
    && (Boolean(detail.signatureAtDisplay)
      || signers.some((member) => Boolean(member.atDisplay)));

  if (viewMode === 'workflow') {
    return {
      members: [],
      memberPresentation: 'acted-rows',
      completed: false,
    };
  }

  if (!completed) {
    return {
      members: [],
      memberPresentation: 'acted-rows',
      statusLabel: 'Pending Signature',
      statusTag: 'ready',
      completed: false,
    };
  }

  return {
    members: resolveRecordSignatureMembers(detail, signers),
    memberPresentation: 'acted-rows',
    statusLabel: 'Signature Passed',
    statusTag: 'success',
    completed: true,
  };
}

function findFirstInFlightApprovalIndex(detail: DetailApprovalProgressInput): number {
  return detail.approvalNodes.findIndex((node) => {
    const label = node.statusLabel.trim();
    return label === 'Pending Approval' || label === 'approving';
  });
}

function isInFlightApprovalStatus(statusLabel: string): boolean {
  const label = statusLabel.trim();
  return label === 'Pending Approval' || label === 'approving';
}

function setApprovalStepPresentation(
  step: DetailApprovalProgressStep,
  node: DetailApprovalProgressInput['approvalNodes'][number],
  statusLabel: string,
  nodeIndex: number,
): void {
  const completed = isProgressStepCompleted(statusLabel) || statusLabel === 'Approval Reject';

  step.statusLabel = progressStatusLabelKey(statusLabel);
  step.statusTag = resolveProgressStatusTag(statusLabel);
  step.completed = completed;

  if (applyFirstApprovalNodePendingInlineIfNeeded(step, node, nodeIndex, statusLabel)) {
    return;
  }

  const { members, memberPresentation } = resolveApprovalNodeMembers(
    node,
    isProgressStepCompleted(statusLabel),
  );
  step.members = withFirstApprovalNodePassedRemarks(nodeIndex, statusLabel, members);
  step.memberPresentation = memberPresentation;
}

function clearSignatureStep(step: DetailApprovalProgressStep): void {
  step.statusLabel = undefined;
  step.statusTag = undefined;
  step.completed = false;
  step.members = [];
  step.memberPresentation = 'acted-rows';
  step.automationSignatureRule = undefined;
}

function resolveAutomationSignatureRuleForStep(
  detail: DetailApprovalProgressInput,
  completed: boolean,
): DetailAutomationSignatureRule | undefined {
  if (!completed || detail.signingMode !== 'single') return undefined;
  return detail.automationSignatureRule;
}

function applyAutomationSignatureRule(
  step: DetailApprovalProgressStep,
  detail: DetailApprovalProgressInput,
): void {
  // 自动签名标识（Tag + 规则名）仅单签且签名完成后展示；多签不支持。
  step.automationSignatureRule = resolveAutomationSignatureRuleForStep(
    detail,
    step.completed,
  );
}

function setSignatureStepPresentation(
  step: DetailApprovalProgressStep,
  detail: DetailApprovalProgressInput,
  options: {
    statusLabel?: string;
    completed: boolean;
    members?: ApprovalProgressMember[];
  },
): void {
  step.statusLabel = options.statusLabel
    ? progressStatusLabelKey(options.statusLabel)
    : undefined;
  step.statusTag = options.statusLabel
    ? resolveProgressStatusTag(options.statusLabel)
    : undefined;
  step.completed = options.completed;
  step.members = options.members ?? [];
  step.memberPresentation = 'acted-rows';
  applyAutomationSignatureRule(step, detail);
}

function applyAllApprovalNodesPassed(
  steps: DetailApprovalProgressStep[],
  detail: DetailApprovalProgressInput,
): void {
  for (let index = 0; index < detail.approvalNodes.length; index += 1) {
    const node = detail.approvalNodes[index];
    const step = steps.find((item) => item.key === `approval-${index}`);
    if (!node || !step) continue;
    setApprovalStepPresentation(step, node, 'Approval Passed', index);
  }
}

function applyRecordListStatusPresentation(
  steps: DetailApprovalProgressStep[],
  detail: DetailApprovalProgressInput,
  listStatusLabel?: string,
): void {
  if (!listStatusLabel) return;

  const signatureStep = steps.find((step) => step.key === 'signature');

  if (listStatusLabel === 'Approval Passed') {
    applyAllApprovalNodesPassed(steps, detail);
    if (signatureStep) clearSignatureStep(signatureStep);
    return;
  }

  if (listStatusLabel === 'Approval Reject') {
    for (let index = 0; index < detail.approvalNodes.length; index += 1) {
      const node = detail.approvalNodes[index];
      const step = steps.find((item) => item.key === `approval-${index}`);
      if (!node || !step) continue;
      const isRejectNode = node.statusLabel.trim() === 'Approval Reject';
      setApprovalStepPresentation(
        step,
        node,
        isRejectNode ? 'Approval Reject' : 'Approval Passed',
        index,
      );
    }
    if (signatureStep) clearSignatureStep(signatureStep);
    return;
  }

  if (listStatusLabel === 'Pending Approval' || listStatusLabel === 'approving') {
    for (let index = 0; index < detail.approvalNodes.length; index += 1) {
      const node = detail.approvalNodes[index];
      const step = steps.find((item) => item.key === `approval-${index}`);
      if (!node || !step) continue;
      const isPendingNode = isInFlightApprovalStatus(node.statusLabel);
      setApprovalStepPresentation(
        step,
        node,
        isPendingNode ? 'Pending Approval' : 'Approval Passed',
        index,
      );
    }
    if (signatureStep) clearSignatureStep(signatureStep);
    return;
  }

  if (listStatusLabel === 'Waiting for signature') {
    applyAllApprovalNodesPassed(steps, detail);
    if (signatureStep) {
      signatureStep.subtitle = undefined;
      setSignatureStepPresentation(signatureStep, detail, {
        statusLabel: 'Waiting for signature',
        completed: false,
        members: [],
      });
    }
    return;
  }

  if (listStatusLabel === 'Signature Passed') {
    applyAllApprovalNodesPassed(steps, detail);
    if (signatureStep) {
      setSignatureStepPresentation(signatureStep, detail, {
        statusLabel: 'Signature Passed',
        completed: true,
        members: resolveRecordSignatureMembers(detail, detail.signers),
      });
    }
    return;
  }

  if (listStatusLabel === 'Signature Reject') {
    applyAllApprovalNodesPassed(steps, detail);
    if (signatureStep) {
      setSignatureStepPresentation(signatureStep, detail, {
        statusLabel: 'Signature Reject',
        completed: true,
        members: resolveSignatureRejectMembers(detail, detail.signers),
      });
    }
    return;
  }

  if (listStatusLabel === 'Withdrawn') {
    applyAllApprovalNodesPassed(steps, detail);
    steps.push(buildWithdrawnStep(detail));
    return;
  }
}

function applyWorkflowProgressPresentation(
  steps: DetailApprovalProgressStep[],
  detail: DetailApprovalProgressInput,
  options: BuildDetailApprovalProgressOptions,
): void {
  const inFlightApprovalIndex = findFirstInFlightApprovalIndex(detail);
  const pendingOnUpstreamDemo = options.applyFirstApprovalNodePendingDemo === true;

  if (inFlightApprovalIndex >= 0) {
    if (pendingOnUpstreamDemo) {
      for (let index = 0; index < inFlightApprovalIndex; index += 1) {
        const node = detail.approvalNodes[index];
        const step = steps.find((item) => item.key === `approval-${index}`);
        if (!node || !step) continue;
        const nodePassed = isProgressStepCompleted(node.statusLabel.trim());
        step.statusLabel = progressStatusLabelKey('Pending Approval');
        step.statusTag = resolveProgressStatusTag('Pending Approval');
        step.completed = nodePassed;
        if (
          !applyFirstApprovalNodePendingInlineIfNeeded(
            step,
            node,
            index,
            'Pending Approval',
          )
        ) {
          const { members, memberPresentation } = resolveApprovalNodeMembers(node, nodePassed);
          step.members = members;
          step.memberPresentation = memberPresentation;
        }
      }

      const inFlightNode = detail.approvalNodes[inFlightApprovalIndex];
      const inFlightStep = steps.find(
        (item) => item.key === `approval-${inFlightApprovalIndex}`,
      );
      if (inFlightNode && inFlightStep) {
        if (inFlightApprovalIndex === 0) {
          setApprovalStepPresentation(
            inFlightStep,
            inFlightNode,
            'Pending Approval',
            inFlightApprovalIndex,
          );
        } else {
          inFlightStep.statusLabel = undefined;
          inFlightStep.statusTag = undefined;
          inFlightStep.completed = false;
          const { members, memberPresentation } = resolveApprovalNodeMembers(
            inFlightNode,
            false,
          );
          inFlightStep.members = members;
          inFlightStep.memberPresentation = memberPresentation;
        }
      }
    } else {
      const inFlightNode = detail.approvalNodes[inFlightApprovalIndex];
      const inFlightStep = steps.find(
        (item) => item.key === `approval-${inFlightApprovalIndex}`,
      );
      if (inFlightNode && inFlightStep) {
        setApprovalStepPresentation(
          inFlightStep,
          inFlightNode,
          'Pending Approval',
          inFlightApprovalIndex,
        );
      }
    }

    for (
      let index = inFlightApprovalIndex + 1;
      index < detail.approvalNodes.length;
      index += 1
    ) {
      const step = steps.find((item) => item.key === `approval-${index}`);
      if (!step) continue;
      step.statusLabel = undefined;
      step.statusTag = undefined;
      step.members = [];
    }
  }

  const signatureStep = steps.find((step) => step.key === 'signature');
  if (!signatureStep) return;

  signatureStep.subtitle = undefined;

  if (hasApprovalReject(detail)) {
    clearSignatureStep(signatureStep);
    return;
  }

  if (inFlightApprovalIndex >= 0 || !isApprovalChainComplete(detail)) {
    clearSignatureStep(signatureStep);
    return;
  }

  if (!detail.signatureAtDisplay) {
    setSignatureStepPresentation(signatureStep, detail, {
      statusLabel: 'Waiting for signature',
      completed: false,
      members: [],
    });
    return;
  }

  clearSignatureStep(signatureStep);
}

export function buildDetailApprovalProgressSteps(
  detail: DetailApprovalProgressInput,
  options: BuildDetailApprovalProgressOptions = {},
): DetailApprovalProgressStep[] {
  const viewMode = options.viewMode ?? 'workflow';
  const initiatorAt = formatProgressAtDisplay(
    detail.initiatorAtDisplay,
    detail.appliedAtDisplay,
  );

  const steps: DetailApprovalProgressStep[] = [
    {
      key: 'initiated',
      title: 'Submitted Request',
      atDisplay: initiatorAt,
      completed: true,
      members: resolveInitiatorStepMembers(detail, initiatorAt),
      memberPresentation: 'acted-rows',
    },
  ];

  for (const [index, node] of detail.approvalNodes.entries()) {
    const statusLabel = node.statusLabel.trim();
    const completed = isProgressStepCompleted(statusLabel);
    const rejected = statusLabel === 'Approval Reject';
    const { members, memberPresentation } = resolveApprovalNodeMembers(node, completed);

    steps.push({
      key: `approval-${index}`,
      title: node.title,
      subtitle: node.subtitle,
      subtitleWrapParens: Boolean(node.subtitle),
      atDisplay: node.atDisplay ?? detail.appliedAtDisplay,
      completed: completed || rejected,
      statusLabel: statusLabel ? progressStatusLabelKey(statusLabel) : undefined,
      statusTag: statusLabel ? resolveProgressStatusTag(statusLabel) : undefined,
      members: withFirstApprovalNodePassedRemarks(index, statusLabel, members),
      memberPresentation,
    });
  }

  const signatureResolved = resolveSignatureStep(detail, detail.signers, viewMode);
  const signatureAt =
    detail.signatureAtDisplay ??
    detail.approvalNodes.at(-1)?.atDisplay ??
    detail.appliedAtDisplay;

  steps.push({
    key: 'signature',
    title: 'Sign',
    atDisplay: signatureAt,
    completed: signatureResolved.completed,
    statusLabel: signatureResolved.statusLabel
      ? progressStatusLabelKey(signatureResolved.statusLabel)
      : undefined,
    statusTag: signatureResolved.statusTag,
    members: signatureResolved.members,
    memberPresentation: signatureResolved.memberPresentation,
    subtitle: viewMode === 'record' ? options.thresholdSubtitle : undefined,
    automationSignatureRule: resolveAutomationSignatureRuleForStep(
      detail,
      signatureResolved.completed,
    ),
  });

  if (viewMode === 'workflow') {
    applyWorkflowProgressPresentation(steps, detail, options);
  }

  if (viewMode === 'record') {
    applyRecordListStatusPresentation(steps, detail, options.listStatusLabel);
  }

  normalizeFirstApprovalNodePendingInline(steps, detail);

  if (!shouldShowSignatureStep(detail, options.listStatusLabel)) {
    return steps.filter((step) => step.key !== 'signature');
  }

  return steps;
}
