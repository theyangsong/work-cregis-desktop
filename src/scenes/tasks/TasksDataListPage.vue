<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRef,
  watch,
  type ComponentPublicInstance,
} from 'vue';
import {
  EgDataList,
  EgDataListCellOverflow,
  EgDataListColumn,
  EgDivider,
  EgEndFeedbackCard,
  EgFlotation,
  EgIcon,
  EgIconButton,
  EgIconButtonPro,
  EgLayout,
  EgPaginer,
  EgPaginationItem,
  EgToast,
  EgToolBar,
  POPOVER_PRESET_WIDTH_BASE,
  closeAllAnchoredTooltips,
} from '@eds/desktop-components';
import TasksDataListColumnCell from './list-field/TasksDataListColumnCell.vue';
import SentRequestAmountListCell from './list-field/sentRequest/SentRequestAmountListCell.vue';
import SentRequestOperationTypeListCell from './list-field/sentRequest/SentRequestOperationTypeListCell.vue';
import SentRequestReceiverListCell from './list-field/sentRequest/SentRequestReceiverListCell.vue';
import SentRequestSenderListCell from './list-field/sentRequest/SentRequestSenderListCell.vue';
import SentRequestStatusListCell from './list-field/sentRequest/SentRequestStatusListCell.vue';
import DataListHeaderSortTrigger from './DataListHeaderSortTrigger.vue';
import pageStyles from './TasksDataListPage.module.css';
import {
  DATA_LIST_FIGMA_HEADER_HEIGHT,
  DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS,
  DATA_LIST_FIGMA_TOOLBAR,
  tasksDataListCustomizeDefaults,
  tasksDataListDefaultRowCount,
  dataListColumnSettingDefaults,
  migrateDataListColumnSettings,
  syncSentRequestDataListColumnSettings,
  resolveTasksDataListMenuItem,
  DATA_LIST_PRIMARY_ACTION_LABEL,
  DATA_LIST_PRIMARY_ACTION_LABEL_EN,
  tasksDataListPrimaryActionLabel,
  tasksDataListShowsActionColumn,
  tasksDataListShowsExport,
  tasksDataListShowsBatch,
  tasksDataListShowsStatusColumn,
  tasksDataListAmountColumnAlign,
  tasksDataListAmountColumnFlexGrow,
  tasksDataListAmountColumnMinWidth,
  tasksDataListBusinessTypeColumnWidth,
  tasksDataListBusinessTypeColumnMinWidth,
  tasksDataListBusinessTypeColumnShowsComboHeader,
  tasksDataListBusinessTypeColumnSecondaryLabel,
  tasksDataListBusinessTypeColumnSecondarySortable,
  tasksDataListCreatedTimeColumnMinWidth,
  tasksDataListCreatedTimeColumnDisplayOrder,
  tasksDataListShowsCreatedTimeColumn,
  tasksDataListReceiverColumnWidth,
  tasksDataListReceiverColumnMinWidth,
  tasksDataListReceiverColumnDisplayOrder,
  tasksDataListGeneralStructureColumnMinWidth,
  tasksDataListStatusColumnLabel,
  tasksDataListStatusColumnMinWidth,
  tasksDataListStatusColumnWidth,
  tasksDataListStatusColumnDisplayOrder,
  tasksDataListBusinessTypeColumnDisplayOrder,
  tasksDataListAmountColumnDisplayOrder,
  tasksDataListActionColumnDisplayOrder,
  tasksDataListShowsGeneralStructureColumn,
  isSentRequestDataListMenu,
  resolveTasksModuleMenuDisplayLabel,
  isTasksDataListMenuItem,
  type TasksDataListMenuItemLabel,
  type TasksDataListCustomizeState,
} from './tasksDataListPageData';
import { useAppI18n } from '@/composables/useAppI18n';
import { useListRegionInteractionBlock } from '@/composables/useListRegionInteractionBlock';
import { formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import ApprovalRemarkPopoverPanel from './approval/ApprovalRemarkPopoverPanel.vue';
import {
  registerSigningBatchFlow,
  setSigningBatchSelectModeActive,
} from './signing/batch/signingBatchFlowContext';
import { setBatchSigningListRefreshHandler, suspendBatchSigningProgressPopup } from './signing/batch/batchSigningProgressUiStore';
import { useSigningBatchFlow } from './signing/batch/useSigningBatchFlow';
import SigningBatchNetworkPickerMenu from './signing/batch/SigningBatchNetworkPickerMenu.vue';
import {
  BATCH_CURRENCY_PICKER_MAX_HEIGHT,
  BATCH_CURRENCY_PICKER_WIDTH,
  BATCH_NETWORK_PICKER_CROSS_AXIS_OFFSET_PX,
} from './signing/batch/batchSigning.constants';
import type { BatchCurrencyGroup } from './signing/batch/types';
import { registerRecordDetailFlow } from './shared/recordDetailFlowContext';
import { useRecordDetailFlow } from './shared/useRecordDetailFlow';
import { registerApprovalFlow } from './approval/approvalFlowContext';
import {
  APPROVAL_BATCH_MAX,
  useApprovalFlow,
} from './approval/useApprovalFlow';
import { registerSigningFlow } from './signing/signingFlowContext';
import {
  useSigningFlow,
} from './signing/useSigningFlow';
import { useDataListSelectAllShortcut } from './shared/useDataListSelectAllShortcut';
import { useDataListSelectModeEscape } from './shared/useDataListSelectModeEscape';
import {
  closeDataListSelectMode,
  openDataListSelectMode,
} from './shared/dataListSelectMode';
import { useTasksDataListPage } from './useTasksDataListPage';
import { registerTasksDataListShellApi } from './tasksDataListShellApi';
import type {
  TasksDataListActiveSort,
  TasksDataListSortOrder,
} from './tasksDataListSort';

const props = defineProps<{
  toolbarTitle?: string;
}>();

const { ui, locale } = useAppI18n();

/** 模块菜单英文 key（兼容 ToolBar / 菜单展示文案反向解析）。 */
const menuItem = computed((): TasksDataListMenuItemLabel | string => {
  const resolved = resolveTasksDataListMenuItem(props.toolbarTitle, locale.value);
  if (resolved) return resolved;
  if (props.toolbarTitle && isTasksDataListMenuItem(props.toolbarTitle)) {
    return props.toolbarTitle;
  }
  return props.toolbarTitle ?? '';
});

const activeSort = ref<TasksDataListActiveSort | null>(null);

const customize = reactive({
  ...tasksDataListCustomizeDefaults,
  dataVolume: String(tasksDataListDefaultRowCount(props.toolbarTitle)),
}) as TasksDataListCustomizeState;

const dataListRemountKey = ref(0);

function applySentRequestDataListColumnRepair() {
  syncSentRequestDataListColumnSettings(customize);
  dataListRemountKey.value += 1;
}

/** HMR / 旧会话：补齐列配置；我发起的勿用通用 defaults 覆盖 preview 列（避免 status 污染第 2 列）。 */
onMounted(() => {
  migrateDataListColumnSettings(customize);
  if (isSentRequestDataListMenu(menuItem.value, locale.value)) {
    applySentRequestDataListColumnRepair();
  } else {
    Object.assign(customize, dataListColumnSettingDefaults());
  }
  for (const [key, value] of Object.entries(tasksDataListCustomizeDefaults)) {
    if (customize[key as keyof TasksDataListCustomizeState] === undefined) {
      (customize as Record<string, unknown>)[key] = value;
    }
  }
});

watch(
  menuItem,
  (item) => {
    customize.showExport = tasksDataListShowsExport(item);
    customize.showBatch = tasksDataListShowsBatch(item);
    activeSort.value = null;
    migrateDataListColumnSettings(customize);
    if (isSentRequestDataListMenu(item, locale.value)) {
      applySentRequestDataListColumnRepair();
    }
  },
  { immediate: true },
);
const customizeRef = computed(() => customize);

const showBatchButton = computed(() => tasksDataListShowsBatch(menuItem.value));
const showToolBarSectionForMenu = computed(() => showBatchButton.value);
const { active: listInteractionBlockActive } = useListRegionInteractionBlock();

const primaryActionLabel = computed(() => tasksDataListPrimaryActionLabel(menuItem.value));
const showActionColumn = computed(() => tasksDataListShowsActionColumn(menuItem.value));
/** 批处理（selectMode）时隐藏 Action 列；尾列由 Amount 承接。 */
const actionColumnHidden = computed(() => Boolean(customize.selectMode));
const showGeneralStructureColumn = computed(() =>
  tasksDataListShowsGeneralStructureColumn(menuItem.value),
);
const showStatusColumn = computed(() => tasksDataListShowsStatusColumn(menuItem.value));
const showCreatedTimeColumn = computed(() => tasksDataListShowsCreatedTimeColumn(menuItem.value));
/** 表头 / 单元格内容右对齐（已办 / 记录类菜单）；批处理 selectMode 保持与常态相同左对齐与列宽。 */
const amountColumnContentAlignEnd = computed(
  () => tasksDataListAmountColumnAlign(menuItem.value) === 'right',
);
const amountColumnAlign = computed(() => tasksDataListAmountColumnAlign(menuItem.value));
const statusColumnLabel = computed(() => tasksDataListStatusColumnLabel(menuItem.value));
const receiverColumnWidth = computed(() =>
  tasksDataListReceiverColumnWidth(menuItem.value),
);
const createdTimeColumnMinWidth = computed(() =>
  tasksDataListCreatedTimeColumnMinWidth(menuItem.value),
);
const createdTimeColumnDisplayOrder = computed(() =>
  tasksDataListCreatedTimeColumnDisplayOrder(menuItem.value),
);
const statusColumnMinWidth = computed(() =>
  tasksDataListStatusColumnMinWidth(menuItem.value),
);
const statusColumnWidth = computed(() =>
  tasksDataListStatusColumnWidth(menuItem.value),
);
const statusColumnDisplayOrder = computed(() =>
  tasksDataListStatusColumnDisplayOrder(menuItem.value),
);
const businessTypeColumnDisplayOrder = computed(() =>
  tasksDataListBusinessTypeColumnDisplayOrder(menuItem.value, showStatusColumn.value),
);
const receiverColumnDisplayOrder = computed(() =>
  tasksDataListReceiverColumnDisplayOrder(menuItem.value),
);
const amountColumnDisplayOrder = computed(() =>
  tasksDataListAmountColumnDisplayOrder(menuItem.value),
);
const actionColumnDisplayOrder = computed(() =>
  tasksDataListActionColumnDisplayOrder(menuItem.value),
);
const businessTypeColumnWidth = computed(() =>
  tasksDataListBusinessTypeColumnWidth(menuItem.value),
);
const businessTypeColumnShowsComboHeader = computed(() =>
  tasksDataListBusinessTypeColumnShowsComboHeader(menuItem.value),
);
const businessTypeColumnSecondaryLabel = computed(() =>
  tasksDataListBusinessTypeColumnSecondaryLabel(menuItem.value),
);
const businessTypeColumnSecondarySortable = computed(() =>
  tasksDataListBusinessTypeColumnSecondarySortable(menuItem.value),
);
/** Sent Request 第 1–4 列（金额 / 业务类型 / 接收方 / 发送方）无固定 width，均分剩余空间。 */
const amountColumnFlexGrow = computed(() =>
  tasksDataListAmountColumnFlexGrow(menuItem.value),
);
const generalStructureColumnMinWidth = computed(() =>
  tasksDataListGeneralStructureColumnMinWidth(menuItem.value),
);
const amountColumnMinWidth = computed(() =>
  tasksDataListAmountColumnMinWidth(menuItem.value),
);

const isApprovalMenu = computed(() => menuItem.value === 'Approval');
const isSigningMenu = computed(() => menuItem.value === 'Signing');
const isSentRequestMenu = computed(
  () =>
    isSentRequestDataListMenu(menuItem.value, locale.value)
    || isSentRequestDataListMenu(props.toolbarTitle, locale.value),
);

const isRecordMenu = computed(() => {
  const title = menuItem.value;
  return (
    title === 'Approved'
    || title === 'Signed'
    || title === 'All Records'
    || isSentRequestDataListMenu(menuItem.value, locale.value)
  );
});

const batchSelectedCount = ref(0);
const dataListRef = ref<ComponentPublicInstance | null>(null);

function requestCloseDataListSelectMode() {
  closeDataListSelectMode(dataListRef, () => {
    customize.selectMode = false;
  });
}

function requestOpenDataListSelectMode() {
  openDataListSelectMode(dataListRef, () => {
    customize.selectMode = true;
  });
}

/** 批处理成功退出时 remount，避免勾选列退出动画与 Refresh 叠加。 */

const listToastText = ref('');
const listToastType = ref<'result' | 'danger'>('result');
const listToastKeepMounted = ref(false);
const listToastMotionActive = ref(false);
const showEndFeedback = ref(false);
const endFeedbackKey = ref(0);
const endFeedbackText = ref('Success');
let listToastTimer: ReturnType<typeof setTimeout> | undefined;
let listToastLeaveTimer: ReturnType<typeof setTimeout> | undefined;
let endFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

function readListToastLeaveMs(el: HTMLElement): number {
  const probe = document.createElement('div');
  probe.className = 'motion-flotation';
  el.appendChild(probe);
  const seconds = Number.parseFloat(getComputedStyle(probe).transitionDuration);
  el.removeChild(probe);
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : 300;
}

function clearListToastLeaveTimer() {
  if (listToastLeaveTimer !== undefined) {
    clearTimeout(listToastLeaveTimer);
    listToastLeaveTimer = undefined;
  }
}

function syncListToastMotionEnter() {
  clearListToastLeaveTimer();
  listToastKeepMounted.value = true;
  listToastMotionActive.value = false;
  nextTick(() => {
    requestAnimationFrame(() => {
      if (listToastKeepMounted.value) {
        listToastMotionActive.value = true;
      }
    });
  });
}

function hideListToast() {
  listToastMotionActive.value = false;
  const anchor = document.querySelector('.app-preview') ?? document.documentElement;
  const leaveMs = readListToastLeaveMs(anchor as HTMLElement);
  clearListToastLeaveTimer();
  listToastLeaveTimer = window.setTimeout(() => {
    listToastKeepMounted.value = false;
    listToastLeaveTimer = undefined;
  }, leaveMs);
}

function showListToast(message: string, type: 'result' | 'danger' = 'result') {
  listToastType.value = type;
  listToastText.value = ui(message);
  syncListToastMotionEnter();
  if (listToastTimer !== undefined) clearTimeout(listToastTimer);
  listToastTimer = window.setTimeout(() => {
    hideListToast();
    listToastTimer = undefined;
  }, 3000);
}

function showListError(message: string) {
  showListToast(message, 'result');
}

function showListSuccess(messageKey = 'Success') {
  endFeedbackText.value = ui(messageKey);
  endFeedbackKey.value += 1;
  showEndFeedback.value = true;
  if (endFeedbackTimer !== undefined) clearTimeout(endFeedbackTimer);
  endFeedbackTimer = window.setTimeout(() => {
    showEndFeedback.value = false;
    endFeedbackTimer = undefined;
  }, 2500);
}

const allRowIndexes = computed(() => {
  const count = Number.parseInt(
    String(customize.dataVolume ?? tasksDataListDefaultRowCount(menuItem.value)),
    10,
  );
  return Array.from({ length: Math.max(0, count) }, (_, index) => index);
});

const approvalFlow = useApprovalFlow({
  enabled: isApprovalMenu,
  allRowIndexes,
  selectMode: toRef(customize, 'selectMode'),
  onRefreshList: () => {
    void nextTick(() => {
      onToolbarActionClick('refresh');
    });
  },
  onExitBatchMode: () => {
    customize.selectMode = false;
    dataListRemountKey.value += 1;
  },
  showError: (message) => showListError(message),
  showSuccess: (message) => showListSuccess(message),
});

const signingBatchFlow = useSigningBatchFlow({
  enabled: isSigningMenu,
  allRowIndexes,
  selectMode: toRef(customize, 'selectMode'),
  closeDataListSelect: requestCloseDataListSelectMode,
  openDataListSelect: requestOpenDataListSelectMode,
  onRefreshList: () => {
    void nextTick(() => {
      onToolbarActionClick('refresh');
    });
  },
  onExitBatchMode: () => {
    customize.selectMode = false;
    dataListRemountKey.value += 1;
  },
  showError: (message) => showListError(message),
  showSuccess: () => showListSuccess(),
});

const signingFlow = useSigningFlow({
  enabled: isSigningMenu,
  allRowIndexes,
  onRefreshList: () => {
    void nextTick(() => {
      onToolbarActionClick('refresh');
    });
  },
  onExitBatchMode: () => {
    customize.selectMode = false;
    dataListRemountKey.value += 1;
  },
  showError: (message) => showListError(message),
  showSuccess: (message) => showListSuccess(message),
});

const recordDetailFlow = useRecordDetailFlow({
  menuItem,
  allRowIndexes,
  onWithdrawRequest: () => {
    listToastText.value = ui('Request withdrawn');
    syncListToastMotionEnter();
    if (listToastTimer !== undefined) clearTimeout(listToastTimer);
    listToastTimer = window.setTimeout(() => {
      hideListToast();
      listToastTimer = undefined;
    }, 3000);
  },
});

function onDataListSelectedChange(rows: Array<Record<string, unknown> & { _index: number }>) {
  batchSelectedCount.value = rows.length;
  if (isApprovalMenu.value) {
    approvalFlow.onSelectedChange(rows);
  }
  if (isSigningMenu.value) {
    signingBatchFlow.onSelectedChange(rows);
  }
}

async function handleBatchLabelBeforeOpen(
  key: string,
  rows: Array<Record<string, unknown> & { _index: number }>,
) {
  if (isApprovalMenu.value) {
    if (rows.length > APPROVAL_BATCH_MAX) {
      throw new Error(`You can select up to ${APPROVAL_BATCH_MAX} items at a time.`);
    }
    await approvalFlow.prepareBatchRemarkOpen(key, rows);
    return;
  }
  if (isSigningMenu.value) {
    if (key === 'reject') {
      await signingBatchFlow.prepareBatchRejectAction(rows);
      return;
    }
  }
}

async function handleBatchAction(
  key: string,
  rows: Array<Record<string, unknown> & { _index: number }>,
) {
  if (isApprovalMenu.value) {
    if (rows.length > APPROVAL_BATCH_MAX) {
      throw new Error(`You can select up to ${APPROVAL_BATCH_MAX} items at a time.`);
    }
    approvalFlow.confirmBatchRemark();
    return { preserveSelection: true };
  }
  if (isSigningMenu.value) {
    if (key === 'reject') {
      signingBatchFlow.confirmBatchRejectRemark();
    } else if (key === 'pass') {
      signingBatchFlow.openBatchSignConfirm(rows);
    }
    return { preserveSelection: true };
  }
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 1200);
  });
}

