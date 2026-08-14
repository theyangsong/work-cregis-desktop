import { computed, ref, shallowRef, watch, type Ref } from 'vue';
import { buildAddressMoreSummary } from './buildSigningDetailSections';
import {
  checkSigningPending,
  getSigningDetail,
  isMultiSignSigningDetail,
  isSigningRowEligibleForBatch,
  listAllPendingSigningIds,
  listPendingSigningIds,
  parseRowIndexFromSigningId,
  signingIdFromRowIndex,
  submitBatchSigningAction,
  submitSigningAction,
  verifyTradePassword,
} from './signingStore';
import { buildSigningDetailFromMultiSignInvitation } from './multiSignInvitation/buildSigningDetailFromMultiSignInvitation';
import {
  getMultiSignInvitationById,
  joinMultiSignInvitation,
  validateMultiSignInvitationJoin,
} from './multiSignInvitation/multiSignInvitationStore';
import type { MultiSignInvitation } from './multiSignInvitation/types';
import type { MultiSignInvitationJoinResult } from './multiSignInvitation/types';
import { SIGNING_PROGRESS_STEP_HOLD_MS } from './signingCustomPopup.constants';
import { resolveSigningProgressDemoFailure } from './signingProgressDemo';
import {
  MULTI_SIGN_MEMBER_JOIN_LAST_DELAY_MS,
  MULTI_SIGN_MEMBER_JOIN_RANDOM_MAX_MS,
  MULTI_SIGN_PARTICIPANT_SIGNING_AFTER_READY_MS,
  SIGNING_PARTICIPANT_SUCCESS_MESSAGE,
  parseSigningThreshold,
} from './multiSignWaiting.constants';
import type { MinerFeeProfile, MinerFeeSelection } from '../shared/minerFeeProfile';
import { resolveMinerFeeProfile } from '../shared/minerFeeProfile';
import type {
  MultiSignRoomPhase,
  MultiSignWaitingPerspective,
  SigningActionKind,
  SigningDetail,
  SigningProgressPhase,
} from './types';

export const SIGNING_BATCH_MAX = 100;

export const SIGNING_ALREADY_PROCESSED_MESSAGE =
  'This item has already been processed. Please refresh the data and try again.';

export const SIGNING_SUCCESS_MESSAGE = 'Operation successful';

type RequestJoinMultiSignInvitationResult =
  | MultiSignInvitationJoinResult
  | 'verify'
  | 'flow-unavailable';

export type { RequestJoinMultiSignInvitationResult };

type DataListRow = Record<string, unknown> & { id?: number };

