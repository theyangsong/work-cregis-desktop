import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue';
import { SKID_PUSH_TRANSITION_MS, type DataListBatchActionResult } from '@eds/desktop-components';
import {
  buildManyPageItems,
  computeManyNextKeepWindow,
  computeManyPageClickKeepWindow,
  computeManyPrevKeepWindow,
  defaultManyWindowStart,
  isManyPageItemSelected,
  type PaginerManyPageItem,
} from './paginerManyPagination';
import {
  buildDataListStatisticsItems,
  buildFigmaDataListRows,
  DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS,
  DATA_LIST_FIGMA_PAGINER,
  DATA_LIST_FIGMA_TOOLBAR,
  DATA_LIST_PREVIEW_COLUMN_COUNT,
  parseDataListColumnHeight,
  parseDataListRowCount,
  readDataListColumnSettings,
  readIconButtonProItem,
  readPaginerPaginationItem,
  resolveDataListColumnMinWidthFromDataSource,
  type DataListColumnDataSource,
  type PaginerPaginationSlotKey,
} from './tasksDataListPageData';
import {
  sortDataListRows,
  type TasksDataListActiveSort,
} from './tasksDataListSort';

type CustomizeSource = Ref<Record<string, unknown>> | ComputedRef<Record<string, unknown>>;

type ToolbarActionButton = {
  key: 'filter' | 'refresh' | 'export';
  item: ReturnType<typeof readIconButtonProItem>;
};