const {
  DATA_LIST_FIGMA_PAGINER,
  batchButton,
  columnHeight,
  currentPage,
  dataListBatchActions,
  firstPagination,
  goFirstPage,
  goLastPage,
  goNextPage,
  goPrevPage,
  isManyPageSelected,
  isManyPagination,
  lastPagination,
  manyPageItems,
  nextNavDisabled,
  nextPagination,
  onBatchAction,
  onManyPageItemClick,
  onSettingsJump,
  onToolbarActionClick,
  paginatedDataList,
  pagePagination,
  prevNavDisabled,
  prevPagination,
  previewColumnSettings,
  settingsJumpValue,
  settingsLevelIndex,
  showBack,
  showBatch,
  showPaginerStatistics,
  showToolBarOperation,
  showToolBarSection,
  skidOpen,
  skidContentLocked,
  statisticsItems,
  toolbarActionButtons,
  totalRowCount,
} = useTasksDataListPage(
  customizeRef,
  undefined,
  activeSort,
  handleBatchAction,
  computed(() => {
    if (!isSigningMenu.value || !customize.selectMode) return null;
    return (row: Record<string, unknown>) =>
      !signingBatchFlow.shouldFilterRow(Number(row.id));
  }),
);

const listRegionRef = ref<HTMLElement | null>(null);

