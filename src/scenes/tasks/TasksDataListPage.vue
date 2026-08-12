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
} from '@eds/desktop-components';
import TasksDataListColumnCell from './list-field/TasksDataListColumnCell.vue';
import DataListHeaderSortTrigger from './DataListHeaderSortTrigger.vue';
import pageStyles from './TasksDataListPage.module.css';
import {
  DATA_LIST_FIGMA_HEADER_HEIGHT,
  DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS,
  DATA_LIST_FIGMA_TOOLBAR,
  tasksDataListCustomizeDefaults,
  tasksDataListDefaultRowCount,
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
  tasksDataListBusinessTypeColumnShowsComboHeader,
  tasksDataListBusinessTypeColumnSecondaryLabel,
  tasksDataListBusinessTypeColumnSecondarySortable,
  tasksDataListCurrencyColumnWidth,
  tasksDataListGeneralStructureColumnMinWidth,
  tasksDataListStatusColumnLabel,
  tasksDataListShowsGeneralStructureColumn,
  STATUS_DATA_LIST_COLUMN_MIN_WIDTH,
  STATUS_DATA_LIST_COLUMN_DISPLAY_ORDER,
  BUSINESS_TYPE_DATA_LIST_COLUMN_DISPLAY_ORDER,
  type TasksDataListCustomizeState,
} from './tasksDataListPageData';
import { useAppI18n } from '@/composables/useAppI18n';
import { formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import ApprovalRemarkPopoverPanel from './approval/ApprovalRemarkPopoverPanel.vue';
import { registerSigningBatchFlow } from './signing/batch/signingBatchFlowContext';
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
import type {
  TasksDataListActiveSort,
  TasksDataListSortOrder,
} from './tasksDataListSort';

const props = defineProps<{
  toolbarTitle?: string;
}>();

const { ui, locale } = useAppI18n();
const activeSort = ref<TasksDataListActiveSort | null>(null);

const customize = reactive({
  ...tasksDataListCustomizeDefaults,
  dataVolume: String(tasksDataListDefaultRowCount(props.toolbarTitle)),
}) as TasksDataListCustomizeState;

/** HMR / 旧会话：补齐新增的列配置字段（如 columnSecondaryLabel4）。 */
onMounted(() => {
  for (const [key, value] of Object.entries(tasksDataListCustomizeDefaults)) {
    if (customize[key as keyof TasksDataListCustomizeState] === undefined) {
      (customize as Record<string, unknown>)[key] = value;
    }
  }
});

watch(
  () => props.toolbarTitle,
  (title) => {
    customize.showExport = tasksDataListShowsExport(title);
    customize.showBatch = tasksDataListShowsBatch(title);
    activeSort.value = null;
  },
  { immediate: true },
);
const customizeRef = computed(() => customize);

const showBatchButton = computed(() => tasksDataListShowsBatch(props.toolbarTitle));
const showToolBarSectionForMenu = computed(() => showBatchButton.value);

const primaryActionLabel = computed(() => tasksDataListPrimaryActionLabel(props.toolbarTitle));
const showActionColumn = computed(() => tasksDataListShowsActionColumn(props.toolbarTitle));
/** 批处理（selectMode）时隐藏 Action 列；尾列由 Amount 承接。 */
const actionColumnHidden = computed(() => Boolean(customize.selectMode));
const showGeneralStructureColumn = computed(() =>
  tasksDataListShowsGeneralStructureColumn(props.toolbarTitle),
);
const showStatusColumn = computed(() => tasksDataListShowsStatusColumn(props.toolbarTitle));
/** 表头 / 单元格内容右对齐（批处理或已办类菜单）；列 align 保持 left，位移走 margin 过渡。 */
const amountColumnContentAlignEnd = computed(
  () =>
    customize.selectMode
    || tasksDataListAmountColumnAlign(props.toolbarTitle) === 'right',
);
const amountColumnAlign = computed(() => tasksDataListAmountColumnAlign(props.toolbarTitle));
const statusColumnLabel = computed(() => tasksDataListStatusColumnLabel(props.toolbarTitle));
const currencyColumnWidth = computed(() =>
  tasksDataListCurrencyColumnWidth(props.toolbarTitle),
);
const businessTypeColumnWidth = computed(() =>
  tasksDataListBusinessTypeColumnWidth(props.toolbarTitle),
);
const businessTypeColumnShowsComboHeader = computed(() =>
  tasksDataListBusinessTypeColumnShowsComboHeader(props.toolbarTitle),
);
const businessTypeColumnSecondaryLabel = computed(() =>
  tasksDataListBusinessTypeColumnSecondaryLabel(props.toolbarTitle),
);
const businessTypeColumnSecondarySortable = computed(() =>
  tasksDataListBusinessTypeColumnSecondarySortable(props.toolbarTitle),
);
/** 批处理隐藏 Action 后，尾列 Amount 参与多余空间均分（承接原 Action 宽度）。 */
const amountColumnFlexGrow = computed(
  () => customize.selectMode || tasksDataListAmountColumnFlexGrow(props.toolbarTitle),
);
const generalStructureColumnMinWidth = computed(() =>
  tasksDataListGeneralStructureColumnMinWidth(props.toolbarTitle),
);
const amountColumnMinWidth = computed(() =>
  tasksDataListAmountColumnMinWidth(props.toolbarTitle),
);

const isApprovalMenu = computed(() => props.toolbarTitle === 'Approval');
const isSigningMenu = computed(() => props.toolbarTitle === 'Signing');
const isRecordMenu = computed(() => {
  const title = props.toolbarTitle;
  return (
    title === 'Approved'
    || title === 'Signed'
    || title === 'All Records'
    || title === 'Sent Request'
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
const dataListRemountKey = ref(0);

const listToastText = ref('');
const listToastKeepMounted = ref(false);
const listToastMotionActive = ref(false);
const showEndFeedback = ref(false);
const endFeedbackKey = ref(0);
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

function showListError(message: string) {
  listToastText.value = message;
  syncListToastMotionEnter();
  if (listToastTimer !== undefined) clearTimeout(listToastTimer);
  listToastTimer = window.setTimeout(() => {
    hideListToast();
    listToastTimer = undefined;
  }, 3000);
}

function showListSuccess() {
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
    String(customize.dataVolume ?? tasksDataListDefaultRowCount(props.toolbarTitle)),
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
  showSuccess: () => showListSuccess(),
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
  showSuccess: () => showListSuccess(),
});

const recordDetailFlow = useRecordDetailFlow({
  menuItem: computed(() => props.toolbarTitle),
  allRowIndexes,
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
});

watch(isRecordMenu, (enabled) => {
  registerRecordDetailFlow(enabled ? recordDetailFlow : null);
});

function refreshListFromToolbar() {
  void nextTick(() => {
    onToolbarActionClick('refresh');
  });
}

onMounted(() => {
  if (isApprovalMenu.value) registerApprovalFlow(approvalFlow);
  if (isSigningMenu.value) {
    registerSigningFlow(signingFlow);
    registerSigningBatchFlow(signingBatchFlow);
  }
  if (isRecordMenu.value) registerRecordDetailFlow(recordDetailFlow);
  setBatchSigningListRefreshHandler(refreshListFromToolbar);
});

onBeforeUnmount(() => {
  suspendBatchSigningProgressPopup();
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

const displayToolbarTitle = computed(() =>
  ui(props.toolbarTitle ?? DATA_LIST_FIGMA_TOOLBAR.title),
);

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
    return locale.value === 'zh-CN' ? ui(label) : DATA_LIST_PRIMARY_ACTION_LABEL_EN;
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
        { key: 'reject', label: 'Reject', danger: true, popover: true, popoverTitle: 'Batch Reject' },
        { key: 'pass', label: 'Pass', popover: true, popoverTitle: 'Batch Approved' },
      ]
    : isSigningMenu.value
      ? [
          { key: 'reject', label: 'Reject', danger: true, popover: true, popoverTitle: 'Batch Reject' },
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

      <div :class="pageStyles.listRegion">
        <EgDataList
          ref="dataListRef"
          :key="dataListRemountKey"
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
          <EgDataListColumn
            prop="primary"
            :label="ui(previewColumnSettings[0].label)"
            :min-width="previewColumnSettings[0].minWidth"
            :width="currencyColumnWidth"
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
                </div>
              </div>
            </template>
            <template #default="{ data }">
              <TasksDataListColumnCell
                :data-source="previewColumnSettings[0].dataSource"
                :column-min-width="previewColumnSettings[0].minWidth"
                :row-index="Number(data.id)"
                variant="combo"
              />
            </template>
          </EgDataListColumn>

          <EgDataListColumn
            v-if="showGeneralStructureColumn"
            prop="submitter"
            :label="ui(previewColumnSettings[1].label)"
            :min-width="generalStructureColumnMinWidth"
            :align="previewColumnSettings[1].align"
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
                      {{ ui(previewColumnSettings[1].label) }}
                    </EgDataListCellOverflow>
                  </div>
                  <DataListHeaderSortTrigger
                    v-if="previewColumnSettings[1].sortable"
                    :label="previewColumnSettings[1].label"
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
                :column-min-width="generalStructureColumnMinWidth"
                :row-index="Number(data.id)"
              />
            </template>
          </EgDataListColumn>

          <EgDataListColumn
            prop="businessType"
            :label="ui(previewColumnSettings[2].label)"
            :min-width="previewColumnSettings[2].minWidth"
            :width="businessTypeColumnWidth"
            :align="previewColumnSettings[2].align"
            :sortable="false"
            :display-order="
              showStatusColumn ? BUSINESS_TYPE_DATA_LIST_COLUMN_DISPLAY_ORDER : 3
            "
          >
            <template v-if="businessTypeColumnShowsComboHeader" #header>
              <div :class="pageStyles.comboHeader">
                <div :class="pageStyles.comboHeaderSegment">
                  <div :class="pageStyles.comboHeaderSegmentTextWrap">
                    <EgDataListCellOverflow
                      :content-class="pageStyles.comboHeaderSegmentText"
                      context="header"
                    >
                      {{ ui(previewColumnSettings[2].label) }}
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
                :data-source="previewColumnSettings[2].dataSource"
                :column-min-width="previewColumnSettings[2].minWidth"
                :menu-item="toolbarTitle"
                :row-index="Number(data.id)"
              />
            </template>
          </EgDataListColumn>

          <EgDataListColumn
            v-if="showStatusColumn"
            prop="status"
            :label="displayStatusColumnLabel"
            :min-width="STATUS_DATA_LIST_COLUMN_MIN_WIDTH"
            :display-order="STATUS_DATA_LIST_COLUMN_DISPLAY_ORDER"
            align="center"
            :sortable="false"
          >
            <template #default="{ data }">
              <TasksDataListColumnCell
                data-source="status"
                :column-min-width="STATUS_DATA_LIST_COLUMN_MIN_WIDTH"
                :menu-item="toolbarTitle"
                :row-index="Number(data.id)"
              />
            </template>
          </EgDataListColumn>

          <EgDataListColumn
            prop="amount"
            :label="ui(previewColumnSettings[3].label)"
            :min-width="amountColumnMinWidth"
            :flex-grow="amountColumnFlexGrow"
            :align="amountColumnAlign"
            :sortable="false"
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
                      {{ ui(previewColumnSettings[3].label) }}
                    </EgDataListCellOverflow>
                  </div>
                  <DataListHeaderSortTrigger
                    :label="previewColumnSettings[3].label"
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
                      {{ ui(previewColumnSettings[3].secondaryLabel ?? '') }}
                    </EgDataListCellOverflow>
                  </div>
                </div>
              </div>
            </template>
            <template #default="{ data }">
              <TasksDataListColumnCell
                :data-source="previewColumnSettings[3].dataSource"
                :column-min-width="amountColumnMinWidth"
                :column-align="amountColumnContentAlignEnd ? 'right' : 'left'"
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
        <EgEndFeedbackCard :key="endFeedbackKey" text="Success" />
      </div>
      <div
        v-if="listToastKeepMounted"
        :class="[pageStyles.listToastHost, listToastMotionActive && 'is-active']"
      >
        <div class="motion-flotation">
          <EgToast type="result" :text="listToastText" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
