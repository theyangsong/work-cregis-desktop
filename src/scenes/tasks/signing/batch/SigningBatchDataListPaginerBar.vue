<script setup lang="ts" generic="T">
import { computed, useSlots, watch } from 'vue';
import {
  EgIcon,
  EgPaginer,
  EgPaginationItem,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import { useDataListPaginer } from '../../useDataListPaginer';
import {
  DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS,
  DATA_LIST_FIGMA_PAGINER,
} from '../../tasksDataListPageData';
import styles from './batchSigning.shared.module.css';

const props = defineProps<{
  items: readonly T[];
}>();

const emit = defineEmits<{
  'paginated-change': [items: T[]];
}>();

const { ui } = useAppI18n();
const slots = useSlots();

const hasActions = computed(() => Boolean(slots.actions));

const {
  settingsLevelIndex,
  settingsJumpValue,
  currentPage,
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
} = useDataListPaginer(() => props.items.length);

const paginatedItems = computed(() => paginateItems(props.items));

const displayPaginerTotal = computed(() => ui(DATA_LIST_FIGMA_PAGINER.dataVolumeTotal));
const displayPaginerResults = computed(() => ui(DATA_LIST_FIGMA_PAGINER.dataVolumeResults));

watch(
  paginatedItems,
  (items) => {
    emit('paginated-change', items);
  },
  { immediate: true },
);
</script>

<template>
  <div
    :class="[
      styles.batchPopupPaginerWrap,
      hasActions && styles.batchPopupPaginerWrapWithActions,
    ]"
  >
    <EgPaginer
      v-model:settings-level-index="settingsLevelIndex"
      v-model:settings-jump-value="settingsJumpValue"
      :class="styles.batchPopupPaginerBar"
      :show-statistics="false"
    :data-volume-total="displayPaginerTotal"
    :data-volume-count="formatGroupedNumber(totalRowCount)"
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

    <div v-if="hasActions" :class="styles.batchPopupPaginerActions">
      <slot name="actions" />
    </div>
  </div>
</template>
