import { computed, ref, shallowRef, watch, type Ref } from 'vue';
import {
  buildAddressMoreSummary,
} from './buildApprovalDetailSections';
import {
  approvalIdFromRowIndex,
  checkApprovalPending,
  getApprovalDetail,
  listPendingApprovalIds,
  parseRowIndexFromApprovalId,
  submitApprovalAction,
  submitBatchApprovalAction,
} from './approvalStore';
import type { ApprovalActionKind, ApprovalDetail } from './types';

export const APPROVAL_BATCH_MAX = 100;

export const APPROVAL_ALREADY_PROCESSED_MESSAGE =
  'This data has already been processed. Please refresh the data and try again.';

export const APPROVAL_SUCCESS_MESSAGE = 'Operation successful';

type DataListRow = Record<string, unknown> & { id?: number };

export function useApprovalFlow(options: {
  enabled: Ref<boolean>;
  allRowIndexes: Ref<number[]>;
  selectMode: Ref<boolean>;
  onRefreshList: () => void;
  onExitBatchMode: () => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}) {
  const detailOpen = ref(false);
  const verifyOpen = ref(false);
  const viewMoreOpen = ref(false);

  const currentApprovalId = ref<string | null>(null);
  const pendingIds = ref<string[]>([]);
  const pendingAction = ref<ApprovalActionKind | null>(null);
  const batchMode = ref(false);
  const batchSelectedIds = ref<string[]>([]);
  const remark = ref('');
  const viewMoreText = ref('');

  const detail = shallowRef<ApprovalDetail | null>(null);
  /** 验证成功后暂存下一项 id，待 Detail shell 恢复后再 loadDetail（保留 motion-page 翻页）。 */
  const pendingAutoAdvanceId = ref<string | null>(null);

  watch(
    () => options.selectMode.value,
    (enabled, wasEnabled) => {
      if (!wasEnabled || enabled || verifyOpen.value) return;
      batchMode.value = false;
      batchSelectedIds.value = [];
      remark.value = '';
      pendingAction.value = null;
    },
  );

  const currentIndex = computed(() => {
    if (!currentApprovalId.value) return 0;
    const index = pendingIds.value.indexOf(currentApprovalId.value);
    return index >= 0 ? index + 1 : 0;
  });

  const totalCount = computed(() => pendingIds.value.length);
  const prevDisabled = computed(() => currentIndex.value <= 1);
  const nextDisabled = computed(() => currentIndex.value >= totalCount.value || totalCount.value === 0);

  function syncPendingIds() {
    pendingIds.value = listPendingApprovalIds(options.allRowIndexes.value);
  }

  function rowIndexFromRow(row: DataListRow): number {
    return Number(row.id ?? 0);
  }

  function approvalIdFromRow(row: DataListRow): string {
    return approvalIdFromRowIndex(rowIndexFromRow(row));
  }

  function showProcessedError() {
    options.showError(APPROVAL_ALREADY_PROCESSED_MESSAGE);
  }

  function loadDetail(id: string) {
    const rowIndex = parseRowIndexFromApprovalId(id);
    detail.value = getApprovalDetail(id, rowIndex);
    currentApprovalId.value = id;
  }

  function openDetailForRow(row: DataListRow) {
    if (!options.enabled.value) return;
    syncPendingIds();
    const id = approvalIdFromRow(row);
    const rowIndex = rowIndexFromRow(row);
    if (!checkApprovalPending(id, rowIndex)) {
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
    currentApprovalId.value = null;
    detail.value = null;
  }

  function navigateRelative(delta: number) {
    if (!currentApprovalId.value) return;
    syncPendingIds();
    const index = pendingIds.value.indexOf(currentApprovalId.value);
    const nextId = pendingIds.value[index + delta];
    if (!nextId) return;
    const rowIndex = parseRowIndexFromApprovalId(nextId);
    if (!checkApprovalPending(nextId, rowIndex)) {
      showProcessedError();
      syncPendingIds();
      return;
    }
    loadDetail(nextId);
  }

  function confirmRemarkStep(action: ApprovalActionKind) {
    if (!currentApprovalId.value) return;
    const rowIndex = parseRowIndexFromApprovalId(currentApprovalId.value);
    if (!checkApprovalPending(currentApprovalId.value, rowIndex)) {
      showProcessedError();
      return;
    }
    pendingAction.value = action;
    batchMode.value = false;
    verifyOpen.value = true;
  }

  function onDetailPassConfirm() {
    confirmRemarkStep('pass');
  }

  function onDetailRejectConfirm() {
    confirmRemarkStep('reject');
  }

  function onVerifyCancel() {
    verifyOpen.value = false;
  }

  function finishSuccess() {
    remark.value = '';
    pendingAction.value = null;

    const exitingBatch = batchMode.value;
    const singleCurrentId = exitingBatch ? null : currentApprovalId.value;
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

    options.showSuccess(APPROVAL_SUCCESS_MESSAGE);
    options.onRefreshList();
    syncPendingIds();

    if (exitingBatch) {
      return;
    }

    if (!singleCurrentId || !detailOpen.value) {
      return;
    }

    if (singleNextId) {
      const rowIndex = parseRowIndexFromApprovalId(singleNextId);
      if (checkApprovalPending(singleNextId, rowIndex)) {
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
    const rowIndex = parseRowIndexFromApprovalId(nextId);
    if (checkApprovalPending(nextId, rowIndex)) {
      loadDetail(nextId);
      return;
    }
    closeDetail();
  }

  function onVerifyConfirm(password: string): boolean {
    const action = pendingAction.value;
    if (!action) return false;

    if (batchMode.value) {
      const result = submitBatchApprovalAction(batchSelectedIds.value, action, password);
      if (!result.ok) {
        if (result.reason === 'processed') showProcessedError();
        return false;
      }
      return true;
    }

    if (!currentApprovalId.value) return false;
    const rowIndex = parseRowIndexFromApprovalId(currentApprovalId.value);
    const result = submitApprovalAction(currentApprovalId.value, rowIndex, action, password);
    if (!result.ok) {
      if (result.reason === 'processed') showProcessedError();
      return false;
    }
    return true;
  }

  async function prepareBatchRemarkOpen(
    key: string,
    rows: Array<DataListRow & { _index?: number }>,
  ) {
    if (!options.enabled.value) return;
    const action: ApprovalActionKind = key === 'pass' ? 'pass' : 'reject';
    const ids = rows.map((row) => approvalIdFromRow(row));
    for (const id of ids) {
      const rowIndex = parseRowIndexFromApprovalId(id);
      if (!checkApprovalPending(id, rowIndex)) {
        throw new Error(APPROVAL_ALREADY_PROCESSED_MESSAGE);
      }
    }
    batchSelectedIds.value = ids;
    pendingAction.value = action;
    batchMode.value = true;
    remark.value = '';
  }

  function confirmBatchRemark() {
    if (!options.enabled.value || !pendingAction.value || batchSelectedIds.value.length === 0) {
      return;
    }
    verifyOpen.value = true;
  }

  function onBatchAction(key: string, rows: Array<DataListRow & { _index?: number }>) {
    void key;
    void rows;
    confirmBatchRemark();
  }

  function onSelectedChange(rows: Array<DataListRow & { _index?: number }>) {
    if (!options.enabled.value) return;
    if (rows.length <= APPROVAL_BATCH_MAX) return;
    options.showError('You can select up to 100 items at a time.');
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
        currentApprovalId.value = null;
        detail.value = null;
        verifyOpen.value = false;
        viewMoreOpen.value = false;
      }
    },
  );

  async function prepareDetailRemarkOpen() {
    if (!options.enabled.value || !currentApprovalId.value) {
      throw new Error(APPROVAL_ALREADY_PROCESSED_MESSAGE);
    }
    const rowIndex = parseRowIndexFromApprovalId(currentApprovalId.value);
    if (!checkApprovalPending(currentApprovalId.value, rowIndex)) {
      showProcessedError();
      throw new Error(APPROVAL_ALREADY_PROCESSED_MESSAGE);
    }
  }

  function onVerifyPopupClosed(accepted: boolean) {
    if (!accepted) {
      pendingAction.value = null;
      return;
    }
    finishSuccess();
  }

  return {
    detailOpen,
    verifyOpen,
    viewMoreOpen,
    detail,
    remark,
    viewMoreText,
    batchMode,
    currentIndex,
    totalCount,
    prevDisabled,
    nextDisabled,
    remarkSelectedCount,
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
    prepareDetailRemarkOpen,
    prepareBatchRemarkOpen,
    confirmBatchRemark,
    onBatchAction,
    onSelectedChange,
    openViewMore,
    syncPendingIds,
  };
}
