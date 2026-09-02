import { computed, ref, shallowRef, type Ref } from 'vue';
import { useAppI18n } from '@/composables/useAppI18n';
import type { AppLocale } from '@/composables/useAppLocale';
import {
  approvalIdFromRowIndex,
  getApprovalDetail,
  parseRowIndexFromApprovalId,
} from '../approval/approvalStore';
import { buildDetailProgressFields } from './buildDetailProgressFields';
import { buildAddressMoreSummary } from '../approval/buildApprovalDetailSections';
import type { ApprovalDetail } from '../approval/types';
import {
  buildApprovedModuleDetailStatusRowValues,
  buildStatusRowValues,
} from '../list-field/tasksListFieldStatusRowData';
import {
  isSentRequestDataListMenu,
  sentRequestRowShowsWithdrawAction,
} from '../tasksDataListPageData';
import {
  getSigningDetail,
  parseRowIndexFromSigningId,
  signingIdFromRowIndex,
} from '../signing/signingStore';
import { buildAddressMoreSummary as buildSigningAddressMoreSummary } from '../signing/buildSigningDetailSections';
import type { SigningDetail } from '../signing/types';
import type { TasksListFieldStatusKind } from '../list-field/tasksListFieldStatusRowData';

type DataListRow = Record<string, unknown> & { id?: number };

type RecordDetailKind = 'approval' | 'signing';

const RECORD_MENU_ITEMS = new Set([
  'Approved',
  'Signed',
  'All Records',
  'Sent Request',
]);

function resolveDetailKind(menuItem: string | undefined): RecordDetailKind {
  return menuItem === 'Signed' ? 'signing' : 'approval';
}

function isRecordMenuItem(
  menuItem: string | undefined,
  locale: AppLocale,
): boolean {
  if (!menuItem) return false;
  if (RECORD_MENU_ITEMS.has(menuItem)) return true;
  return isSentRequestDataListMenu(menuItem, locale);
}

export function useRecordDetailFlow(options: {
  menuItem: Ref<string | undefined>;
  allRowIndexes: Ref<number[]>;
  onWithdrawRequest?: () => void;
}) {
  const { locale } = useAppI18n();
  const detailOpen = ref(false);
  /** 打开 Detail 时快照菜单 key，避免 Popup host 与列表页同级导致 menu 上下文丢失。 */
  const detailMenuItem = ref<string | undefined>(undefined);
  const currentId = ref<string | null>(null);
  const recordIds = ref<string[]>([]);
  const viewMoreOpen = ref(false);
  const viewMoreText = ref('');

  const detailKind = computed(() => resolveDetailKind(options.menuItem.value));
  const isEnabled = computed(() =>
    isRecordMenuItem(options.menuItem.value, locale.value),
  );

  const approvalDetail = shallowRef<ApprovalDetail | null>(null);
  const signingDetail = shallowRef<SigningDetail | null>(null);

  const currentRowIndex = computed(() => {
    if (!currentId.value) return 0;
    return detailKind.value === 'signing'
      ? parseRowIndexFromSigningId(currentId.value)
      : parseRowIndexFromApprovalId(currentId.value);
  });

  const currentIndex = computed(() => {
    if (!currentId.value) return 0;
    const index = recordIds.value.indexOf(currentId.value);
    return index >= 0 ? index + 1 : 0;
  });

  const totalCount = computed(() => recordIds.value.length);
  const prevDisabled = computed(() => currentIndex.value <= 1);
  const nextDisabled = computed(
    () => currentIndex.value >= totalCount.value || totalCount.value === 0,
  );

  const listStatus = computed(() => {
    if (options.menuItem.value === 'Approved') {
      return buildApprovedModuleDetailStatusRowValues(currentRowIndex.value);
    }
    return buildStatusRowValues(currentRowIndex.value, options.menuItem.value);
  });

  const statusTagLabel = computed(() => listStatus.value.label);
  const statusTagStatus = computed(() => listStatus.value.status as TasksListFieldStatusKind);
  const activeRecordMenuItem = computed(
    () => detailMenuItem.value ?? options.menuItem.value,
  );

  const showWithdrawAction = computed(() =>
    sentRequestRowShowsWithdrawAction(
      currentRowIndex.value,
      activeRecordMenuItem.value,
      locale.value,
    ),
  );

  function idFromRowIndex(rowIndex: number): string {
    return detailKind.value === 'signing'
      ? signingIdFromRowIndex(rowIndex)
      : approvalIdFromRowIndex(rowIndex);
  }

  function syncRecordIds() {
    recordIds.value = options.allRowIndexes.value.map((index) => idFromRowIndex(index));
  }

  function rowIndexFromRow(row: DataListRow): number {
    return Number(row.id ?? 0);
  }

  function loadDetail(id: string) {
    const rowIndex =
      detailKind.value === 'signing'
        ? parseRowIndexFromSigningId(id)
        : parseRowIndexFromApprovalId(id);
    const menuItem = detailMenuItem.value ?? options.menuItem.value;

    const progressFields = buildDetailProgressFields(rowIndex, {
      initiatorNote:
        detailKind.value === 'signing'
          ? 'Please sign before cutoff.'
          : 'Please approve before cutoff.',
      scenario: 'record',
      menuItem,
    });

    if (detailKind.value === 'signing') {
      signingDetail.value = {
        ...getSigningDetail(id, rowIndex, menuItem),
        ...progressFields,
      };
      approvalDetail.value = null;
    } else {
      approvalDetail.value = {
        ...getApprovalDetail(id, rowIndex, menuItem),
        ...progressFields,
      };
      signingDetail.value = null;
    }
    currentId.value = id;
  }

  function openDetailForRow(row: DataListRow) {
    if (!isEnabled.value) return;
    syncRecordIds();
    detailMenuItem.value = options.menuItem.value;
    loadDetail(idFromRowIndex(rowIndexFromRow(row)));
    detailOpen.value = true;
  }

  function onDetailPopupClosed() {
    detailMenuItem.value = undefined;
    currentId.value = null;
    approvalDetail.value = null;
    signingDetail.value = null;
  }

  function navigateRelative(delta: number) {
    if (!currentId.value) return;
    syncRecordIds();
    const index = recordIds.value.indexOf(currentId.value);
    const nextId = recordIds.value[index + delta];
    if (!nextId) return;
    loadDetail(nextId);
  }

  function openViewMore(side: 'sender' | 'receiver') {
    if (detailKind.value === 'signing' && signingDetail.value) {
      viewMoreText.value = buildSigningAddressMoreSummary(signingDetail.value, side);
      viewMoreOpen.value = true;
      return;
    }
    if (approvalDetail.value) {
      viewMoreText.value = buildAddressMoreSummary(approvalDetail.value, side);
      viewMoreOpen.value = true;
    }
  }

  function onWithdrawRequest() {
    options.onWithdrawRequest?.();
    detailOpen.value = false;
  }

  return {
    detailOpen,
    detailKind,
    detailMenuItem,
    menuItem: options.menuItem,
    isEnabled,
    approvalDetail,
    signingDetail,
    currentIndex,
    totalCount,
    prevDisabled,
    nextDisabled,
    statusTagLabel,
    statusTagStatus,
    showWithdrawAction,
    viewMoreOpen,
    viewMoreText,
    openDetailForRow,
    onDetailPopupClosed,
    navigateRelative,
    openViewMore,
    onWithdrawRequest,
  };
}
