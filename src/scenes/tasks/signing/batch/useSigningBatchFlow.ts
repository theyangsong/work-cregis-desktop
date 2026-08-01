import { computed, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue';
import { resolveMinerFeeProfile, type MinerFeeSelection } from '../../shared/minerFeeProfile';
import { SIGNING_BATCH_SELECT_MAX } from './batchSigning.constants';
import {
  commitBatchRejectResults,
  createBatchSigningTask,
  getActiveBatchSigningTask,
  isBatchSigningTaskIncomplete,
  stopBatchSigningTask,
} from './batchSigningTaskStore';
import {
  checkSigningPending,
  signingIdFromRowIndex,
} from '../signingStore';
import {
  batchSigningProgressPopupOpen,
  batchSigningStopConfirmOpen,
  closeBatchSigningProgress,
  openBatchSigningProgressPopup,
  suspendBatchSigningProgressPopup,
} from './batchSigningProgressUiStore';
import { buildBatchSigningRowModel } from './buildBatchSigningRowModel';
import { buildBatchSummary } from './buildBatchSummary';
import { checkWithdrawalQuota } from './checkWithdrawalQuota';
import { evaluateBatchEligibility } from './evaluateBatchEligibility';
import {
  countDistinctPendingCurrencies,
  groupPendingByCurrency,
} from './groupPendingByCurrency';
import type {
  BatchCurrencyGroup,
  BatchEligibilityResult,
  SigningBatchRowModel,
} from './types';

export type SigningBatchViewMode = 'list' | 'progress';

export const SIGNING_BATCH_ALREADY_PROCESSED_MESSAGE =
  'This data has already been processed. Please refresh the data and try again.';

type BatchRow = Record<string, unknown> & { _index: number };

export function useSigningBatchFlow(options: {
  enabled: ComputedRef<boolean>;
  allRowIndexes: ComputedRef<number[]>;
  selectMode: Ref<boolean>;
  closeDataListSelect?: () => void;
  openDataListSelect?: () => void;
  onRefreshList: () => void;
  onExitBatchMode: () => void;
  showError: (message: string) => void;
  showSuccess: () => void;
}) {
  const viewMode = ref<SigningBatchViewMode>('list');
  /** 批处理多选时按币种+网络 key 过滤。 */
  const selectCurrencyKey = ref<string | null>(null);

  /** 待签名单签按币种+网络分组（供工具栏 Flotation Combo）。 */
  const currencyGroups = computed(() => groupPendingByCurrency(options.allRowIndexes.value));

  const signConfirmOpen = ref(false);
  const stopConfirmOpen = batchSigningStopConfirmOpen;
  const quotaAlertOpen = ref(false);
  const quotaFailure = ref<{
    requiredUsd: number;
    remainingUsd: number;
    overageFeeUsd: number;
  } | null>(null);
  const verifyOpen = ref(false);

  const pendingRowIndexes = ref<number[]>([]);
  const pendingAction = ref<'pass' | 'reject' | null>(null);
  const remark = ref('');
  const minerFeeSelection = ref<MinerFeeSelection | null>(null);
  const eligibility = shallowRef<BatchEligibilityResult>({ signable: [], ineligible: [] });

  const activeTask = getActiveBatchSigningTask();

  const batchMinerFeeProfile = computed(() => {
    if (pendingAction.value !== 'pass') return null;
    const firstSignable = eligibility.value.signable[0];
    if (firstSignable) {
      return resolveMinerFeeProfile(firstSignable.rowIndex);
    }
    const first = pendingRowIndexes.value[0];
    if (first == null) return null;
    return resolveMinerFeeProfile(first);
  });

  const signSummary = computed(() => buildBatchSummary(eligibility.value.signable));

  function dismissBatchPopups() {
    signConfirmOpen.value = false;
    stopConfirmOpen.value = false;
    quotaAlertOpen.value = false;
    verifyOpen.value = false;
    quotaFailure.value = null;
  }

  watch(options.enabled, (enabled) => {
    if (!enabled) {
      dismissBatchPopups();
      exitSelectMode();
      suspendBatchSigningProgressPopup();
      if (viewMode.value === 'progress') {
        viewMode.value = 'list';
      }
    }
  }, { immediate: true });

  function shouldPreservePendingBatchOnSelectExit(): boolean {
    return (
      signConfirmOpen.value
      || verifyOpen.value
      || quotaAlertOpen.value
      || pendingAction.value !== null
    );
  }

  watch(
    () => options.selectMode.value,
    (enabled, wasEnabled) => {
      if (wasEnabled && !enabled) {
        selectCurrencyKey.value = null;
        if (shouldPreservePendingBatchOnSelectExit()) {
          return;
        }
        resetPendingBatchState();
      }
    },
  );

  function resetPendingBatchState() {
    pendingRowIndexes.value = [];
    pendingAction.value = null;
    remark.value = '';
    minerFeeSelection.value = null;
    eligibility.value = { signable: [], ineligible: [] };
  }

  function openProgressPage() {
    viewMode.value = 'progress';
    openBatchSigningProgressPopup();
    options.selectMode.value = false;
  }

  function closeProgressPage() {
    closeBatchSigningProgress();
    viewMode.value = 'list';
    resetPendingBatchState();
    options.onRefreshList();
  }

  function onProgressPopupClose() {
    const task = activeTask.value;
    if (task && isBatchSigningTaskIncomplete(task)) {
      return;
    }
    closeProgressPage();
  }

  function enterSelectMode(currencyKey: string | null) {
    selectCurrencyKey.value = currencyKey;
    if (options.openDataListSelect) {
      options.openDataListSelect();
      return;
    }
    options.selectMode.value = true;
  }

  function exitSelectMode() {
    if (options.closeDataListSelect) {
      options.closeDataListSelect();
      return;
    }
    selectCurrencyKey.value = null;
    options.selectMode.value = false;
    resetPendingBatchState();
  }

  function onBatchButtonClick() {
    if (!options.enabled.value) return;

    if (activeTask.value) {
      openProgressPage();
      return;
    }

    if (options.selectMode.value) {
      exitSelectMode();
      return;
    }

    const groups = currencyGroups.value;
    if (groups.length === 0) {
      options.showError('No pending signing items available for batch processing.');
      return;
    }

    // 多币种：由工具栏 EgFlotation Combo 展开；此处仅处理单币种直进多选
    if (groups.length > 1) {
      return;
    }

    enterSelectMode(groups[0]?.currencyKey ?? null);
  }

  function onCurrencyGroupProcess(group: BatchCurrencyGroup) {
    enterSelectMode(group.currencyKey);
  }

  /** 是否由工具栏 Flotation Combo 承载币种选择（多币种且非多选/进度）。 */
  function shouldUseNetworkPickerFlotation(): boolean {
    if (!options.enabled.value) return false;
    if (activeTask.value) return false;
    if (options.selectMode.value) return false;
    return currencyGroups.value.length > 1;
  }

  function filterRowIndexesForSelect(rowIndexes: number[]): number[] {
    return rowIndexes.filter((rowIndex) => {
      const row = buildBatchSigningRowModel(rowIndex);
      if (!row.isSingleSign) return false;
      if (!selectCurrencyKey.value) return true;
      return row.currencyKey === selectCurrencyKey.value;
    });
  }

  function onSelectedChange(rows: Array<Record<string, unknown> & { _index: number }>) {
    if (!options.enabled.value || !options.selectMode.value) return;
    if (rows.length > SIGNING_BATCH_SELECT_MAX) {
      options.showError('You can select up to 100 items at a time.');
    }
  }

  function assertBatchSigningRowsPending(rowIndexes: number[]) {
    for (const rowIndex of rowIndexes) {
      const signingId = signingIdFromRowIndex(rowIndex);
      if (!checkSigningPending(signingId, rowIndex)) {
        throw new Error(SIGNING_BATCH_ALREADY_PROCESSED_MESSAGE);
      }
    }
  }

  function beginBatchAction(
    key: 'pass' | 'reject',
    rows: BatchRow[],
  ) {
    if (rows.length > SIGNING_BATCH_SELECT_MAX) {
      throw new Error(`You can select up to ${SIGNING_BATCH_SELECT_MAX} items at a time.`);
    }

    const rowIndexes = rows.map((row) => Number(row.id ?? row._index ?? 0));
    assertBatchSigningRowsPending(rowIndexes);
    pendingRowIndexes.value = rowIndexes;
    pendingAction.value = key;
    remark.value = '';
    minerFeeSelection.value = null;
    eligibility.value = evaluateBatchEligibility(rowIndexes);
  }

  /** 批量驳回 Popover：beforeOpen 校验 + 准备状态。 */
  async function prepareBatchRejectAction(
    rows: BatchRow[],
  ) {
    if (!options.enabled.value) return;
    beginBatchAction('reject', rows);
  }

  /** 批量签名：直开 880×620 确认弹窗（不走 BatchBar Popover）。 */
  function openBatchSignConfirm(rows: BatchRow[]) {
    if (!options.enabled.value) return;

    try {
      beginBatchAction('pass', rows);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : 'Batch action failed';
      options.showError(message);
      return;
    }

    signConfirmOpen.value = true;
    options.closeDataListSelect?.();
  }

  /** @deprecated 仅保留类型兼容；签名请用 openBatchSignConfirm。 */
  async function prepareBatchAction(
    key: string,
    rows: BatchRow[],
  ) {
    if (key === 'reject') {
      await prepareBatchRejectAction(rows);
    }
  }

  function closeSignConfirm() {
    signConfirmOpen.value = false;
    if (!verifyOpen.value) {
      pendingAction.value = null;
    }
  }

  function onSignConfirmCancel() {
    closeSignConfirm();
    resetPendingBatchState();
  }

  function onSignConfirmProceed() {
    if (eligibility.value.signable.length === 0) {
      closeSignConfirm();
      resetPendingBatchState();
      return;
    }

    const quota = checkWithdrawalQuota(eligibility.value.signable);
    if (!quota.ok) {
      quotaFailure.value = {
        requiredUsd: quota.requiredUsd,
        remainingUsd: quota.remainingUsd,
        overageFeeUsd: quota.overageFeeUsd,
      };
      quotaAlertOpen.value = true;
      return;
    }

    verifyOpen.value = true;
  }

  function onQuotaAlertClose() {
    quotaAlertOpen.value = false;
    quotaFailure.value = null;
  }

  function onQuotaAlertContinue() {
    quotaAlertOpen.value = false;
    quotaFailure.value = null;
    verifyOpen.value = true;
  }

  function onVerifyCancel() {
    verifyOpen.value = false;
  }

  async function onVerifyConfirm(password: string): Promise<boolean> {
    const action = pendingAction.value;
    if (!action) return false;

    if (action === 'reject') {
      const ids = pendingRowIndexes.value.map((rowIndex) =>
        buildBatchSigningRowModel(rowIndex).signingId,
      );
      const result = commitBatchRejectResults(ids, password);
      if (!result.ok) {
        if (result.reason === 'invalid-password') return false;
        options.showError(SIGNING_BATCH_ALREADY_PROCESSED_MESSAGE);
        return false;
      }
      verifyOpen.value = false;
      options.showSuccess();
      options.onExitBatchMode();
      resetPendingBatchState();
      options.onRefreshList();
      return true;
    }

    const signableRows = eligibility.value.signable;
    verifyOpen.value = false;
    signConfirmOpen.value = false;
    createBatchSigningTask({
      rows: signableRows,
      remark: remark.value,
      minerFeeDisplay: minerFeeSelection.value?.displayValue ?? null,
      verifyPassword: password,
    });
    resetPendingBatchState();
    openProgressPage();
    return true;
  }

  function onVerifyClosed(accepted: boolean) {
    if (!accepted) {
      verifyOpen.value = false;
    }
  }

  function onRejectConfirmProceed() {
    verifyOpen.value = true;
  }

  function confirmBatchRejectRemark() {
    if (
      !options.enabled.value
      || pendingAction.value !== 'reject'
      || pendingRowIndexes.value.length === 0
    ) {
      return;
    }
    try {
      assertBatchSigningRowsPending(pendingRowIndexes.value);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : 'Batch action failed';
      options.showError(message);
      return;
    }
    verifyOpen.value = true;
  }

  function requestStopSigning() {
    batchSigningStopConfirmOpen.value = true;
  }

  function confirmStopSigning() {
    stopBatchSigningTask();
    batchSigningStopConfirmOpen.value = false;
  }

  function cancelStopSigning() {
    batchSigningStopConfirmOpen.value = false;
  }

  function onBatchMinerFeeConfirm(selection: MinerFeeSelection | null) {
    minerFeeSelection.value = selection;
  }

  function shouldFilterRow(rowIndex: number): boolean {
    if (!options.selectMode.value || !options.enabled.value) return false;
    const row = buildBatchSigningRowModel(rowIndex);
    if (!row.isSingleSign) return true;
    if (!selectCurrencyKey.value) return false;
    return row.currencyKey !== selectCurrencyKey.value;
  }

  return {
    viewMode,
    selectCurrencyKey,
    activeTask,
    signConfirmOpen,
    stopConfirmOpen,
    quotaAlertOpen,
    quotaFailure,
    verifyOpen,
    pendingRowIndexes,
    pendingAction,
    remark,
    minerFeeSelection,
    eligibility,
    batchMinerFeeProfile,
    signSummary,
    currencyGroups,
    shouldUseNetworkPickerFlotation,
    onBatchButtonClick,
    onCurrencyGroupProcess,
    /** @deprecated 使用 onCurrencyGroupProcess */
    onNetworkGroupProcess: onCurrencyGroupProcess,
    filterRowIndexesForSelect,
    onSelectedChange,
    prepareBatchRejectAction,
    openBatchSignConfirm,
    prepareBatchAction,
    onSignConfirmCancel,
    onSignConfirmProceed,
    onQuotaAlertClose,
    onQuotaAlertContinue,
    onVerifyCancel,
    onVerifyConfirm,
    onVerifyClosed,
    onRejectConfirmProceed,
    confirmBatchRejectRemark,
    requestStopSigning,
    confirmStopSigning,
    cancelStopSigning,
    onBatchMinerFeeConfirm,
    shouldFilterRow,
    closeProgressPage,
    onProgressPopupClose,
    exitSelectMode,
    countDistinctPendingCurrencies: () =>
      countDistinctPendingCurrencies(options.allRowIndexes.value),
  };
}

export type SigningBatchFlowInstance = ReturnType<typeof useSigningBatchFlow>;
