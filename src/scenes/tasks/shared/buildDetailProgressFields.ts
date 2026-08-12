import type { ApprovalProgressMember } from '../approval/types';
import { buildTransferTypeRowValues } from '../list-field/tasksListFieldBusinessTypeRowData';
import { buildStatusRowValues, buildApprovedModuleDetailStatusRowValues, SYSTEM_SIGNATURE_REJECT_ROW_INDEX, WITHDRAWN_DEMO_ROW_INDEX } from '../list-field/tasksListFieldStatusRowData';
import {
  attachSigningMeta,
  resolvePassedSignersForRow,
  resolvePendingSignersForRow,
  type SignerSeeds,
} from './resolveSigningRowFields';
import { buildDetailTransactionOutcomeFields } from './buildDetailTransactionOutcomeItems';
import {
  isWaasPayoutTransferType,
  resolveWaasProjectNameForRow,
} from './waasProjectNames';

export type DetailProgressScenario =
  | 'approval-workflow'
  | 'signing-workflow'
  | 'record';

type ProgressMemberSeed = ApprovalProgressMember;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  const tail = local.slice(-1);
  return `${visible}******${tail}@${domain}`;
}

function formatUtcTimestamp(date: Date, offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = String(Math.abs(offsetHours)).padStart(2, '0');
  const pad = (n: number) => String(n).padStart(2, '0');
  return `UTC${sign}${abs}:00 ${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function member(
  name: string,
  email: string,
  avatarName = name,
  options: {
    atDisplay?: string;
    deviceInfo?: ApprovalProgressMember['deviceInfo'];
  } = {},
): ProgressMemberSeed {
  const acted = Boolean(options.atDisplay);
  return {
    name,
    emailMasked: maskEmail(email),
    avatarName,
    atDisplay: options.atDisplay,
    deviceInfo: acted ? options.deviceInfo : undefined,
  };
}

const defaultDeviceInfo = {
  deviceType: 'MacOS(v3.6.0)',
  deviceId: 'AXSMJSAXJQ',
  ip: '192.168.2.1',
};

function buildBaseMembers() {
  const appliedAt = new Date(Date.UTC(2027, 11, 23, 2, 23, 0));
  const initiator = member('Alex Mah.', 't******g@gmail.com', 'Alex Mah', {
    atDisplay: '2027-12-23 02:23:00',
    deviceInfo: defaultDeviceInfo,
  });
  const emily = member('Emily Stone', 'e******e@gmail.com', 'Emily Stone', {
    atDisplay: '2027-12-23 10:25:00',
    deviceInfo: defaultDeviceInfo,
  });
  const frank = member('Frank', 'f******k@gmail.com');
  const ethan = member('Ethan Chen', 'e******n@gmail.com', 'Ethan Chen');
  const jordan = member('Jordan', 'j******n@gmail.com', 'Jordan');
  const taylor = member('Taylor Lee', 't******e@gmail.com', 'Taylor Lee');

  return {
    appliedAt,
    initiator,
    emily,
    frank,
    ethan,
    jordan,
    taylor,
    signerSeeds: { ethan, jordan, taylor } satisfies SignerSeeds,
    initiatorAtDisplay: formatUtcTimestamp(appliedAt, 8),
  };
}

function buildApacNode(
  initiator: ProgressMemberSeed,
  emily: ProgressMemberSeed,
  frank: ProgressMemberSeed,
) {
  return {
    title: 'Approval (APAC Business Group)',
    statusLabel: 'Approval Passed',
    atDisplay: '2027-12-23 10:23:00',
    members: [
      { ...initiator, atDisplay: '2027-12-23 10:23:00', deviceInfo: defaultDeviceInfo },
      member('Emily Stone', 'e******e@gmail.com', 'Emily Stone'),
      member('Frank', 'f******k@gmail.com'),
      member('Sophia Smith', 's******h@gmail.com', 'Cooper'),
    ],
  };
}

function buildFinanceNodePending(emily: ProgressMemberSeed) {
  return {
    title: 'Approval (Finance Department)',
    statusLabel: 'Pending Approval',
    members: [emily],
  };
}

function buildFinanceNodePassed(emily: ProgressMemberSeed) {
  return {
    title: 'Approval (Finance Department)',
    statusLabel: 'Approval Passed',
    atDisplay: '2027-12-23 10:25:00',
    members: [emily],
  };
}

function buildFinanceNodeRejected(emily: ProgressMemberSeed, frank: ProgressMemberSeed) {
  return {
    title: 'Approval (Finance Department)',
    statusLabel: 'Approval Reject',
    atDisplay: '2027-12-23 10:25:00',
    members: [{ ...emily, atDisplay: '2027-12-23 10:25:00', deviceInfo: defaultDeviceInfo }, frank],
  };
}

function buildSystemSignatureRejectSigner(atDisplay: string): ApprovalProgressMember {
  return {
    name: 'Cregis Robot',
    emailMasked: '',
    avatarName: 'Cregis Robot',
    avatarVariant: 'robot',
    hideEmail: true,
    atDisplay,
    remark: "No No No, You're not as rich as I am.",
  };
}

function buildUserSignatureRejectSigner(
  ethan: ProgressMemberSeed,
  atDisplay: string,
): ApprovalProgressMember {
  return {
    ...ethan,
    atDisplay,
    deviceInfo: defaultDeviceInfo,
  };
}

function resolveSignatureRejectSigners(
  rowIndex: number,
  ethan: ProgressMemberSeed,
  atDisplay = '2027-12-23 10:28:40',
): ApprovalProgressMember[] {
  if (rowIndex === SYSTEM_SIGNATURE_REJECT_ROW_INDEX) {
    return [buildSystemSignatureRejectSigner(atDisplay)];
  }
  return [buildUserSignatureRejectSigner(ethan, atDisplay)];
}

function resolveInitiatorContext(rowIndex: number) {
  const transferType = buildTransferTypeRowValues(rowIndex);
  const isWaasPayout =
    rowIndex === WITHDRAWN_DEMO_ROW_INDEX
    || isWaasPayoutTransferType(transferType.value);
  const waasProjectName = resolveWaasProjectNameForRow(rowIndex);
  return { isWaasPayout, waasProjectName };
}

function buildApprovalWorkflowFields(rowIndex: number, initiatorNote: string) {
  const { initiator, emily, frank, signerSeeds, initiatorAtDisplay } = buildBaseMembers();
  const { isWaasPayout, waasProjectName } = resolveInitiatorContext(rowIndex);

  return attachSigningMeta(rowIndex, {
    strategy: 'High Value Guard · #POL-0192',
    thirdPartyRef: `TP-20271223-${String(rowIndex + 1).padStart(3, '0')}`,
    memo: 'Monthly vendor settlement',
    initiatorKind: isWaasPayout ? ('waas' as const) : ('member' as const),
    initiatorMember: initiator,
    initiatorDisplay: isWaasPayout
      ? `${waasProjectName} · IP 203.0.113.10`
      : `${initiator.name} ${initiator.emailMasked} · MacBook · DEV-019 · IP 198.51.100.8`,
    initiatorNote,
    initiatorAtDisplay,
    approvalNodes: [buildApacNode(initiator, emily, frank), buildFinanceNodePending(emily)],
    signatureAtDisplay: undefined,
    signers: resolvePendingSignersForRow(rowIndex, signerSeeds),
  });
}

function buildSigningWorkflowFields(rowIndex: number, initiatorNote: string) {
  const { initiator, emily, frank, signerSeeds, initiatorAtDisplay } = buildBaseMembers();
  const { isWaasPayout, waasProjectName } = resolveInitiatorContext(rowIndex);

  return attachSigningMeta(rowIndex, {
    strategy: 'High Value Guard · #POL-0192',
    thirdPartyRef: `TP-20271223-${String(rowIndex + 1).padStart(3, '0')}`,
    memo: 'Monthly vendor settlement',
    initiatorKind: isWaasPayout ? ('waas' as const) : ('member' as const),
    initiatorMember: initiator,
    initiatorDisplay: isWaasPayout
      ? `${waasProjectName} · IP 203.0.113.10`
      : `${initiator.name} ${initiator.emailMasked} · MacBook · DEV-019 · IP 198.51.100.8`,
    initiatorNote,
    initiatorAtDisplay,
    approvalNodes: [buildApacNode(initiator, emily, frank), buildFinanceNodePassed(emily)],
    signatureAtDisplay: undefined,
    signers: resolvePendingSignersForRow(rowIndex, signerSeeds),
  });
}

function buildRecordFields(
  rowIndex: number,
  initiatorNote: string,
  menuItem?: string,
) {
  const { initiator, emily, frank, signerSeeds, initiatorAtDisplay } = buildBaseMembers();
  const { isWaasPayout, waasProjectName } = resolveInitiatorContext(rowIndex);
  const listStatus =
    menuItem === 'Approved'
      ? buildApprovedModuleDetailStatusRowValues(rowIndex)
      : buildStatusRowValues(rowIndex, menuItem);
  const apacNode = buildApacNode(initiator, emily, frank);
  const pendingSigners = resolvePendingSignersForRow(rowIndex, signerSeeds);
  const passedSigners = resolvePassedSignersForRow(rowIndex, signerSeeds);

  function withTransactionOutcome<T extends Record<string, unknown>>(payload: T): T {
    if (listStatus.label !== 'Signature Passed') return payload;
    if (
      menuItem !== 'Approved'
      && menuItem !== 'Signed'
      && menuItem !== 'All Records'
      && menuItem !== 'Sent Request'
    ) {
      return payload;
    }
    return {
      ...payload,
      ...buildDetailTransactionOutcomeFields(rowIndex),
    };
  }

  const base = {
    strategy: 'High Value Guard · #POL-0192',
    thirdPartyRef: `TP-20271223-${String(rowIndex + 1).padStart(3, '0')}`,
    memo: 'Monthly vendor settlement',
    initiatorKind: isWaasPayout ? ('waas' as const) : ('member' as const),
    initiatorMember: initiator,
    initiatorDisplay: isWaasPayout
      ? `${waasProjectName} · IP 203.0.113.10`
      : `${initiator.name} ${initiator.emailMasked} · MacBook · DEV-019 · IP 198.51.100.8`,
    initiatorNote,
    initiatorAtDisplay,
  };

  if (menuItem === 'Signed') {
    if (listStatus.label === 'Signature Reject') {
      return attachSigningMeta(rowIndex, {
        ...base,
        approvalNodes: [apacNode, buildFinanceNodePassed(emily)],
        signatureAtDisplay: '2027-12-23 10:28:40',
        signers: resolveSignatureRejectSigners(rowIndex, signerSeeds.ethan),
      });
    }
    return attachSigningMeta(
      rowIndex,
      withTransactionOutcome({
        ...base,
        approvalNodes: [apacNode, buildFinanceNodePassed(emily)],
        signatureAtDisplay: '2027-12-23 10:28:40',
        signers: passedSigners,
      }),
    );
  }

  if (listStatus.label === 'Pending Approval' || listStatus.label === 'Approving') {
    return attachSigningMeta(rowIndex, {
      ...base,
      approvalNodes: [apacNode, buildFinanceNodePending(emily)],
      signatureAtDisplay: undefined,
      signers: pendingSigners,
    });
  }

  if (listStatus.label === 'Approval Reject') {
    return attachSigningMeta(rowIndex, {
      ...base,
      approvalNodes: [apacNode, buildFinanceNodeRejected(emily, frank)],
      signatureAtDisplay: undefined,
      signers: [],
    });
  }

  if (listStatus.label === 'Approval Passed') {
    return attachSigningMeta(rowIndex, {
      ...base,
      approvalNodes: [apacNode, buildFinanceNodePassed(emily)],
      signatureAtDisplay: undefined,
      signers: pendingSigners,
    });
  }

  if (listStatus.label === 'Waiting for signature') {
    return attachSigningMeta(rowIndex, {
      ...base,
      approvalNodes: [apacNode, buildFinanceNodePassed(emily)],
      signatureAtDisplay: undefined,
      signers: pendingSigners,
    });
  }

  if (listStatus.label === 'Signature Reject') {
    return attachSigningMeta(rowIndex, {
      ...base,
      approvalNodes: [apacNode, buildFinanceNodePassed(emily)],
      signatureAtDisplay: '2027-12-23 10:28:40',
      signers: resolveSignatureRejectSigners(rowIndex, signerSeeds.ethan),
    });
  }

  if (listStatus.label === 'Withdrawn') {
    return attachSigningMeta(rowIndex, {
      ...base,
      approvalNodes: [apacNode, buildFinanceNodePassed(emily)],
      signatureAtDisplay: undefined,
      signers: [],
      withdrawnAtDisplay: '2027-12-23 10:30:00',
    });
  }

  if (listStatus.label === 'Signature Passed') {
    return attachSigningMeta(
      rowIndex,
      withTransactionOutcome({
        ...base,
        approvalNodes: [apacNode, buildFinanceNodePassed(emily)],
        signatureAtDisplay: '2027-12-23 10:28:40',
        signers: passedSigners,
      }),
    );
  }

  return attachSigningMeta(
    rowIndex,
    withTransactionOutcome({
      ...base,
      approvalNodes: [apacNode, buildFinanceNodePassed(emily)],
      signatureAtDisplay: '2027-12-23 10:28:40',
      signers: passedSigners,
    }),
  );
}

export function buildDetailProgressFields(
  rowIndex: number,
  options: {
    initiatorNote: string;
    scenario: DetailProgressScenario;
    menuItem?: string;
  },
) {
  if (options.scenario === 'signing-workflow') {
    return buildSigningWorkflowFields(rowIndex, options.initiatorNote);
  }
  if (options.scenario === 'record') {
    return buildRecordFields(rowIndex, options.initiatorNote, options.menuItem);
  }
  return buildApprovalWorkflowFields(rowIndex, options.initiatorNote);
}
