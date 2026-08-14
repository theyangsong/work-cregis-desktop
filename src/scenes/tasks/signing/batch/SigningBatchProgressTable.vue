<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  EgDataList,
  EgDataListCellOverflow,
  EgDataListColumn,
  EgDivider,
  EgFormSubmission,
  EgListFieldHashLikeLine,
  EgListFieldOverflowText,
  EgTag,
  type DataListItem,
  type TagStatus,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import DataListHeaderSortTrigger from '../../DataListHeaderSortTrigger.vue';
import type { TasksDataListSortOrder } from '../../tasksDataListSort';
import TasksDataListColumnCell from '../../list-field/TasksDataListColumnCell.vue';
import TasksListFieldAmount from '../../list-field/TasksListFieldAmount.vue';
import {
  DATA_LIST_FIGMA_HEADER_HEIGHT,
} from '../../tasksDataListPageData';
import pageStyles from '../../TasksDataListPage.module.css';
import dataListStyles from '../../../../../../eds-desktop/packages/components/src/organisms/data-list/DataList.module.css';
import { buildProgressAmountListCustomize } from './batchProgressAmountCustomize';
import {
  BATCH_RECEIVER_COLUMN_MIN_WIDTH,
  computeBatchDataListHeight,
} from './batchDataListLayout';
import {
  BATCH_PROGRESS_EMPTY_DISPLAY,
  formatProgressListFieldDatetime,
  isProgressEmptyDisplay,
} from './batchProgressListFieldDisplay';
import type { BatchSigningFailReason, BatchSigningTaskRow } from './types';
import styles from './batchSigning.shared.module.css';

const PROGRESS_AMOUNT_COLUMN_MIN_WIDTH = '160px';
const PROGRESS_RECEIVER_TX_COLUMN_MIN_WIDTH = '160px';
const PROGRESS_CREATED_TIME_COLUMN_MIN_WIDTH = '130px';
const PROGRESS_STATUS_COLUMN_MIN_WIDTH = '150px';

const props = withDefaults(
  defineProps<{
    rows: BatchSigningTaskRow[];
    /** true：撑满父级 flex 区域，DataList 自动补 blank 行显示斑马线。 */
    fill?: boolean;
  }>(),
  {
    fill: false,
  },
);

const { ui } = useAppI18n();

const createdTimeSortOrder = ref<TasksDataListSortOrder | ''>('');

const FAIL_REASON_LABELS: Record<BatchSigningFailReason, string> = {
  'already-processed': 'Transaction already processed',
  'quota-insufficient': 'Insufficient withdrawal quota',
  'balance-insufficient': 'Insufficient balance',
  'miner-fee-insufficient': 'Insufficient miner fee',
  'sign-failed': 'Signing failed',
  'broadcast-failed': 'Broadcast failed',
  'mpc-network-error': 'MPC network error',
  'data-error': 'Data error',
};

const ROW_STATUS_LABELS: Record<BatchSigningTaskRow['status'], string> = {
  pending: 'Pending Signature',
  signing: 'Signing in progress',
  broadcasting: 'Broadcasting',
  success: 'Broadcast Success',
  failed: 'Failed',
};

const sortedRows = computed(() => {
  const rows = [...props.rows];
  if (!createdTimeSortOrder.value) {
    return rows;
  }
  const direction = createdTimeSortOrder.value === 'asc' ? 1 : -1;
  return rows.sort((left, right) => (left.updatedAt - right.updatedAt) * direction);
});

function onCreatedTimeSort(order: TasksDataListSortOrder | null) {
  createdTimeSortOrder.value = order ?? '';
}

const dataList = computed<DataListItem[]>(() =>
  sortedRows.value.map((row) => {
    const statusLabel =
      row.status === 'failed'
        ? ui('Failed')
        : ui(ROW_STATUS_LABELS[row.status]);
    const failFeedbackLabel =
      row.status === 'failed' && row.failReason
        ? ui(FAIL_REASON_LABELS[row.failReason])
        : undefined;

    const txHash = row.txHash?.trim() || BATCH_PROGRESS_EMPTY_DISPLAY;

    return {
      id: row.rowIndex,
      signingId: row.signingId,
      rowIndex: row.rowIndex,
      txHash,
      minerFee: row.minerFeeDisplay?.trim() || BATCH_PROGRESS_EMPTY_DISPLAY,
      time: formatProgressListFieldDatetime(row.updatedAt),
      statusLabel,
      failFeedbackLabel,
      status: row.status,
    };
  }),
);

const listHeightPx = computed(() => computeBatchDataListHeight(props.rows.length));