/** 数据翻页后列表回顶（与 DataList loading 刷新一致，避免沿用上一页 scrollTop）。 */
function scrollDataListToTop() {
  const region = listRegionRef.value;
  if (!region) return;
  const scrollEl = region.querySelector('[class*="tableContentScroll"]') as HTMLElement | null;
  if (scrollEl) scrollEl.scrollTop = 0;
}

watch(currentPage, () => {
  void nextTick(scrollDataListToTop);
});

const receiverColumnAlign = computed(
  (): 'left' | 'center' | 'right' => previewColumnSettings.value[2].align,
);

/** 批处理 selectMode：发送方（第四列）表头与单元格右对齐。 */
const businessTypeColumnAlign = computed((): 'left' | 'center' | 'right' =>
  customize.selectMode ? 'right' : previewColumnSettings.value[3].align,
);

const businessTypeColumnMinWidth = computed(() =>
  tasksDataListBusinessTypeColumnMinWidth(
    menuItem.value,
    previewColumnSettings.value[3].minWidth,
  ),
);
const receiverColumnMinWidth = computed(() =>
  tasksDataListReceiverColumnMinWidth(
    menuItem.value,
    previewColumnSettings.value[2].minWidth,
  ),
);

watch(isApprovalMenu, (enabled) => {
  registerApprovalFlow(enabled ? approvalFlow : null);
  if (!enabled && customize.selectMode) {
    requestCloseDataListSelectMode();
  }
});

