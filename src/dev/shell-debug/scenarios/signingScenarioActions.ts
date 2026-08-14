import { closeAllAnchoredTooltips } from '@eds/desktop-components';
import { tasksDataListShellApiRegistry } from '@/scenes/tasks/tasksDataListShellApi';
import {
  batchSigningProgressPopupOpen,
  batchSigningStopConfirmOpen,
  closeBatchSigningProgress,
} from '@/scenes/tasks/signing/batch/batchSigningProgressUiStore';
import { signingBatchFlowRegistry, signingBatchSelectModeActive } from '@/scenes/tasks/signing/batch/signingBatchFlowContext';
import { signingFlowRegistry } from '@/scenes/tasks/signing/signingFlowContext';
import { buildMultiSignInvitationDemoData } from '@/scenes/tasks/signing/multiSignInvitation/buildMultiSignInvitationDemoData';
import { buildSigningDetailFromMultiSignInvitation } from '@/scenes/tasks/signing/multiSignInvitation/buildSigningDetailFromMultiSignInvitation';
import {
  parseSigningThreshold,
  SIGNING_PARTICIPANT_SUCCESS_MESSAGE,
} from '@/scenes/tasks/signing/multiSignWaiting.constants';
import type { MultiSignRoomPhase } from '@/scenes/tasks/signing/types';
import {
  multiSignWalletShardImported,
} from '@/scenes/tasks/signing/multiSignInvitation/multiSignInvitationStore';
import { resetSigningStoreForDemo } from '@/scenes/tasks/signing/signingStore';
import { clearQaLoadingTimeout } from './commonScenarioActions';

/** 通过公开 API 恢复演示基线；不修改业务源码。 */
export function resetShellDebugScenarioBaseline() {
  clearQaLoadingTimeout();
  closeAllAnchoredTooltips();
  resetSigningStoreForDemo();
  closeBatchSigningProgress();
  batchSigningStopConfirmOpen.value = false;
  signingBatchSelectModeActive.value = false;
  multiSignWalletShardImported.value = true;

  const batchFlow = signingBatchFlowRegistry.value;
  if (batchFlow) {
    batchFlow.signConfirmOpen.value = false;
    batchFlow.quotaAlertOpen.value = false;
    batchFlow.verifyOpen.value = false;
    batchFlow.onSignConfirmCancel?.();
    batchFlow.exitSelectMode?.();
  }

  const signingFlow = signingFlowRegistry.value;
  if (signingFlow) {
    signingFlow.multiSignOpen.value = false;
    signingFlow.multiSignPerspective.value = 'signer';
    signingFlow.multiSignPhase.value = 'waiting';
    signingFlow.detailOpen.value = false;
    signingFlow.verifyOpen.value = false;
    signingFlow.progressOpen.value = false;
    signingFlow.viewMoreOpen.value = false;
  }

  tasksDataListShellApiRegistry.value?.setListEmpty(false);
  tasksDataListShellApiRegistry.value?.setListLoading(false);
}

function demoBatchRows(count: number, startIndex = 68) {
  return Array.from({ length: count }, (_, offset) => {
    const rowIndex = startIndex + offset;
    return { id: rowIndex, _index: rowIndex };
  });
}

function openMultiSignParticipantDemo(
  phase: MultiSignRoomPhase,
  options?: {
    demoOutcome?: 'success' | 'mpc-network-error';
    autoFlow?: boolean;
  },
) {
  resetShellDebugScenarioBaseline();
  const flow = signingFlowRegistry.value;
  if (!flow) return;

  const invitation = buildMultiSignInvitationDemoData()[0];
  if (!invitation) return;

  flow.startMultiSignRoomAsParticipant(
    buildSigningDetailFromMultiSignInvitation(invitation),
    {
      autoFlow: options?.autoFlow ?? false,
      demoOutcome: options?.demoOutcome,
    },
  );

  const { required } = parseSigningThreshold(flow.detail.value?.signingThreshold ?? null);
  const joinedCount =
    phase === 'waiting'
      ? Math.max(2, Math.min(required - 1, 2))
      : Math.max(required, 3);
  flow.setMultiSignParticipantPhaseForDemo(
    phase,
    joinedCount,
    options?.demoOutcome,
  );
}