function resolveRowTagStatus(status: BatchSigningTaskRow['status']): TagStatus {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'pending') return 'ready';
  return 'warning';
}

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
        prop="amountMinerFee"
        :label="ui('Amount')"
        :min-width="PROGRESS_AMOUNT_COLUMN_MIN_WIDTH"
        :display-order="1"
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
            </div>
            <EgDivider type="navigator" direction="vertical" />
            <div :class="pageStyles.comboHeaderSegment">
              <div :class="pageStyles.comboHeaderSegmentTextWrap">
                <EgDataListCellOverflow
                  :content-class="pageStyles.comboHeaderSegmentText"
                  context="header"
                >
                  {{ ui('Miner Fee') }}
                </EgDataListCellOverflow>
              </div>
            </div>
          </div>
        </template>
        <template #default="{ data }">
          <div :class="[styles.batchDetailDataListCell, styles.batchProgressAmountCell]">
            <TasksListFieldAmount
              :customize="buildProgressAmountListCustomize(
                rowIndexFromData(data),
                String(data.minerFee ?? ''),
                PROGRESS_AMOUNT_COLUMN_MIN_WIDTH,
              )"
            />
          </div>
        </template>
      </EgDataListColumn>

      <EgDataListColumn
        prop="receiverTx"
        :label="ui('To Address')"
        :min-width="PROGRESS_RECEIVER_TX_COLUMN_MIN_WIDTH"
        :display-order="2"
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
                  {{ ui('To Address') }}
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
                  {{ ui('Transaction hash') }}
                </EgDataListCellOverflow>
              </div>
            </div>
          </div>
        </template>
        <template #default="{ data }">
          <div :class="styles.batchDetailDataListCell">
            <TasksDataListColumnCell
              data-source="receiver"
              :column-min-width="BATCH_RECEIVER_COLUMN_MIN_WIDTH"
              menu-item="Signing"
              :row-index="rowIndexFromData(data)"
            />
            <EgListFieldHashLikeLine
              v-if="!isProgressEmptyDisplay(String(data.txHash ?? ''))"
              :text="String(data.txHash ?? '')"
              variant="secondary"
              tooltip-trigger="hover"
            />
            <EgListFieldOverflowText
              v-else
              :text="BATCH_PROGRESS_EMPTY_DISPLAY"
              variant="secondary"
              tooltip-trigger="hover"
            />
          </div>
        </template>
      </EgDataListColumn>

      <EgDataListColumn
        prop="createdTime"
        :label="ui('Application Time')"
        :min-width="PROGRESS_CREATED_TIME_COLUMN_MIN_WIDTH"
        :display-order="3"
        align="left"
        :sortable="false"
      >
        <template #header>
          <div :class="dataListStyles.headerTitleGroup">
            <EgDataListCellOverflow
              :content-class="dataListStyles.headerText"
              context="header"
            >
              {{ ui('Application Time') }}
            </EgDataListCellOverflow>
            <DataListHeaderSortTrigger
              :label="ui('Application Time')"
              :active-order="createdTimeSortOrder"
              @sort-change="onCreatedTimeSort"
            />
          </div>
        </template>
        <template #default="{ data }">
          <EgListFieldOverflowText
            :text="String(data.time ?? '')"
            variant="primary"
            tabular
            tooltip-trigger="hover"
          />
        </template>
      </EgDataListColumn>

      <EgDataListColumn
        prop="status"
        :label="ui('Status')"
        :min-width="PROGRESS_STATUS_COLUMN_MIN_WIDTH"
        :display-order="4"
        align="right"
        :sortable="false"
      >
        <template #header>
          <div :class="styles.progressStatusHeader">
            <EgDataListCellOverflow
              :content-class="styles.progressStatusHeaderLabel"
              context="header"
            >
              {{ ui('Status') }}
            </EgDataListCellOverflow>
          </div>
        </template>
        <template #default="{ data }">
          <div :class="styles.batchProgressStatusCell">
            <div :class="styles.batchProgressStatusField">
              <EgTag
                family="status"
                size="lg"
                truncate
                :status="resolveRowTagStatus(data.status as BatchSigningTaskRow['status'])"
              >
                {{ String(data.statusLabel ?? '') }}
              </EgTag>
              <EgFormSubmission
                v-if="data.status === 'failed' && data.failFeedbackLabel"
                type="danger"
                :text="String(data.failFeedbackLabel)"
                :show-link="false"
              />
            </div>
          </div>
        </template>
      </EgDataListColumn>
    </EgDataList>
  </div>
</template>