export function useSigningFlow(options: {
  enabled: Ref<boolean>;
  allRowIndexes: Ref<number[]>;
  onRefreshList: () => void;
  onExitBatchMode: () => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}) {
  const detailOpen = ref(false);
  const verifyOpen = ref(false);
  const viewMoreOpen = ref(false);
  const progressOpen = ref(false);
  const multiSignOpen = ref(false);

  const currentSigningId = ref<string | null>(null);
  const pendingIds = ref<string[]>([]);
  const pendingAction = ref<SigningActionKind | null>(null);
  const pendingJoinInvitation = ref<MultiSignInvitation | null>(null);
  const batchMode = ref(false);
  const batchSelectedIds = ref<string[]>([]);
  const batchMinerFeeProfile = ref<MinerFeeProfile | null>(null);
  const remark = ref('');
  const viewMoreText = ref('');
  const progressPhase = ref<SigningProgressPhase>('signing');
  const multiSignPhase = ref<MultiSignRoomPhase>('waiting');
  const multiSignJoinedCount = ref(1);
  const multiSignPerspective = ref<MultiSignWaitingPerspective>('signer');
  const multiSignParticipantDemoOutcome = ref<'success' | 'mpc-network-error'>('success');
  const pendingParticipantSuccessFeedback = ref(false);

  const detail = shallowRef<SigningDetail | null>(null);
  const pendingAutoAdvanceId = ref<string | null>(null);
  /** Progress 关闭后待翻页目标；在 verify 成功时按 pending 导航序捕获（此时当前项仍 pending）。 */
  const pendingDetailAdvanceAfterProgress = ref<string | null>(null);
  const selectedMinerFeeDisplay = ref<string | null>(null);

  const currentIndex = computed(() => {
    if (!currentSigningId.value) return 0;
    const index = pendingIds.value.indexOf(currentSigningId.value);
    return index >= 0 ? index + 1 : 0;
  });

  const totalCount = computed(() => pendingIds.value.length);
  const prevDisabled = computed(() => currentIndex.value <= 1);
  const nextDisabled = computed(
    () => currentIndex.value >= totalCount.value || totalCount.value === 0,
  );

  const isMultiSignDetail = computed(() => isMultiSignSigningDetail(detail.value));

  function syncPendingIds() {
    pendingIds.value = listAllPendingSigningIds(options.allRowIndexes.value);
  }

  function rowIndexFromRow(row: DataListRow): number {
    return Number(row.id ?? 0);
  }

  function signingIdFromRow(row: DataListRow): string {
    return signingIdFromRowIndex(rowIndexFromRow(row));
  }

  function showProcessedError() {
    options.showError(SIGNING_ALREADY_PROCESSED_MESSAGE);
  }

  function loadDetail(id: string) {
    const rowIndex = parseRowIndexFromSigningId(id);
    detail.value = getSigningDetail(id, rowIndex);
    currentSigningId.value = id;
  }

  function openDetailForRow(row: DataListRow) {
    if (!options.enabled.value) return;
    syncPendingIds();
    const id = signingIdFromRow(row);
    const rowIndex = rowIndexFromRow(row);
    if (!checkSigningPending(id, rowIndex)) {
      showProcessedError();
      return;
    }
    loadDetail(id);
    detailOpen.value = true;
  }

  function closeDetail() {
    detailOpen.value = false;
  }

  function onDetailPopupClosed() {
    currentSigningId.value = null;
    detail.value = null;
    selectedMinerFeeDisplay.value = null;
  }

  function navigateRelative(delta: number) {
    if (!currentSigningId.value) return;
    syncPendingIds();
    const index = pendingIds.value.indexOf(currentSigningId.value);
    const nextId = pendingIds.value[index + delta];
    if (!nextId) return;
    const rowIndex = parseRowIndexFromSigningId(nextId);
    if (!checkSigningPending(nextId, rowIndex)) {
      showProcessedError();
      syncPendingIds();
      return;
    }
    loadDetail(nextId);
  }

  function openVerifyStep() {
    verifyOpen.value = true;
  }

  function confirmRemarkStep(action: SigningActionKind) {
    if (!currentSigningId.value && !batchMode.value) return;
    if (!batchMode.value && currentSigningId.value) {
      const rowIndex = parseRowIndexFromSigningId(currentSigningId.value);
      if (!checkSigningPending(currentSigningId.value, rowIndex)) {
        showProcessedError();
        return;
      }
    }
    pendingAction.value = action;
    openVerifyStep();
  }

  function onDetailPassConfirm(selection: MinerFeeSelection | null = null) {
    if (isMultiSignSigningDetail(detail.value)) {
      remark.value = '';
      confirmRemarkStep('pass');
      return;
    }
    selectedMinerFeeDisplay.value = selection?.displayValue ?? null;
    confirmRemarkStep('pass');
  }

  function onDetailRejectConfirm() {
    if (isMultiSignSigningDetail(detail.value)) {
      remark.value = '';
    }
    confirmRemarkStep('reject');
  }

  function onVerifyCancel() {
    verifyOpen.value = false;
    pendingJoinInvitation.value = null;
  }

  function requestJoinMultiSignInvitation(
    id: string,
  ): RequestJoinMultiSignInvitationResult {
    if (!options.enabled.value) {
      return 'flow-unavailable';
    }

    const precheck = validateMultiSignInvitationJoin(id);
    if (precheck !== 'ok') {
      return precheck;
    }

    const invitation = getMultiSignInvitationById(id);
    if (!invitation) {
      return 'expired';
    }

    pendingJoinInvitation.value = invitation;
    verifyOpen.value = true;
    return 'verify';
  }

  function completeJoinMultiSignInvitationAfterVerify() {
    const invitation = pendingJoinInvitation.value;
    pendingJoinInvitation.value = null;
    if (!invitation) return;

    const result = joinMultiSignInvitation(invitation.id);
    if (result !== 'joined') {
      options.showError(
        result === 'shard-missing'
          ? 'Wallet shard not imported'
          : 'Invitation expired',
      );
      return;
    }

    startMultiSignRoomAsParticipant(buildSigningDetailFromMultiSignInvitation(invitation));
  }

  function startProgressPopup() {
    const rowIndex = currentSigningId.value
      ? parseRowIndexFromSigningId(currentSigningId.value)
      : -1;
    const demoFailure = resolveSigningProgressDemoFailure(rowIndex);

    progressPhase.value = 'signing';
    progressOpen.value = true;

    if (demoFailure === 'broadcast-failed') {
      window.setTimeout(() => {
        progressPhase.value = 'broadcast-failed';
      }, SIGNING_PROGRESS_STEP_HOLD_MS);
      return;
    }

    if (demoFailure === 'mpc-network-error') {
      window.setTimeout(() => {
        progressPhase.value = 'sign-failed';
      }, SIGNING_PROGRESS_STEP_HOLD_MS);
      return;
    }

    window.setTimeout(() => {
      progressPhase.value = 'broadcasting';
    }, SIGNING_PROGRESS_STEP_HOLD_MS);
    window.setTimeout(() => {
      progressPhase.value = 'on-chain-confirming';
    }, SIGNING_PROGRESS_STEP_HOLD_MS * 2);
    window.setTimeout(() => {
      progressPhase.value = 'broadcast-success';
    }, SIGNING_PROGRESS_STEP_HOLD_MS * 3);
  }

  function retryProgressAfterSignFailed() {
    if (progressPhase.value !== 'sign-failed') return;

    const rowIndex = currentSigningId.value
      ? parseRowIndexFromSigningId(currentSigningId.value)
      : -1;

    progressPhase.value = 'signing';

    if (resolveSigningProgressDemoFailure(rowIndex) !== 'mpc-network-error') {
      return;
    }

    window.setTimeout(() => {
      if (progressOpen.value && progressPhase.value === 'signing') {
        progressPhase.value = 'sign-failed';
      }
    }, SIGNING_PROGRESS_STEP_HOLD_MS);
  }

  let multiSignJoinTimers: ReturnType<typeof window.setTimeout>[] = [];

  function clearMultiSignJoinTimers() {
    for (const timerId of multiSignJoinTimers) {
      window.clearTimeout(timerId);
    }
    multiSignJoinTimers = [];
  }

  function randomMultiSignJoinDelayMs(): number {
    return Math.floor(Math.random() * (MULTI_SIGN_MEMBER_JOIN_RANDOM_MAX_MS + 1));
  }

  function scheduleMultiSignMemberJoins() {
    clearMultiSignJoinTimers();
    const { required } = parseSigningThreshold(detail.value?.signingThreshold ?? null);
    if (required <= 1) {
      multiSignPhase.value = 'ready';
      if (multiSignPerspective.value === 'participant') {
        scheduleParticipantSigningAfterReady();
      }
      return;
    }

    let elapsedMs = 0;
    for (let nextJoined = 2; nextJoined <= required; nextJoined += 1) {
      const isLastJoin = nextJoined === required;
      elapsedMs += isLastJoin
        ? MULTI_SIGN_MEMBER_JOIN_LAST_DELAY_MS
        : randomMultiSignJoinDelayMs();

      const delayMs = elapsedMs;
      const timerId = window.setTimeout(() => {
        multiSignJoinedCount.value = nextJoined;
        if (nextJoined >= required) {
          multiSignPhase.value = 'ready';
          if (multiSignPerspective.value === 'participant') {
            scheduleParticipantSigningAfterReady();
          }
        }
      }, delayMs);
      multiSignJoinTimers.push(timerId);
    }
  }

  function scheduleParticipantSigningAfterReady() {
    const timerId = window.setTimeout(() => {
      if (!multiSignOpen.value || multiSignPerspective.value !== 'participant') return;
      if (multiSignPhase.value !== 'ready') return;
      multiSignPhase.value = 'signing';

      const finishTimer = window.setTimeout(() => {
        if (!multiSignOpen.value || multiSignPerspective.value !== 'participant') return;
        if (multiSignPhase.value !== 'signing') return;
        if (multiSignParticipantDemoOutcome.value === 'mpc-network-error') {
          multiSignPhase.value = 'sign-failed';
          return;
        }
        finishMultiSignParticipantSuccess();
      }, SIGNING_PROGRESS_STEP_HOLD_MS);
      multiSignJoinTimers.push(finishTimer);
    }, MULTI_SIGN_PARTICIPANT_SIGNING_AFTER_READY_MS);
    multiSignJoinTimers.push(timerId);
  }

  function finishMultiSignParticipantSuccess() {
    pendingParticipantSuccessFeedback.value = true;
    multiSignOpen.value = false;
  }

  function startMultiSignRoom() {
    clearMultiSignJoinTimers();
    multiSignPerspective.value = 'signer';
    multiSignJoinedCount.value = 1;
    multiSignPhase.value = 'waiting';
    multiSignOpen.value = true;
    scheduleMultiSignMemberJoins();
  }

  /** 参与人：从邀请加入；autoFlow=false 时仅停留 waiting（QA）。 */
  function startMultiSignRoomAsParticipant(
    participantDetail: SigningDetail,
    options?: {
      autoFlow?: boolean;
      demoOutcome?: 'success' | 'mpc-network-error';
    },
  ) {
    clearMultiSignJoinTimers();
    detail.value = participantDetail;
    currentSigningId.value = participantDetail.id;
    multiSignPerspective.value = 'participant';
    multiSignPhase.value = 'waiting';
    multiSignParticipantDemoOutcome.value = options?.demoOutcome ?? 'success';
    pendingParticipantSuccessFeedback.value = false;
    const { required } = parseSigningThreshold(participantDetail.signingThreshold ?? null);
    multiSignJoinedCount.value = Math.max(2, Math.min(required - 1, 2));
    multiSignOpen.value = true;
    if (options?.autoFlow !== false) {
      scheduleMultiSignMemberJoins();
    }
  }

  function setMultiSignParticipantPhaseForDemo(
    phase: MultiSignRoomPhase,
    joinedCount?: number,
    demoOutcome?: 'success' | 'mpc-network-error',
  ) {
    clearMultiSignJoinTimers();
    multiSignPhase.value = phase;
    if (joinedCount != null) {
      multiSignJoinedCount.value = joinedCount;
    }
    if (demoOutcome != null) {
      multiSignParticipantDemoOutcome.value = demoOutcome;
    }
  }

  function onMultiSignReadyConfirm(selection: MinerFeeSelection | null) {
    selectedMinerFeeDisplay.value = selection?.displayValue ?? null;
    requestMultiSignProgress();
  }

  function finishRejectSuccess() {
    remark.value = '';
    pendingAction.value = null;

    const exitingBatch = batchMode.value;
    const singleCurrentId = exitingBatch ? null : currentSigningId.value;
    const singleNextId =
      singleCurrentId != null
        ? (() => {
            const index = pendingIds.value.indexOf(singleCurrentId);
            return index >= 0 ? pendingIds.value[index + 1] : undefined;
          })()
        : undefined;

    if (exitingBatch) {
      batchMode.value = false;
      batchSelectedIds.value = [];
      options.onExitBatchMode();
      closeDetail();
    }

    options.showSuccess(SIGNING_SUCCESS_MESSAGE);
    options.onRefreshList();
    syncPendingIds();

    if (exitingBatch || !singleCurrentId || !detailOpen.value) {
      return;
    }

    if (singleNextId) {
      const rowIndex = parseRowIndexFromSigningId(singleNextId);
      if (checkSigningPending(singleNextId, rowIndex)) {
        pendingAutoAdvanceId.value = singleNextId;
        return;
      }
    }

    closeDetail();
  }

  function onDetailShellOpened() {
    const nextId = pendingAutoAdvanceId.value;
    if (!nextId) return;
    pendingAutoAdvanceId.value = null;
    const rowIndex = parseRowIndexFromSigningId(nextId);
    if (checkSigningPending(nextId, rowIndex) || nextId === currentSigningId.value) {
      loadDetail(nextId);
      return;
    }
    closeDetail();
  }

  function captureDetailAdvanceBeforeProgress() {
    if (!currentSigningId.value || !detailOpen.value || batchMode.value) {
      pendingDetailAdvanceAfterProgress.value = null;
      return;
    }
    const currentId = currentSigningId.value;
    const index = pendingIds.value.indexOf(currentId);
    const nextId = index >= 0 ? pendingIds.value[index + 1] : undefined;
    pendingDetailAdvanceAfterProgress.value = nextId ?? currentId;
  }

  function scheduleDetailResumeAfterProgress() {
    if (!currentSigningId.value || !detailOpen.value) {
      pendingDetailAdvanceAfterProgress.value = null;
      return;
    }
    const targetId = pendingDetailAdvanceAfterProgress.value ?? currentSigningId.value;
    pendingDetailAdvanceAfterProgress.value = null;
    pendingAutoAdvanceId.value = targetId;
  }

  function onProgressClosed() {
    progressOpen.value = false;
    remark.value = '';
    pendingAction.value = null;
    selectedMinerFeeDisplay.value = null;
    options.onRefreshList();
    syncPendingIds();
    scheduleDetailResumeAfterProgress();
  }

  function onMultiSignClosed() {
    clearMultiSignJoinTimers();
    multiSignPerspective.value = 'signer';
    multiSignPhase.value = 'waiting';
    multiSignJoinedCount.value = 1;
    remark.value = '';
    pendingAction.value = null;
    options.onRefreshList();
    syncPendingIds();
    pendingDetailAdvanceAfterProgress.value = null;
  }

  let multiSignClosingForProgress = ref(false);

  function requestMultiSignProgress() {
    clearMultiSignJoinTimers();
    multiSignClosingForProgress.value = true;
    multiSignOpen.value = false;
  }

  function onMultiSignPopupClosed() {
    if (multiSignClosingForProgress.value) {
      multiSignClosingForProgress.value = false;
      startProgressPopup();
      return;
    }
    const showParticipantSuccess = pendingParticipantSuccessFeedback.value;
    pendingParticipantSuccessFeedback.value = false;
    onMultiSignClosed();
    if (showParticipantSuccess) {
      options.showSuccess(SIGNING_PARTICIPANT_SUCCESS_MESSAGE);
    }
  }

  function onVerifyConfirm(password: string): boolean {
    if (pendingJoinInvitation.value) {
      return verifyTradePassword(password);
    }

    const action = pendingAction.value;
    if (!action) return false;

    if (batchMode.value) {
      const result = submitBatchSigningAction(batchSelectedIds.value, action, password);
      if (!result.ok) {
        if (result.reason === 'processed') showProcessedError();
        return false;
      }
      return true;
    }

    if (!currentSigningId.value) return false;
    const rowIndex = parseRowIndexFromSigningId(currentSigningId.value);
    const result = submitSigningAction(currentSigningId.value, rowIndex, action, password);
    if (!result.ok) {
      if (result.reason === 'processed') showProcessedError();
      return false;
    }
    return true;
  }

  async function prepareDetailRemarkOpen() {
    if (!options.enabled.value || !currentSigningId.value) {
      throw new Error(SIGNING_ALREADY_PROCESSED_MESSAGE);
    }
    const rowIndex = parseRowIndexFromSigningId(currentSigningId.value);
    if (!checkSigningPending(currentSigningId.value, rowIndex)) {
      showProcessedError();
      throw new Error(SIGNING_ALREADY_PROCESSED_MESSAGE);
    }
  }

  function onVerifyPopupClosed(accepted: boolean) {
    if (pendingJoinInvitation.value) {
      if (!accepted) {
        pendingJoinInvitation.value = null;
        return;
      }
      completeJoinMultiSignInvitationAfterVerify();
      return;
    }

    if (!accepted) {
      pendingAction.value = null;
      return;
    }

    const action = pendingAction.value;
    if (!action) return;

    if (batchMode.value) {
      finishRejectSuccess();
      return;
    }

    if (action === 'reject') {
      finishRejectSuccess();
      return;
    }

    captureDetailAdvanceBeforeProgress();

    if (isMultiSignSigningDetail(detail.value)) {
      startMultiSignRoom();
      return;
    }

    startProgressPopup();
  }

  async function prepareBatchRemarkOpen(
    key: string,
    rows: Array<DataListRow & { _index?: number }>,
  ) {
    if (!options.enabled.value) return;
    const action: SigningActionKind = key === 'pass' ? 'pass' : 'reject';
    const ids = rows.map((row) => signingIdFromRow(row));
    for (const id of ids) {
      const rowIndex = parseRowIndexFromSigningId(id);
      if (!isSigningRowEligibleForBatch(rowIndex)) {
        throw new Error('Multi-sign items cannot be batch signed.');
      }
      if (!checkSigningPending(id, rowIndex)) {
        throw new Error(SIGNING_ALREADY_PROCESSED_MESSAGE);
      }
    }
    batchSelectedIds.value = ids;
    pendingAction.value = action;
    batchMode.value = true;
    remark.value = '';
    batchMinerFeeProfile.value =
      action === 'pass' && ids.length > 0
        ? resolveMinerFeeProfile(parseRowIndexFromSigningId(ids[0]!))
        : null;
  }

  function onBatchRemarkConfirm(selection: MinerFeeSelection | null) {
    selectedMinerFeeDisplay.value = selection?.displayValue ?? null;
  }

  function confirmBatchRemark() {
    if (!options.enabled.value || !pendingAction.value || batchSelectedIds.value.length === 0) {
      return;
    }
    verifyOpen.value = true;
  }

  function onSelectedChange(rows: Array<DataListRow & { _index?: number }>) {
    if (!options.enabled.value) return;
    const multiSignRows = rows.filter((row) => !isSigningRowEligibleForBatch(rowIndexFromRow(row)));
    if (multiSignRows.length > 0) {
      options.showError('Multi-sign items cannot be batch signed.');
    }
    if (rows.length > SIGNING_BATCH_MAX) {
      options.showError(`You can select up to ${SIGNING_BATCH_MAX} items at a time.`);
    }
  }

  const remarkSelectedCount = computed(() =>
    batchMode.value ? batchSelectedIds.value.length : 1,
  );

  function openViewMore(side: 'sender' | 'receiver') {
    if (!detail.value) return;
    viewMoreText.value = buildAddressMoreSummary(detail.value, side);
    viewMoreOpen.value = true;
  }

  watch(
    () => options.enabled.value,
    (enabled) => {
      if (!enabled) {
        detailOpen.value = false;
        currentSigningId.value = null;
        detail.value = null;
        verifyOpen.value = false;
        viewMoreOpen.value = false;
        progressOpen.value = false;
        pendingJoinInvitation.value = null;
        clearMultiSignJoinTimers();
        multiSignOpen.value = false;
      }
    },
  );

  return {
    detailOpen,
    verifyOpen,
    viewMoreOpen,
    progressOpen,
    multiSignOpen,
    detail,
    remark,
    viewMoreText,
    batchMode,
    batchMinerFeeProfile,
    currentIndex,
    totalCount,
    prevDisabled,
    nextDisabled,
    remarkSelectedCount,
    isMultiSignDetail,
    progressPhase,
    multiSignPhase,
    multiSignJoinedCount,
    multiSignPerspective,
    multiSignParticipantDemoOutcome,
    selectedMinerFeeDisplay,
    openDetailForRow,
    closeDetail,
    onDetailPopupClosed,
    onDetailShellOpened,
    navigateRelative,
    onDetailPassConfirm,
    onDetailRejectConfirm,
    onVerifyCancel,
    onVerifyConfirm,
    onVerifyPopupClosed,
    onProgressClosed,
    retryProgressAfterSignFailed,
    requestMultiSignProgress,
    onMultiSignPopupClosed,
    onMultiSignReadyConfirm,
    multiSignClosingForProgress,
    startMultiSignRoomAsParticipant,
    requestJoinMultiSignInvitation,
    setMultiSignParticipantPhaseForDemo,
    finishMultiSignParticipantSuccess,
    prepareDetailRemarkOpen,
    prepareBatchRemarkOpen,
    onBatchRemarkConfirm,
    confirmBatchRemark,
    onSelectedChange,
    openViewMore,
    syncPendingIds,
  };
}