watch(isSigningMenu, () => {
  registerSigningFlow(isSigningMenu.value ? signingFlow : null);
  registerSigningBatchFlow(isSigningMenu.value ? signingBatchFlow : null);
  if (!isSigningMenu.value && customize.selectMode) {
    requestCloseDataListSelectMode();
  }
  if (!isSigningMenu.value) {
    setSigningBatchSelectModeActive(false);
  }
});

watch(
  () => Boolean(isSigningMenu.value && customize.selectMode),
  (active, wasActive) => {
    if (wasActive && !active) {
      closeAllAnchoredTooltips();
    }
    setSigningBatchSelectModeActive(active);
  },
  { immediate: true },
);

watch(isRecordMenu, (enabled) => {
  registerRecordDetailFlow(enabled ? recordDetailFlow : null);
});

function refreshListFromToolbar() {
  void nextTick(() => {
    onToolbarActionClick('refresh');
  });
}

onMounted(() => {
  registerTasksDataListShellApi({
    setListEmpty: (empty) => {
      if (empty) {
        customize.loading = false;
      }
      customize.empty = empty;
    },
    setListLoading: (loading) => {
      customize.loading = loading;
    },
    showDangerToast: (message) => {
      showListToast(message, 'danger');
    },
    showSuccessFeedback: (messageKey) => {
      showListSuccess(messageKey);
    },
  });
  if (isApprovalMenu.value) registerApprovalFlow(approvalFlow);
  if (isSigningMenu.value) {
    registerSigningFlow(signingFlow);
    registerSigningBatchFlow(signingBatchFlow);
  }
  if (isRecordMenu.value) registerRecordDetailFlow(recordDetailFlow);
  setBatchSigningListRefreshHandler(refreshListFromToolbar);
});

onBeforeUnmount(() => {
  registerTasksDataListShellApi(null);
  suspendBatchSigningProgressPopup();
  setSigningBatchSelectModeActive(false);
  registerApprovalFlow(null);
  registerSigningFlow(null);
  registerSigningBatchFlow(null);
  registerRecordDetailFlow(null);
  setBatchSigningListRefreshHandler(null);
  if (listToastTimer !== undefined) clearTimeout(listToastTimer);
  clearListToastLeaveTimer();
  if (endFeedbackTimer !== undefined) clearTimeout(endFeedbackTimer);
});

function onRowPrimaryAction(row: Record<string, unknown>) {
  if (customize.selectMode) return;
  if (isApprovalMenu.value) {
    approvalFlow.openDetailForRow(row);
    return;
  }
  if (isSigningMenu.value) {
    signingFlow.openDetailForRow(row);
  }
}

function onRowClick(row: Record<string, unknown>) {
  if (customize.selectMode) return;
  if (isRecordMenu.value) {
    recordDetailFlow.openDetailForRow(row);
  }
}

function onBatchError(message: string) {
  showListError(message);
}

function onBatchPopoverDismiss() {
  if (isApprovalMenu.value) {
    approvalFlow.remark.value = '';
  }
  if (isSigningMenu.value) {
    signingBatchFlow.remark.value = '';
  }
}

const displayToolbarTitle = computed(() => {
  const title = menuItem.value ?? DATA_LIST_FIGMA_TOOLBAR.title;
  return ui(resolveTasksModuleMenuDisplayLabel(title, locale.value));
});

watch(
  () => Boolean(isSigningMenu.value && customize.selectMode),
  (active, wasActive) => {
    if (active && !wasActive) {
      goFirstPage();
    }
  },
);

const signingBatchUsesNetworkFlotation = computed(() =>
  isSigningMenu.value && signingBatchFlow.shouldUseNetworkPickerFlotation(),
);

function onToolbarBatchClick() {
  if (isSigningMenu.value) {
    signingBatchFlow.onBatchButtonClick();
    return;
  }
  if (customize.selectMode) {
    requestCloseDataListSelectMode();
    return;
  }
  requestOpenDataListSelectMode();
}