export function useTasksDataListPage(
  customize: CustomizeSource,
  layoutSkidOpen?: Ref<boolean | undefined>,
  activeSort?: Ref<TasksDataListActiveSort | null>,
  batchActionHandler?: (
    key: string,
    rows: Array<Record<string, unknown> & { _index: number }>,
  ) => Promise<void | DataListBatchActionResult> | void | DataListBatchActionResult,
  /** 返回 true 保留行；批处理多选时用于按网络过滤全量列表（勿只滤当前页）。 */
  rowFilter?: ComputedRef<((row: Record<string, unknown>) => boolean) | null>,
) {
  const columnDataSources = computed(() =>
    Array.from({ length: DATA_LIST_PREVIEW_COLUMN_COUNT }, (_, offset) =>
      String(customize.value[`columnDataSource${offset + 1}`] ?? 'placeholder'),
    ),
  );

  watch(columnDataSources, (sources, previous) => {
    sources.forEach((source, offset) => {
      if (previous && source === previous[offset]) return;
      const index = offset + 1;
      const dataSource: DataListColumnDataSource =
        source === 'currency'
          ? 'currency'
          : source === 'general-structure'
            ? 'general-structure'
            : source === 'business-type'
              ? 'business-type'
              : source === 'amount'
                ? 'amount'
                : source === 'action'
                  ? 'action'
                  : 'placeholder';
      customize.value[`columnMinWidth${index}`] = resolveDataListColumnMinWidthFromDataSource(
        dataSource,
        index,
      );
    });
  });

  const allDataList = computed(() =>
    buildFigmaDataListRows(Boolean(customize.value.empty), parseDataListRowCount(customize.value)),
  );

  const sortedDataList = computed(() => {
    const sort = activeSort?.value;
    const sorted = sort ? sortDataListRows(allDataList.value, sort) : allDataList.value;
    const filter = rowFilter?.value;
    return filter ? sorted.filter(filter) : sorted;
  });

  const columnHeight = computed(() => parseDataListColumnHeight(customize.value));

  const showBatch = computed(() => Boolean(customize.value.showBatch));
  const showExport = computed(() => Boolean(customize.value.showExport));
  const showBack = computed(() => Boolean(customize.value.showBack));
  const showStatistics = computed(() => Boolean(customize.value.showStatistics));
  const showToolBarSection = computed(() => showBatch.value);
  const skidOpen = computed(() => Boolean(layoutSkidOpen?.value));
  const skidContentLocked = ref(skidOpen.value);
  let skidContentReleaseTimer: ReturnType<typeof setTimeout> | undefined;

  watch(
    skidOpen,
    (open) => {
      if (skidContentReleaseTimer !== undefined) {
        clearTimeout(skidContentReleaseTimer);
        skidContentReleaseTimer = undefined;
      }

      if (open) {
        skidContentLocked.value = true;
        return;
      }

      skidContentReleaseTimer = window.setTimeout(() => {
        if (!skidOpen.value) {
          skidContentLocked.value = false;
        }
        skidContentReleaseTimer = undefined;
      }, SKID_PUSH_TRANSITION_MS);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (skidContentReleaseTimer !== undefined) clearTimeout(skidContentReleaseTimer);
  });

  const showToolBarOperation = computed(
    () => DATA_LIST_FIGMA_TOOLBAR.showOperation && !skidContentLocked.value,
  );
  const showPaginerStatistics = computed(() => showStatistics.value && !skidContentLocked.value);

  function trackSingleIconButton(prefix: string) {
    void customize.value[`${prefix}Label`];
    void customize.value[`${prefix}Icon`];
    void customize.value[`${prefix}ShowBadge`];
    void customize.value[`${prefix}Badge`];
    void customize.value[`${prefix}ShowReddot`];
    void customize.value[`${prefix}Disabled`];
  }

  const batchButton = computed(() => {
    trackSingleIconButton('batch');
    return readIconButtonProItem(customize.value, 'batch');
  });

  const filterButton = computed(() => {
    trackSingleIconButton('filter');
    return readIconButtonProItem(customize.value, 'filter');
  });

  const refreshButton = computed(() => {
    trackSingleIconButton('refresh');
    return readIconButtonProItem(customize.value, 'refresh');
  });

  const exportButton = computed(() => {
    trackSingleIconButton('export');
    return readIconButtonProItem(customize.value, 'export');
  });

  const toolbarActionButtons = computed((): ToolbarActionButton[] => {
    trackSingleIconButton('filter');
    trackSingleIconButton('refresh');
    if (showExport.value) trackSingleIconButton('export');

    const buttons: ToolbarActionButton[] = [
      { key: 'filter', item: filterButton.value },
      { key: 'refresh', item: refreshButton.value },
    ];
    if (showExport.value) {
      buttons.push({ key: 'export', item: exportButton.value });
    }
    return buttons;
  });

  const statisticsItems = computed(() => buildDataListStatisticsItems(customize.value));

  function trackColumnSettings() {
    void customize.value.columnSettingIndex;
    for (let index = 1; index <= DATA_LIST_PREVIEW_COLUMN_COUNT; index += 1) {
      void customize.value[`columnMinWidth${index}`];
      void customize.value[`columnAlign${index}`];
      void customize.value[`columnDataSource${index}`];
      void customize.value[`columnLabel${index}`];
      void customize.value[`columnSortable${index}`];
      if (index === 1) {
        void customize.value.columnSecondaryLabel1;
        void customize.value.columnSecondarySortable1;
      }
      if (index === 2) {
        void customize.value.columnSecondaryLabel2;
        void customize.value.columnSecondarySortable2;
      }
      if (index === 4) {
        void customize.value.columnSecondaryLabel4;
        void customize.value.columnSecondarySortable4;
      }
    }
  }

  const previewColumnSettings = computed(() => {
    trackColumnSettings();
    return readDataListColumnSettings(customize.value);
  });

  const settingsLevelIndex = ref(0);
  const settingsJumpValue = ref('');
  const currentPage = ref(1);

  const pageSize = computed(() => {
    const label =
      DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS[settingsLevelIndex.value] ??
      DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS[0];
    const parsed = Number.parseInt(label, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
  });

  const totalRowCount = computed(() => sortedDataList.value.length);

  const totalPages = computed(() => {
    if (totalRowCount.value === 0) return 1;
    return Math.ceil(totalRowCount.value / pageSize.value);
  });

  const paginatedDataList = computed(() => {
    if (totalRowCount.value === 0) return [];
    const start = (currentPage.value - 1) * pageSize.value;
    return sortedDataList.value.slice(start, start + pageSize.value);
  });

  const isManyPagination = computed(() => totalPages.value > 1);

  const manyWindowStart = ref(defaultManyWindowStart(currentPage.value, totalPages.value));
  const previousManyPage = ref(currentPage.value);
  let navigatingManyPage = false;

  const manyPageItems = computed(() =>
    buildManyPageItems(currentPage.value, manyWindowStart.value, totalPages.value),
  );

  const isFirstPage = computed(() => currentPage.value <= 1);
  const isLastPage = computed(() => currentPage.value >= totalPages.value);
  const prevNavDisabled = computed(() => totalRowCount.value === 0 || isFirstPage.value);
  const nextNavDisabled = computed(() => totalRowCount.value === 0 || isLastPage.value);

  const dataListBatchActions = [
    { key: 'reject', label: 'Reject', danger: true },
    { key: 'pass', label: 'Pass' },
  ] as const;

  async function onBatchAction(
    key: string,
    rows: Array<Record<string, unknown> & { _index: number }>,
  ): Promise<DataListBatchActionResult | void> {
    if (batchActionHandler) {
      return batchActionHandler(key, rows);
    }
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1200);
    });
  }

  function refreshDataList() {
    customize.value.loading = true;
    window.setTimeout(() => {
      customize.value.loading = false;
    }, 600);
  }

  function clampPage(page: number) {
    return Math.min(totalPages.value, Math.max(1, page));
  }

  function syncManyWindowStart(page: number, keepWindow: boolean) {
    if (keepWindow) return;
    manyWindowStart.value = defaultManyWindowStart(page, totalPages.value);
  }

  function navigateManyPage(page: number, keepWindow = false) {
    navigatingManyPage = true;
    currentPage.value = clampPage(page);
    syncManyWindowStart(currentPage.value, keepWindow);
    previousManyPage.value = currentPage.value;
    navigatingManyPage = false;
  }

  function goFirstPage() {
    if (prevNavDisabled.value) return;
    navigateManyPage(1);
  }

  function goPrevPage() {
    if (prevNavDisabled.value) return;
    const page = currentPage.value;
    if (page <= 3) {
      navigateManyPage(page - 1);
      return;
    }
    navigateManyPage(page - 1, computeManyPrevKeepWindow(page, manyWindowStart.value));
  }

  function goNextPage() {
    if (nextNavDisabled.value) return;
    const page = currentPage.value;
    if (page <= 3) {
      navigateManyPage(page + 1);
      return;
    }
    navigateManyPage(page + 1, computeManyNextKeepWindow(page, manyWindowStart.value));
  }

  function goLastPage() {
    if (nextNavDisabled.value) return;
    navigateManyPage(totalPages.value);
  }

  function onManyPageItemClick(item: PaginerManyPageItem) {
    if (item.kind !== 'page') return;
    const page = currentPage.value;
    if (item.page === page) return;
    navigateManyPage(
      item.page,
      computeManyPageClickKeepWindow(page, item.page, manyWindowStart.value),
    );
  }

  function isManyPageSelected(item: PaginerManyPageItem, index: number): boolean {
    return isManyPageItemSelected(
      item,
      index,
      currentPage.value,
      totalPages.value,
      manyPageItems.value,
    );
  }

  function onSettingsJump(value: string) {
    const page = Number.parseInt(value.trim(), 10);
    if (!Number.isFinite(page)) return;
    navigateManyPage(page);
  }

  function trackDataListPagination(prefix: PaginerPaginationSlotKey) {
    void customize.value[`${prefix}Kind`];
    void customize.value[`${prefix}Tone`];
    void customize.value[`${prefix}Label`];
    void customize.value[`${prefix}Disabled`];
  }

  function dataListPagination(prefix: PaginerPaginationSlotKey) {
    trackDataListPagination(prefix);
    return readPaginerPaginationItem(customize.value, prefix);
  }

  const firstPagination = computed(() => dataListPagination('first'));
  const prevPagination = computed(() => dataListPagination('prev'));
  const pagePagination = computed(() => dataListPagination('page'));
  const nextPagination = computed(() => dataListPagination('next'));
  const lastPagination = computed(() => dataListPagination('last'));

  watch(pageSize, () => {
    navigateManyPage(1);
  });

  watch(totalPages, (pages) => {
    if (currentPage.value > pages) {
      navigateManyPage(Math.max(1, pages));
    } else {
      manyWindowStart.value = defaultManyWindowStart(currentPage.value, pages);
      previousManyPage.value = currentPage.value;
    }
  });

  watch(currentPage, (page) => {
    if (navigatingManyPage) return;
    if (page === previousManyPage.value) return;
    manyWindowStart.value = defaultManyWindowStart(page, totalPages.value);
    previousManyPage.value = page;
  });

  watch(
    () => customize.value.empty,
    (empty) => {
      if (empty) navigateManyPage(1);
    },
  );

  watch(
    () => customize.value.showBatch,
    (enabled) => {
      if (!enabled) customize.value.selectMode = false;
    },
  );

  function onBatchClick() {
    customize.value.selectMode = !customize.value.selectMode;
  }

  let refreshTimer: ReturnType<typeof setTimeout> | undefined;

  function onRefreshClick(onComplete?: () => void) {
    if (refreshTimer !== undefined) {
      clearTimeout(refreshTimer);
      refreshTimer = undefined;
    }
    if (activeSort) {
      activeSort.value = null;
    }
    navigateManyPage(1);
    customize.value.loading = true;
    refreshTimer = window.setTimeout(() => {
      customize.value.loading = false;
      refreshTimer = undefined;
      onComplete?.();
    }, 2000);
  }

  function onToolbarActionClick(
    key: ToolbarActionButton['key'],
    onComplete?: () => void,
  ) {
    if (key === 'refresh') {
      onRefreshClick(onComplete);
    }
  }

  return {
    DATA_LIST_FIGMA_TOOLBAR,
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
    onBatchClick,
    onManyPageItemClick,
    onSettingsJump,
    onToolbarActionClick,
    refreshDataList,
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
  };
}
