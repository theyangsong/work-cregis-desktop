<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
  EgDataList,
  EgDataListCellOverflow,
  EgDataListColumn,
  EgDivider,
  EgIcon,
  EgIconButtonPro,
  EgLayout,
  EgPaginer,
  EgPaginationItem,
  EgToolBar,
} from '@eds/desktop-components';
import TasksDataListColumnCell from './list-field/TasksDataListColumnCell.vue';
import DataListHeaderSortTrigger from './DataListHeaderSortTrigger.vue';
import pageStyles from './TasksDataListPage.module.css';
import {
  DATA_LIST_FIGMA_HEADER_HEIGHT,
  DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS,
  DATA_LIST_FIGMA_TOOLBAR,
  tasksDataListCustomizeDefaults,
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
import { useTasksDataListPage } from './useTasksDataListPage';
import type {
  TasksDataListActiveSort,
  TasksDataListSortOrder,
} from './tasksDataListSort';

const props = defineProps<{
  toolbarTitle?: string;
}>();

const { ui } = useAppI18n();
const activeSort = ref<TasksDataListActiveSort | null>(null);

const customize = reactive({ ...tasksDataListCustomizeDefaults }) as TasksDataListCustomizeState;

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
const showGeneralStructureColumn = computed(() =>
  tasksDataListShowsGeneralStructureColumn(props.toolbarTitle),
);
const showStatusColumn = computed(() => tasksDataListShowsStatusColumn(props.toolbarTitle));
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
const amountColumnFlexGrow = computed(() =>
  tasksDataListAmountColumnFlexGrow(props.toolbarTitle),
);
const generalStructureColumnMinWidth = computed(() =>
  tasksDataListGeneralStructureColumnMinWidth(props.toolbarTitle),
);
const amountColumnMinWidth = computed(() =>
  tasksDataListAmountColumnMinWidth(props.toolbarTitle),
);

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
  onBatchClick,
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
} = useTasksDataListPage(customizeRef, undefined, activeSort);

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

const displayToolbarTitle = computed(() =>
  ui(props.toolbarTitle ?? DATA_LIST_FIGMA_TOOLBAR.title),
);
const displayPrimaryActionLabel = computed(() => ui(primaryActionLabel.value));
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
  })),
);
const displayBatchActions = computed(() =>
  dataListBatchActions.map((action) => ({
    ...action,
    label: ui(action.label),
  })),
);
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
            <EgIconButtonPro
              :label="ui(batchButton.label)"
              :badge="batchButton.badge"
              :show-badge="batchButton.showBadge"
              :show-reddot="batchButton.showReddot"
              :disabled="skidContentLocked || batchButton.disabled"
              @click="onBatchClick"
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
          v-model:select-mode="customize.selectMode"
          :data-list="paginatedDataList"
          :header-height="DATA_LIST_FIGMA_HEADER_HEIGHT"
          :column-height="columnHeight"
          :loading="Boolean(customize.loading)"
          :initing="Boolean(customize.initing)"
          :skid-open="skidOpen"
          :batch-actions="displayBatchActions"
          :on-batch-action="onBatchAction"
          :primary-action="showActionColumn ? { label: displayPrimaryActionLabel } : undefined"
        >
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
                  amountColumnAlign === 'right' && pageStyles.comboHeaderAlignEnd,
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
                :column-align="amountColumnAlign"
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
  </div>
</template>
