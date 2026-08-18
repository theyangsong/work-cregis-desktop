import type { TagStatus } from '@eds/desktop-components';
import type { TasksListFieldStatusRow } from '../list-field/tasksListFieldStatusRowData';
import type { DetailApprovalProgressStep } from './detailApprovalProgress.types';

export type DetailHeadlineStatus = {
  label: string;
  status: TagStatus;
};

const IN_FLIGHT_PROGRESS_LABELS = new Set([
  'Pending Approval',
  'Pending Signature',
  'approving',
  'Waiting for signature',
  'Pending',
]);

const TERMINAL_PROGRESS_LABELS = new Set([
  'Approval Reject',
  'Signature Reject',
  'Signature Passed',
  'Failed',
  'Withdrawn',
  'Canceled',
  'Expired',
  'Signed',
  'Success',
]);

function isProgressInFlight(steps: DetailApprovalProgressStep[]): boolean {
  return steps.some(
    (step) =>
      step.statusLabel != null && IN_FLIGHT_PROGRESS_LABELS.has(step.statusLabel),
  );
}

function findTerminalProgressStep(
  steps: DetailApprovalProgressStep[],
): DetailApprovalProgressStep | undefined {
  return steps.find(
    (step) =>
      step.statusLabel != null && TERMINAL_PROGRESS_LABELS.has(step.statusLabel),
  );
}

function isTerminalListStatus(label: string): boolean {
  return TERMINAL_PROGRESS_LABELS.has(label) || label === 'Approval Reject';
}

export function resolveDetailHeadlineStatus(
  steps: DetailApprovalProgressStep[],
  translate: (key: string) => string,
  listStatus?: TasksListFieldStatusRow,
): DetailHeadlineStatus | null {
  if (isProgressInFlight(steps)) {
    return null;
  }

  const signatureStep = steps.find((step) => step.key === 'signature');
  if (
    signatureStep?.completed
    && (signatureStep.statusLabel === 'Signed' || signatureStep.statusLabel === 'Signature Passed')
  ) {
    const listLabel = listStatus?.label;
    if (listLabel && isTerminalListStatus(listLabel) && listLabel !== 'Signed') {
      return {
        label: translate(listLabel),
        status: listStatus!.status,
      };
    }
    if (listLabel === 'Signature Passed') {
      return {
        label: translate('Signature Passed'),
        status: 'success',
      };
    }
    return {
      label: translate('Success'),
      status: 'success',
    };
  }

  const terminalStep = findTerminalProgressStep(steps);
  if (terminalStep?.statusLabel && terminalStep.statusTag) {
    return {
      label: translate(terminalStep.statusLabel),
      status: terminalStep.statusTag,
    };
  }

  if (listStatus && isTerminalListStatus(listStatus.label)) {
    return {
      label: translate(listStatus.label),
      status: listStatus.status,
    };
  }

  return null;
}
