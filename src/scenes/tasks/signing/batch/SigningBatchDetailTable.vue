<script setup lang="ts">
import { computed, inject } from 'vue';
import {
  EgCryptoAddress,
  EgDataList,
  EgDataListCellOverflow,
  EgDataListColumn,
  EgDivider,
  EgListFieldOverflowText,
  type CryptoAddressSideTags,
  type DataListItem,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import DataListHeaderSortTrigger from '../../DataListHeaderSortTrigger.vue';
import type { TasksDataListSortOrder } from '../../tasksDataListSort';
import { resolveCurrencyCustomTagStyleForLabel } from '../../list-field/listFieldCurrencyTagCustomize';
import TasksDataListColumnCell from '../../list-field/TasksDataListColumnCell.vue';
import {
  DATA_LIST_FIGMA_HEADER_HEIGHT,
} from '../../tasksDataListPageData';
import pageStyles from '../../TasksDataListPage.module.css';
import {
  computeBatchDataListHeight,
  BATCH_AMOUNT_COLUMN_MIN_WIDTH,
  BATCH_INELIGIBLE_REASON_COLUMN_MIN_WIDTH,
  BATCH_WALLET_COMBO_COLUMN_MIN_WIDTH,
} from './batchDataListLayout';
import { signingBatchDetailAmountSortKey } from './signingBatchDetailTableSortContext';
import {
  BATCH_INELIGIBLE_REASON_LABELS,
} from './evaluateBatchEligibility';
import type { BatchIneligibleReasonFilter } from './batchIneligibleReasonFilter';
import type {
  BatchAddressDisplay,
  BatchIneligibleReason,
  SigningBatchRowModel,
} from './types';
import styles from './batchSigning.shared.module.css';

function buildAddressSideTags(tags: string[]): CryptoAddressSideTags | undefined {
  if (!tags.length) return undefined;

  return {
    custom: tags.map((label) => ({
      show: true,
      size: 'sm' as const,
      family: 'custom' as const,
      label,
      customStyle: resolveCurrencyCustomTagStyleForLabel(label),
    })),
  };
}

function resolveAddressTagsList(tags: string[]): CryptoAddressSideTags[] | undefined {
  const sideTags = buildAddressSideTags(tags);
  return sideTags ? [sideTags] : undefined;
}

function addressFieldsFrom(display: BatchAddressDisplay) {
  return {
    text: display.address,
    alias: display.alias.trim() || undefined,
    addresses: [display.address],
    tagsList: resolveAddressTagsList(display.tags),
  };
}

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
    const sender = addressFieldsFrom(row.sender);
    const receiver = addressFieldsFrom(row.receiver);

    const reason = props.ineligibleReasonByRowIndex.get(row.rowIndex);
    const ineligibleReasonLabel =
      reason != null ? ui(BATCH_INELIGIBLE_REASON_LABELS[reason]) : '';

    return {
      id: row.rowIndex,
      signingId: row.signingId,
      rowIndex: row.rowIndex,
      senderText: sender.text,
      senderAlias: sender.alias,
      senderAddresses: sender.addresses,
      senderTagsList: sender.tagsList,
      receiverText: receiver.text,
      receiverAlias: receiver.alias,
      receiverAddresses: receiver.addresses,
      receiverTagsList: receiver.tagsList,
      amountFull: row.amountFull,
      amountFiat: row.amountFiat,
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
        prop="wallet"
        :label="ui('Outbound Wallet')"
        :min-width="BATCH_WALLET_COMBO_COLUMN_MIN_WIDTH"
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
                  {{ ui('Outbound Wallet') }}
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
                  {{ ui('From Address') }}
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
                  {{ ui('To Address') }}
                </EgDataListCellOverflow>
              </div>
            </div>
          </div>
        </template>
        <template #default="{ data }">
          <div :class="styles.batchDetailWalletComboCell">
            <TasksDataListColumnCell
              data-source="business-type"
              column-min-width="0"
              menu-item="Signing"
              :row-index="rowIndexFromData(data)"
            />
            <EgCryptoAddress
              address-mode="double"
              :from-text="String(data.senderText ?? '')"
              :from-alias="data.senderAlias ? String(data.senderAlias) : undefined"
              :from-address-count="1"
              :from-addresses="(data.senderAddresses as string[] | undefined) ?? []"
              :from-tags-list="data.senderTagsList as CryptoAddressSideTags[] | undefined"
              :to-text="String(data.receiverText ?? '')"
              :to-alias="data.receiverAlias ? String(data.receiverAlias) : undefined"
              :to-address-count="1"
              :to-addresses="(data.receiverAddresses as string[] | undefined) ?? []"
              :to-tags-list="data.receiverTagsList as CryptoAddressSideTags[] | undefined"
              address-tooltip-trigger="hover"
            />
          </div>
        </template>
      </EgDataListColumn>

      <EgDataListColumn
        prop="amount"
        :label="ui('Amount')"
        :min-width="BATCH_AMOUNT_COLUMN_MIN_WIDTH"
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
                  {{ ui('Type of Business') }}
                </EgDataListCellOverflow>
              </div>
            </div>
          </div>
        </template>
        <template #default="{ data }">
          <TasksDataListColumnCell
            data-source="amount"
            :column-min-width="BATCH_AMOUNT_COLUMN_MIN_WIDTH"
            column-align="right"
            menu-item="Signing"
            :row-index="rowIndexFromData(data)"
          />
        </template>
      </EgDataListColumn>

      <EgDataListColumn
        v-if="showIneligibleReasonColumn"
        prop="ineligibleReason"
        :label="ui('Ineligible transaction reasons')"
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
                {{ ui('Ineligible transaction reasons') }}
              </EgDataListCellOverflow>
            </div>
          </div>
        </template>
        <template #default="{ data }">
          <div :class="styles.batchIneligibleReasonCell">
            <EgListFieldOverflowText
              :text="String(data.ineligibleReasonLabel ?? '')"
              variant="primary"
              tooltip-trigger="hover"
            />
          </div>
        </template>
      </EgDataListColumn>
    </EgDataList>
  </div>
</template>
