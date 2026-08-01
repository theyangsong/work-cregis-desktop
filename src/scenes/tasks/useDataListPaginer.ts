import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
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
  DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS,
  paginerPaginationDefaults,
  readPaginerPaginationItem,
  type PaginerPaginationSlotKey,
} from './tasksDataListPageData';

/** DataList 底部分页器 — 与 TasksDataListPage / Showcase 行为一致。 */
export function useDataListPaginer(totalCount: MaybeRefOrGetter<number>) {
  const paginationState = paginerPaginationDefaults();
  const settingsLevelIndex = ref(0);
  const settingsJumpValue = ref('');
  const currentPage = ref(1);

  const totalRowCount = computed(() => Math.max(0, toValue(totalCount)));

  const pageSize = computed(() => {
    const label =
      DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS[settingsLevelIndex.value] ??
      DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS[0];
    const parsed = Number.parseInt(label, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
  });

  const totalPages = computed(() => {
    if (totalRowCount.value === 0) return 1;
    return Math.ceil(totalRowCount.value / pageSize.value);
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

  function paginateItems<T>(items: readonly T[]): T[] {
    if (items.length === 0) return [];
    const start = (currentPage.value - 1) * pageSize.value;
    return items.slice(start, start + pageSize.value);
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

  function dataListPagination(prefix: PaginerPaginationSlotKey) {
    return readPaginerPaginationItem(paginationState, prefix);
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

  watch(totalRowCount, () => {
    navigateManyPage(1);
  });

  return {
    settingsLevelIndex,
    settingsJumpValue,
    currentPage,
    pageSize,
    totalRowCount,
    paginateItems,
    isManyPagination,
    manyPageItems,
    firstPagination,
    prevPagination,
    pagePagination,
    nextPagination,
    lastPagination,
    prevNavDisabled,
    nextNavDisabled,
    goFirstPage,
    goPrevPage,
    goNextPage,
    goLastPage,
    onManyPageItemClick,
    isManyPageSelected,
    onSettingsJump,
  };
}