export function applySigningBatchConfirmScenario() {
  resetShellDebugScenarioBaseline();
  const flow = signingBatchFlowRegistry.value;
  if (!flow) return;
  flow.openBatchSignConfirm(demoBatchRows(5));
}

export function applySigningBatchQuotaAlertScenario() {
  resetShellDebugScenarioBaseline();
  const flow = signingBatchFlowRegistry.value;
  if (!flow) return;
  flow.openBatchSignConfirm(demoBatchRows(8, 68));
  flow.quotaFailure.value = {
    requiredUsd: 64_312_930_233_673_400,
    remainingUsd: 0,
    overageFeeUsd: 64_312_930_233_367.34,
  };
  flow.quotaAlertOpen.value = true;
}

export function applyMultiSignWaitingScenario() {
  resetShellDebugScenarioBaseline();
  const flow = signingFlowRegistry.value;
  if (!flow) return;
  const rowIndex = 1;
  flow.openDetailForRow({ id: rowIndex });
  flow.detailOpen.value = false;
  flow.multiSignPerspective.value = 'signer';
  flow.multiSignPhase.value = 'waiting';
  const { required } = parseSigningThreshold(flow.detail.value?.signingThreshold ?? null);
  flow.multiSignJoinedCount.value = Math.max(1, required - 1);
  flow.multiSignOpen.value = true;
}

export function applyMultiSignReadyScenario() {
  resetShellDebugScenarioBaseline();
  const flow = signingFlowRegistry.value;
  if (!flow) return;
  const rowIndex = 1;
  flow.openDetailForRow({ id: rowIndex });
  flow.detailOpen.value = false;
  flow.multiSignPerspective.value = 'signer';
  flow.multiSignPhase.value = 'ready';
  flow.multiSignJoinedCount.value = 3;
  flow.multiSignOpen.value = true;
}

export function applyMultiSignParticipantWaitingScenario() {
  openMultiSignParticipantDemo('waiting');
}

export function applyMultiSignParticipantReadyScenario() {
  openMultiSignParticipantDemo('ready');
}

export function applyMultiSignParticipantSigningScenario() {
  openMultiSignParticipantDemo('signing');
}

export function applyMultiSignParticipantSignFailedScenario() {
  openMultiSignParticipantDemo('sign-failed', { demoOutcome: 'mpc-network-error' });
}

export function applyMultiSignParticipantSuccessScenario() {
  resetShellDebugScenarioBaseline();
  tasksDataListShellApiRegistry.value?.showSuccessFeedback(
    SIGNING_PARTICIPANT_SUCCESS_MESSAGE,
  );
}

export function applyMultiSignParticipantAutoFlowScenario() {
  resetShellDebugScenarioBaseline();
  const flow = signingFlowRegistry.value;
  if (!flow) return;
  const invitation = buildMultiSignInvitationDemoData()[0];
  if (!invitation) return;
  flow.startMultiSignRoomAsParticipant(
    buildSigningDetailFromMultiSignInvitation(invitation),
    { autoFlow: true, demoOutcome: 'success' },
  );
}

export function applyMultiSignParticipantAutoFlowFailedScenario() {
  resetShellDebugScenarioBaseline();
  const flow = signingFlowRegistry.value;
  if (!flow) return;
  const invitation = buildMultiSignInvitationDemoData()[4];
  if (!invitation) return;
  flow.startMultiSignRoomAsParticipant(
    buildSigningDetailFromMultiSignInvitation(invitation),
    { autoFlow: true, demoOutcome: 'mpc-network-error' },
  );
}

export function applyWalletShardMissingScenario() {
  multiSignWalletShardImported.value = false;
}

export function applySigningFailedScenario() {
  resetShellDebugScenarioBaseline();
  const flow = signingFlowRegistry.value;
  if (!flow) return;

  flow.openDetailForRow({ id: 4 });
  flow.detailOpen.value = false;
  flow.progressPhase.value = 'sign-failed';
  flow.progressOpen.value = true;
}
