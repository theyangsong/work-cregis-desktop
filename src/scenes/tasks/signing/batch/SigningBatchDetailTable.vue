<script setup lang="ts">
import { computed, inject } from 'vue';
import {
  EgDataList,
  EgDataListCellOverflow,
  EgDataListColumn,
  EgDivider,
  EgTextOverflowTooltip,
  type DataListItem,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import DataListHeaderSortTrigger from '../../DataListHeaderSortTrigger.vue';
import type { TasksDataListSortOrder } from '../../tasksDataListSort';
import TasksDataListColumnCell from '../../list-field/TasksDataListColumnCell.vue';
import {
  DATA_LIST_FIGMA_HEADER_HEIGHT,
} from '../../tasksDataListPageData';
import pageStyles from '../../TasksDataListPage.module.css';
import {
  computeBatchDataListHeight,
  BATCH_AMOUNT_COLUMN_MIN_WIDTH,
  BATCH_INELIGIBLE_REASON_COLUMN_MIN_WIDTH,
  BATCH_RECEIVER_COLUMN_MIN_WIDTH,
  BATCH_SENDER_COLUMN_MIN_WIDTH,
} from './batchDataListLayout';
import { signingBatchDetailAmountSortKey } from './signingBatchDetailTableSortContext';
import {
  BATCH_INELIGIBLE_REASON_LABELS,
} from './evaluateBatchEligibility';
import type { BatchIneligibleReasonFilter } from './batchIneligibleReasonFilter';
import type {
  BatchIneligibleReason,
  SigningBatchRowModel,
} from './types';
import styles from './batchSigning.shared.module.css';

const props = withDefaults(
  defineProps<{
    rows: SigningBatchRowModel[];
    /** true：撑满父级 flex 区域，DataList 自动补 blank 行显示斑马线。 */
    fill?: boolean;
    /** 不可签名原因列（列表尾列、右对齐）。 */
    showIneligibleReasonColumn?: boolean;
    ineligibleReasonByRowIndex?: ReadonlyMap<number, BatchIneligibleReason>;
    ineligibleReasonFilter?: BatchIneligibleReasonFilter;
    ineligibleReasonFilterGroups?: Array<{ reason: BatchIneligibleReason; count: number }>;
    ineligibleReasonTotalCount?: number;
  }>(),
  {
    fill: false,
    showIneligibleReasonColumn: false,
    ineligibleReasonByRowIndex: () => new Map(),
    ineligibleReasonFilter: 'all',
    ineligibleReasonFilterGroups: () => [],
    ineligibleReasonTotalCount: 0,
  },
);

const emit = defineEmits<{
  'update:ineligibleReasonFilter': [value: BatchIneligibleReasonFilter];
}>();

const { ui } = useAppI18n();

const amountSort = inject(signingBatchDetailAmountSortKey, null);

const amountSortOrder = computed(() => amountSort?.amountSortOrder.value ?? '');

function onAmountSort(order: TasksDataListSortOrder | null) {
  amountSort?.setAmountSortOrder(order);
}

const dataList = computed<DataListItem[]>(() =>
  props.rows.map((row) => {
    const reason = props.ineligibleReasonByRowIndex.get(row.rowIndex);
    const ineligibleReasonLabel =
      reason != null ? ui(BATCH_INELIGIBLE_REASON_LABELS[reason]) : '';

    return {
      id: row.rowIndex,
      signingId: row.signingId,
      rowIndex: row.rowIndex,
      ineligibleReasonLabel,
    };
  }),
);

const listHeightPx = computed(() => computeBatchDataListHeight(props.rows.length));

function rowIndexFromData(data: DataListItem) {
  return Number(data.rowIndex ?? data.id);
}
</script>

<template>
  <div
    :class="[
      styles.batchDetailDataList,
      fill && styles.batchDetailDataListFill,
    ]"
    :style="fill ? undefined : { height: `${listHeightPx}px` }"
  >
    <EgDataList
      :data-list="dataList"
      :header-height="DATA_LIST_FIGMA_HEADER_HEIGHT"
      :column-height="66"
    >
      <EgDataListColumn
        prop="sender"
        :label="ui('Sender')"
        :min-width="BATCH_SENDER_COLUMN_MIN_WIDTH"
        :sortable="false"
      >
        <template #default="{ data }">
          <TasksDataListColumnCell
            data-source="business-type"
            :column-min-width="BATCH_SENDER_COLUMN_MIN_WIDTH"
            menu-item="Signing"
            :row-index="rowIndexFromData(data)"
          />
        </template>
      </EgDataListColumn>

      <EgDataListColumn
        prop="receiver"
        :label="ui('To Address')"
        :min-width="BATCH_RECEIVER_COLUMN_MIN_WIDTH"
        :sortable="false"
      >
        <template #default="{ data }">
          <TasksDataListColumnCell
            data-source="receiver"
            :column-min-width="BATCH_RECEIVER_COLUMN_MIN_WIDTH"
            menu-item="Signing"
            :row-index="rowIndexFromData(data)"
          />
        </template>
      </EgDataListColumn>

      <EgDataListColumn
        prop="amount"
        :label="ui('Amount')"
        :min-width="BATCH_AMOUNT_COLUMN_MIN_WIDTH"
        align="left"
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
                  {{ ui('Amount') }}
                </EgDataListCellOverflow>
              </div>
              <DataListHeaderSortTrigger
                v-if="amountSort"
                :label="ui('Amount')"
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
                  {{ ui('Operation Type') }}
                </EgDataListCellOverflow>
              </div>
            </div>
          </div>
        </template>
        <template #default="{ data }">
          <TasksDataListColumnCell
            data-source="amount"
            :column-min-width="BATCH_AMOUNT_COLUMN_MIN_WIDTH"
            column-align="left"
            menu-item="Signing"
            :row-index="rowIndexFromData(data)"
          />
        </template>
      </EgDataListColumn>

      <EgDataListColumn
        v-if="showIneligibleReasonColumn"
        prop="ineligibleReason"
        :label="ui('Reason')"
        :min-width="BATCH_INELIGIBLE_REASON_COLUMN_MIN_WIDTH"
        align="right"
        :sortable="false"
      >
        <template #header>
          <div
            :class="[
              pageStyles.comboHeader,
              pageStyles.comboHeaderAlignEnd,
            ]"
          >
            <div :class="pageStyles.comboHeaderSegmentTextWrap">
              <EgDataListCellOverflow
                :content-class="pageStyles.comboHeaderSegmentText"
                context="header"
              >
                {{ ui('Reason') }}
              </EgDataListCellOverflow>
            </div>
          </div>
        </template>
        <template #default="{ data }">
          <div :class="styles.batchIneligibleReasonCell">
            <EgTextOverflowTooltip
              :tooltip-text="String(data.ineligibleReasonLabel ?? '')"
              :typography-class="styles.batchIneligibleReasonCellText"
              :measure-class="styles.batchIneligibleReasonCellText"
              boundary-selector=".eds-data-list"
            >
              {{ String(data.ineligibleReasonLabel ?? '') }}
            </EgTextOverflowTooltip>
          </div>
        </template>
      </EgDataListColumn>
    </EgDataList>
  </div>
</template>