function onSigningBatchCurrencyProcess(group: BatchCurrencyGroup, close: () => void) {
  close();
  signingBatchFlow.onCurrencyGroupProcess(group);
}

const createdTimeSortOrder = computed(() =>
  activeSort.value?.key === 'created-time' ? activeSort.value.order : '',
);
const amountSortOrder = computed(() =>
  activeSort.value?.key === 'amount' ? activeSort.value.order : '',
);

function onCreatedTimeSort(order: TasksDataListSortOrder | null) {
  activeSort.value = order ? { key: 'created-time', order } : null;
  goFirstPage();
}

function onAmountSort(order: TasksDataListSortOrder | null) {
  activeSort.value = order ? { key: 'amount', order } : null;
  goFirstPage();
}

/** 批处理过滤已在 useTasksDataListPage.sortedDataList 全量应用，勿再滤当前页。 */
const displayDataList = computed(() => paginatedDataList.value);

useDataListSelectAllShortcut({
  selectMode: computed(() => Boolean(customize.selectMode)),
  dataListRef,
  pageRowCount: computed(() => displayDataList.value.length),
  selectedCount: computed(() => batchSelectedCount.value),
});

useDataListSelectModeEscape({
  selectMode: computed(() => Boolean(customize.selectMode)),
  closeSelectMode: requestCloseDataListSelectMode,
  dataListRef,
  enabled: showBatchButton,
});

const displayPrimaryActionLabel = computed(() => {
  const label = primaryActionLabel.value;
  if (label === DATA_LIST_PRIMARY_ACTION_LABEL) {
    return locale.value === 'zh-CN' || locale.value === 'zh-TW'
      ? ui(label)
      : DATA_LIST_PRIMARY_ACTION_LABEL_EN;
  }
  return ui(label);
});
const displayStatusColumnLabel = computed(() => ui(statusColumnLabel.value));
const displayBusinessTypeSecondaryLabel = computed(() =>
  ui(businessTypeColumnSecondaryLabel.value),
);
const displayPaginerTotal = computed(() => ui(DATA_LIST_FIGMA_PAGINER.dataVolumeTotal));
const displayPaginerResults = computed(() => ui(DATA_LIST_FIGMA_PAGINER.dataVolumeResults));
const displayStatisticsItems = computed(() =>
  statisticsItems.value.map((item) => ({
    ...item,
    text: ui(item.text),
    number: formatGroupedNumber(item.number),
  })),
);
const displayBatchActions = computed(() => {
  const actions = isApprovalMenu.value
    ? [
        { key: 'reject', label: 'Reject', danger: true, popover: true, popoverTitle: 'Batch Rejection' },
        { key: 'pass', label: 'Pass', popover: true, popoverTitle: 'Batch Approve' },
      ]
    : isSigningMenu.value
      ? [
          { key: 'reject', label: 'Reject', danger: true, popover: true, popoverTitle: 'Batch Rejection' },
          { key: 'pass', label: 'Sign' },
        ]
      : dataListBatchActions;
  return actions.map((action) => ({
    ...action,
    label: ui(action.label),
    popoverTitle: 'popoverTitle' in action && action.popoverTitle ? ui(action.popoverTitle) : undefined,
  }));
});

</script>

<template>
  <div :class="pageStyles.dataListNest">
    <EgLayout type="empty" show-toolbar show-paginer>
      <template #toolbar>
        <EgToolBar
          :title="displayToolbarTitle"
          :show-back="showBack"
          :show-operation="showToolBarOperation"
          :show-divider="DATA_LIST_FIGMA_TOOLBAR.showDivider"
          :show-section="showToolBarSectionForMenu"
        >
          <template v-if="showBatchButton" #functional>
            <EgFlotation
              v-if="signingBatchUsesNetworkFlotation"
              :key="`signing-batch-currency-${signingBatchFlow.currencyGroups.value.length}`"
              placement="bottom"
              align="end"
              width-mode="fixed"
              :width="BATCH_CURRENCY_PICKER_WIDTH"
              height-mode="adaptive"
              :max-height="BATCH_CURRENCY_PICKER_MAX_HEIGHT"
              :cross-axis-offset="BATCH_NETWORK_PICKER_CROSS_AXIS_OFFSET_PX"
              :show-add="false"
              :show-menu-divider="false"
              boundary-selector=".app-preview"
              flip
              close-on-scroll
              :disabled="skidContentLocked || batchButton.disabled"
            >
              <template #trigger="{ expanded }">
                <!--
                  勿把整颗 EgIconButtonPro（button）放进 #trigger：
                  AnchoredTooltip 会优先量到 button，主轴锚在含文案的 48×38 上。
                  仅 iconSlot 标 data-eds-trigger-metrics；文案仍在 trigger 内可点。
                -->
                <span
                  :class="[
                    pageStyles.batchProTriggerRoot,
                    (skidContentLocked || batchButton.disabled) && pageStyles.batchProTriggerDisabled,
                    expanded && pageStyles.batchFlotationTriggerExpanded,
                  ]"
                >
                  <span
                    data-eds-trigger-metrics
                    :class="pageStyles.batchProIconSlot"
                    :aria-expanded="expanded"
                  >
                    <EgIconButton
                      as="span"
                      shape="rectangular"
                      size="sm"
                      :label="ui(batchButton.label)"
                      :disabled="skidContentLocked || batchButton.disabled"
                    >
                      <EgIcon :name="batchButton.icon" size="sm" />
                    </EgIconButton>
                    <span
                      v-if="batchButton.showBadge"
                      :class="pageStyles.batchProBadge"
                      aria-hidden="true"
                    >
                      <span :class="pageStyles.batchProBadgeText">
                        {{ formatGroupedNumber(batchButton.badge) }}
                      </span>
                    </span>
                    <span
                      v-else-if="batchButton.showReddot"
                      :class="pageStyles.batchProReddot"
                      aria-hidden="true"
                    />
                  </span>
                  <span :class="pageStyles.batchProLabelWrap">
                    <span :class="pageStyles.batchProLabelPaint" aria-hidden="true">
                      {{ ui(batchButton.label) }}
                    </span>
                    <span :class="pageStyles.batchProLabelSizer">
                      {{ ui(batchButton.label) }}
                    </span>
                  </span>
                </span>
              </template>
              <template #content="{ close }">
                <SigningBatchNetworkPickerMenu
                  :groups="signingBatchFlow.currencyGroups.value"
                  @process="onSigningBatchCurrencyProcess($event, close)"
                />
              </template>
            </EgFlotation>
            <EgIconButtonPro
              v-else
              :label="ui(batchButton.label)"
              :badge="batchButton.badge"
              :show-badge="batchButton.showBadge"
              :show-reddot="batchButton.showReddot"
              :disabled="skidContentLocked || batchButton.disabled"
              @click="onToolbarBatchClick"
            >
              <EgIcon :name="batchButton.icon" size="sm" />
            </EgIconButtonPro>
          </template>
          <template v-if="showToolBarSectionForMenu" #section>
            <EgIconButtonPro
              v-for="button in toolbarActionButtons"
              :key="button.key"
              :label="ui(button.item.label)"
              :badge="button.item.badge"
              :show-badge="button.item.showBadge"
              :show-reddot="button.item.showReddot"
              :disabled="skidContentLocked || button.item.disabled"
              @click="onToolbarActionClick(button.key)"
            >
              <EgIcon :name="button.item.icon" size="sm" />
            </EgIconButtonPro>
          </template>
          <template v-else #functional>
            <EgIconButtonPro
              v-for="button in toolbarActionButtons"
              :key="`functional-${button.key}`"
              :label="ui(button.item.label)"
              :badge="button.item.badge"
              :show-badge="button.item.showBadge"
              :show-reddot="button.item.showReddot"
              :disabled="skidContentLocked || button.item.disabled"
              @click="onToolbarActionClick(button.key)"
            >
              <EgIcon :name="button.item.icon" size="sm" />
            </EgIconButtonPro>
          </template>
        </EgToolBar>
      </template>

      <div ref="listRegionRef" :class="pageStyles.listRegion">
        <div
          v-if="listInteractionBlockActive"
          :class="pageStyles.listInteractionBlocker"
          aria-hidden="true"
        />
        <EgDataList
          ref="dataListRef"
          :key="`tasks-datalist-${menuItem}-${dataListRemountKey}`"
          v-model:select-mode="customize.selectMode"
          :data-list="displayDataList"
          :header-height="DATA_LIST_FIGMA_HEADER_HEIGHT"
          :column-height="columnHeight"
          :loading="Boolean(customize.loading)"
          :initing="Boolean(customize.initing)"
          :skid-open="skidOpen"
          :batch-actions="displayBatchActions"
          :on-batch-action="onBatchAction"
          :on-batch-label-before-open="handleBatchLabelBeforeOpen"
          batch-popover-width-mode="fixed"
          :batch-popover-width="POPOVER_PRESET_WIDTH_BASE"
          batch-popover-top-tool
          batch-popover-top-tool-closable
          :primary-action="
            showActionColumn && !actionColumnHidden
              ? { label: displayPrimaryActionLabel }
              : undefined
          "
          @primary-action="onRowPrimaryAction"
          @row-click="onRowClick"
          @batch-error="onBatchError"
          @batch-popover-dismiss="onBatchPopoverDismiss"
          @selected-change="onDataListSelectedChange"
          :batch-count-suffix="ui('Selected')"
        >
          <template
            v-if="isApprovalMenu || isSigningMenu"
            #batch-popover="{ selectedCount, confirm, close }"
          >
            <ApprovalRemarkPopoverPanel
              v-if="isApprovalMenu"
              :selected-count="selectedCount"
              :remark="approvalFlow.remark.value"
              placeholder-key="Please enter remark"
              @update:remark="approvalFlow.remark.value = $event"
              @confirm="confirm"
              @cancel="close"
            />
            <ApprovalRemarkPopoverPanel
              v-else
              :selected-count="selectedCount"
              :remark="signingBatchFlow.remark.value"
              placeholder-key="Please enter remark"
              @update:remark="signingBatchFlow.remark.value = $event"
              @confirm="confirm"
              @cancel="close"
            />
          </template>
          <!-- 我发起的：列须为 EgDataList 直接子节点；用 hidden 替代 v-if，避免 production 下列槽错绑。 -->
          <EgDataListColumn
            key="sent-request-amount"
            :hidden="!isSentRequestMenu"
            prop="amount"
              :label="ui('Amount')"
              :min-width="amountColumnMinWidth"
              :flex-grow="true"
              align="left"
              :sortable="false"
              :display-order="1"
            >
              <template #header>
                <div :class="pageStyles.comboHeader">
                  <div :class="pageStyles.comboHeaderSegment">
                    <div :class="pageStyles.comboHeaderSegmentTextWrap">
                      <EgDataListCellOverflow
                        :content-class="pageStyles.comboHeaderSegmentText"
                        context="header"
                      >
                        {{ ui('Amount') }}
                      </EgDataListCellOverflow>
                    </div>
                    <DataListHeaderSortTrigger
                      label="Amount"
                      :active-order="amountSortOrder"
                      @sort-change="onAmountSort"
                    />
                  </div>
                  <EgDivider type="navigator" direction="vertical" />
                  <div :class="pageStyles.comboHeaderSegment">
                    <div :class="pageStyles.comboHeaderSegmentTextWrap">
                      <EgDataListCellOverflow
                        :content-class="pageStyles.comboHeaderSegmentText"
                        context="header"
                      >
                        {{ ui('Created Time') }}
                      </EgDataListCellOverflow>
                    </div>
                    <DataListHeaderSortTrigger
                      label="Created Time"
                      :active-order="createdTimeSortOrder"
                      @sort-change="onCreatedTimeSort"
                    />
                  </div>
                </div>
              </template>
              <template #default="{ data }">
                <SentRequestAmountListCell
                  :column-min-width="amountColumnMinWidth"
                  :menu-item="menuItem"
                  :row-index="Number(data.id)"
                />
              </template>
            </EgDataListColumn>

            <EgDataListColumn
              key="sent-request-operation-type"
              :hidden="!isSentRequestMenu"
              prop="operationType"
              :label="ui('Operation Type')"
              :min-width="createdTimeColumnMinWidth"
              :flex-grow="true"
              align="left"
              :sortable="false"
              :display-order="2"
            >
              <template #header>
                <div :class="pageStyles.comboHeaderSegment">
                  <div :class="pageStyles.comboHeaderSegmentTextWrap">
                    <EgDataListCellOverflow
                      :content-class="pageStyles.comboHeaderSegmentText"
                      context="header"
                    >
                      {{ ui('Operation Type') }}
                    </EgDataListCellOverflow>
                  </div>
                </div>
              </template>
              <template #default="{ data }">
                <SentRequestOperationTypeListCell
                  :column-min-width="createdTimeColumnMinWidth"
                  :menu-item="menuItem"
                  :row-index="Number(data.id)"
                />
              </template>
            </EgDataListColumn>

            <EgDataListColumn
              key="sent-request-receiver"
              :hidden="!isSentRequestMenu"
              prop="receiver"
              :label="ui('Receiver')"
              :min-width="receiverColumnMinWidth"
              :flex-grow="true"
              :align="receiverColumnAlign"
              :sortable="false"
              :display-order="3"
            >
              <template #default="{ data }">
                <SentRequestReceiverListCell
                  :column-min-width="receiverColumnMinWidth"
                  :column-align="receiverColumnAlign"
                  :menu-item="menuItem"
                  :row-index="Number(data.id)"
                />
              </template>
            </EgDataListColumn>

            <EgDataListColumn
              key="sent-request-sender"
              :hidden="!isSentRequestMenu"
              prop="sender"
              :label="ui('Sender')"
              :min-width="businessTypeColumnMinWidth"
              :flex-grow="true"
              align="left"
              :sortable="false"
              :display-order="4"
            >
              <template #default="{ data }">
                <SentRequestSenderListCell
                  :column-min-width="businessTypeColumnMinWidth"
                  :menu-item="menuItem"
                  :row-index="Number(data.id)"
                />
              </template>
            </EgDataListColumn>

            <EgDataListColumn
              key="sent-request-status"
              :hidden="!isSentRequestMenu"
              prop="status"
              :label="ui('Approval Progress')"
              :min-width="statusColumnMinWidth"
              :width="statusColumnWidth"
              :display-order="8"
              align="right"
              :sortable="false"
            >
              <template #default="{ data }">
                <SentRequestStatusListCell
                  :column-min-width="statusColumnMinWidth"
                  :menu-item="menuItem"
                  :row-index="Number(data.id)"
                />
              </template>
            </EgDataListColumn>

          <EgDataListColumn
            v-if="showGeneralStructureColumn"
            prop="submitter"
            :label="ui(previewColumnSettings[0].label)"
            :min-width="generalStructureColumnMinWidth"
            :align="previewColumnSettings[0].align"
            :sortable="false"
          >
            <template #header>
              <div :class="pageStyles.comboHeader">
                <div :class="pageStyles.comboHeaderSegment">
                  <div :class="pageStyles.comboHeaderSegmentTextWrap">
                    <EgDataListCellOverflow
                      :content-class="pageStyles.comboHeaderSegmentText"
                      context="header"
                    >
                      {{ ui(previewColumnSettings[0].label) }}
                    </EgDataListCellOverflow>
                  </div>
                  <DataListHeaderSortTrigger
                    v-if="previewColumnSettings[0].sortable"
                    :label="previewColumnSettings[0].label"
                  />
                </div>
                <EgDivider type="navigator" direction="vertical" />
                <div :class="pageStyles.comboHeaderSegment">
                  <div :class="pageStyles.comboHeaderSegmentTextWrap">
                    <EgDataListCellOverflow
                      :content-class="pageStyles.comboHeaderSegmentText"
                      context="header"
                    >
                      {{ ui(previewColumnSettings[0].secondaryLabel ?? '') }}
                    </EgDataListCellOverflow>
                  </div>
                  <DataListHeaderSortTrigger
                    v-if="previewColumnSettings[0].secondarySortable"
                    :label="previewColumnSettings[0].secondaryLabel ?? ''"
                    :active-order="createdTimeSortOrder"
                    @sort-change="onCreatedTimeSort"
                  />
                </div>
              </div>
            </template>
            <template #default="{ data }">
              <TasksDataListColumnCell
                :data-source="previewColumnSettings[0].dataSource"
                :column-min-width="generalStructureColumnMinWidth"
                :row-index="Number(data.id)"
              />
            </template>
          </EgDataListColumn>

          <EgDataListColumn
            v-if="!isSentRequestMenu"
            prop="amount"
            :label="ui(previewColumnSettings[1].label)"
            :min-width="amountColumnMinWidth"
            :flex-grow="amountColumnFlexGrow"
            :align="amountColumnAlign"
            :sortable="false"
            :display-order="amountColumnDisplayOrder"
          >
            <template #header>
              <div
                :class="[
                  pageStyles.comboHeader,
                  amountColumnContentAlignEnd && pageStyles.comboHeaderAlignEnd,
                ]"
              >
                <div :class="pageStyles.comboHeaderSegment">
                  <div :class="pageStyles.comboHeaderSegmentTextWrap">
                    <EgDataListCellOverflow
                      :content-class="pageStyles.comboHeaderSegmentText"
                      context="header"
                    >
                      {{ ui(previewColumnSettings[1].label) }}
                    </EgDataListCellOverflow>
                  </div>
                  <DataListHeaderSortTrigger
                    :label="previewColumnSettings[1].label"
                    :active-order="amountSortOrder"
                    @sort-change="onAmountSort"
                  />
                </div>
                <EgDivider type="navigator" direction="vertical" />
                <div :class="pageStyles.comboHeaderSegment">
                  <div :class="pageStyles.comboHeaderSegmentTextWrap">
                    <EgDataListCellOverflow
                      :content-class="pageStyles.comboHeaderSegmentText"
                      context="header"
                    >
                      {{ ui(previewColumnSettings[1].secondaryLabel ?? '') }}
                    </EgDataListCellOverflow>
                  </div>
                  <DataListHeaderSortTrigger
                    v-if="previewColumnSettings[1].secondarySortable"
                    :label="previewColumnSettings[1].secondaryLabel ?? ''"
                    :active-order="createdTimeSortOrder"
                    @sort-change="onCreatedTimeSort"
                  />
                </div>
              </div>
            </template>
            <template #default="{ data }">
              <TasksDataListColumnCell
                :data-source="previewColumnSettings[1].dataSource"
                :column-min-width="amountColumnMinWidth"
                :column-align="amountColumnContentAlignEnd ? 'right' : 'left'"
                :menu-item="menuItem"
                :row-index="Number(data.id)"
              />
            </template>
          </EgDataListColumn>

          <EgDataListColumn
            v-if="!isSentRequestMenu"
            prop="receiver"
            :label="ui(previewColumnSettings[2].label)"
            :min-width="receiverColumnMinWidth"
            :width="receiverColumnWidth"
            :align="receiverColumnAlign"
            :sortable="false"
            :display-order="receiverColumnDisplayOrder"
          >
            <template #default="{ data }">
              <TasksDataListColumnCell
                data-source="receiver"
                :column-min-width="receiverColumnMinWidth"
                :column-align="receiverColumnAlign"
                :menu-item="menuItem"
                :row-index="Number(data.id)"
              />
            </template>
          </EgDataListColumn>

          <EgDataListColumn
            v-if="!isSentRequestMenu"
            prop="businessType"
            :label="ui(previewColumnSettings[3].label)"
            :min-width="businessTypeColumnMinWidth"
            :width="businessTypeColumnWidth"
            :align="businessTypeColumnAlign"
            :sortable="false"
            :display-order="businessTypeColumnDisplayOrder"
          >
            <template v-if="businessTypeColumnShowsComboHeader" #header>
              <div :class="pageStyles.comboHeader">
                <div :class="pageStyles.comboHeaderSegment">
                  <div :class="pageStyles.comboHeaderSegmentTextWrap">
                    <EgDataListCellOverflow
                      :content-class="pageStyles.comboHeaderSegmentText"
                      context="header"
                    >
                      {{ ui(previewColumnSettings[3].label) }}
                    </EgDataListCellOverflow>
                  </div>
                </div>
                <EgDivider type="navigator" direction="vertical" />
                <div :class="pageStyles.comboHeaderSegment">
                  <div :class="pageStyles.comboHeaderSegmentTextWrap">
                    <EgDataListCellOverflow
                      :content-class="pageStyles.comboHeaderSegmentText"
                      context="header"
                    >
                      {{ displayBusinessTypeSecondaryLabel }}
                    </EgDataListCellOverflow>
                  </div>
                  <DataListHeaderSortTrigger
                    v-if="businessTypeColumnSecondarySortable"
                    :label="businessTypeColumnSecondaryLabel"
                    :active-order="createdTimeSortOrder"
                    @sort-change="onCreatedTimeSort"
                  />
                </div>
              </div>
            </template>
            <template #default="{ data }">
              <TasksDataListColumnCell
                :data-source="previewColumnSettings[3].dataSource"
                :column-min-width="businessTypeColumnMinWidth"
                :column-align="businessTypeColumnAlign"
                :menu-item="menuItem"
                :row-index="Number(data.id)"
              />
            </template>
          </EgDataListColumn>

          <EgDataListColumn
            v-if="!isSentRequestMenu && showStatusColumn"
            prop="status"
            :label="displayStatusColumnLabel"
            :min-width="statusColumnMinWidth"
            :width="statusColumnWidth"
            :display-order="statusColumnDisplayOrder"
            align="right"
            :sortable="false"
          >
            <template #default="{ data }">
              <TasksDataListColumnCell
                data-source="status"
                :column-min-width="statusColumnMinWidth"
                column-align="right"
                :menu-item="menuItem"
                :row-index="Number(data.id)"
              />
            </template>
          </EgDataListColumn>

          <EgDataListColumn
            v-if="showActionColumn"
            prop="actions"
            :label="ui(previewColumnSettings[4].label)"
            :min-width="previewColumnSettings[4].minWidth"
            align="right"
            :sortable="false"
            :hidden="actionColumnHidden"
            :display-order="actionColumnDisplayOrder"
            is-action
          />
        </EgDataList>
      </div>

      <template #paginer>
        <EgPaginer
          v-model:settings-level-index="settingsLevelIndex"
          v-model:settings-jump-value="settingsJumpValue"
          :show-statistics="showPaginerStatistics"
          :statistics-collapse="Boolean(customize.statisticsCollapse)"
          :statistics-items="displayStatisticsItems"
          :data-volume-total="displayPaginerTotal"
          :data-volume-count="String(totalRowCount)"
          :data-volume-results="displayPaginerResults"
          :settings-level-labels="[...DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS]"
          :settings-level-label="ui('Items Per Page')"
          :settings-jump-label="ui('Go to Page')"
          :settings-jump-placeholder="ui('Please Enter')"
          @settings-jump="onSettingsJump"
        >
          <EgPaginationItem
            :kind="firstPagination.kind"
            :tone="firstPagination.tone"
            :disabled="prevNavDisabled || firstPagination.disabled"
            @click="goFirstPage"
          >
            <EgIcon name="eds-arrow-go-first" fit />
          </EgPaginationItem>
          <EgPaginationItem
            :kind="prevPagination.kind"
            :tone="prevPagination.tone"
            :disabled="prevNavDisabled || prevPagination.disabled"
            @click="goPrevPage"
          >
            <EgIcon name="eds-arrow-left-mini-ios" fit />
          </EgPaginationItem>
          <template v-if="!isManyPagination">
            <EgPaginationItem
              :kind="pagePagination.kind"
              :tone="pagePagination.tone"
              selected
              :disabled="pagePagination.disabled"
              :label="String(currentPage)"
            />
          </template>
          <template v-else>
            <EgPaginationItem
              v-for="(item, index) in manyPageItems"
              :key="`${item.kind}-${item.label}-${index}`"
              :kind="pagePagination.kind"
              :tone="pagePagination.tone"
              :interactive="item.kind !== 'ellipsis'"
              :selected="isManyPageSelected(item, index)"
              :disabled="pagePagination.disabled"
              :label="item.label"
              @click="onManyPageItemClick(item)"
            />
          </template>
          <EgPaginationItem
            :kind="nextPagination.kind"
            :tone="nextPagination.tone"
            :disabled="nextNavDisabled || nextPagination.disabled"
            @click="goNextPage"
          >
            <EgIcon name="eds-arrow-right-mini-ios" fit />
          </EgPaginationItem>
          <EgPaginationItem
            :kind="lastPagination.kind"
            :tone="lastPagination.tone"
            :disabled="nextNavDisabled || lastPagination.disabled"
            @click="goLastPage"
          >
            <EgIcon name="eds-arrow-go-last" fit />
          </EgPaginationItem>
        </EgPaginer>
      </template>
    </EgLayout>

    <Teleport to=".app-preview">
      <div v-if="showEndFeedback" :class="pageStyles.endFeedbackHost">
        <EgEndFeedbackCard :key="endFeedbackKey" :text="endFeedbackText" />
      </div>
      <div
        v-if="listToastKeepMounted"
        :class="[pageStyles.listToastHost, listToastMotionActive && 'is-active']"
      >
        <div class="motion-flotation">
          <EgToast :type="listToastType" :text="listToastText" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
