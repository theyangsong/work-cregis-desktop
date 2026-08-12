<script setup lang="ts">
import { computed } from 'vue';
import {
  EgDataListCellOverflow,
  EgFlotation,
  EgFlotationMenu,
  EgFlotationMenuItem,
  EgIcon,
  EgIconButton,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import dataListStyles from '../../../../../../eds-desktop/packages/components/src/organisms/data-list/DataList.module.css';
import {
  BATCH_INELIGIBLE_REASON_LABELS,
} from './evaluateBatchEligibility';
import {
  formatIneligibleReasonWithCount,
  type BatchIneligibleReasonFilter,
} from './batchIneligibleReasonFilter';
import type { BatchIneligibleReason } from './types';
import styles from './batchSigning.shared.module.css';

const props = defineProps<{
  modelValue: BatchIneligibleReasonFilter;
  groups: Array<{ reason: BatchIneligibleReason; count: number }>;
  totalCount: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: BatchIneligibleReasonFilter];
}>();

const { ui } = useAppI18n();

const filterTriggerLabel = computed(() =>
  ui('Filter ineligible transaction reasons'),
);

const reasonHeaderTextClass = computed(
  () => `${dataListStyles.headerText} ${styles.ineligibleReasonFilterLabel}`,
);

function chooseFilter(value: BatchIneligibleReasonFilter, close: () => void) {
  emit('update:modelValue', value);
  close();
}
</script>

<template>
  <div :class="[dataListStyles.headerTitleGroup, styles.ineligibleReasonFilterHeader]">
    <div :class="styles.ineligibleReasonFilterLabelWrap">
      <EgDataListCellOverflow
        :content-class="reasonHeaderTextClass"
        context="header"
      >
        {{ ui('Ineligible transaction reasons') }}
      </EgDataListCellOverflow>
    </div>
    <EgFlotation
      :class="dataListStyles.sortDropdown"
      placement="bottom"
      align="end"
      :show-add="false"
      :show-menu-divider="false"
      boundary-selector=".app-preview"
      flip
      close-on-scroll
    >
      <template #trigger="{ expanded }">
        <EgIconButton
          shape="square"
          size="xs"
          data-no-corner-smoothing
          :label="filterTriggerLabel"
          :aria-expanded="expanded"
          :class="[
            dataListStyles.sortTrigger,
            expanded && dataListStyles.sortTriggerFocus,
            modelValue !== 'all' && dataListStyles.sortTriggerFocus,
          ]"
        >
          <EgIcon
            :name="expanded ? 'eds-arrow-up-mini-ios' : 'eds-arrow-down-mini-ios'"
            fit
          />
        </EgIconButton>
      </template>

      <template #content="{ close }">
        <EgFlotationMenu
          :class="[dataListStyles.sortMenu, 'desktopTokens']"
          data-no-corner-smoothing
          panel-radius="radius-md"
          width-mode="adaptive"
          height-mode="adaptive"
          :scrollable="false"
          :show-add="false"
          :show-divider="false"
        >
          <EgFlotationMenuItem
            box-type="text"
            :label="formatIneligibleReasonWithCount(ui('All Records'), totalCount)"
            :show-tag="false"
            :focused="modelValue === 'all'"
            @click="chooseFilter('all', close)"
          />
          <EgFlotationMenuItem
            v-for="group in groups"
            :key="group.reason"
            box-type="text"
            :label="formatIneligibleReasonWithCount(
              ui(BATCH_INELIGIBLE_REASON_LABELS[group.reason]),
              group.count,
            )"
            :show-tag="false"
            :focused="modelValue === group.reason"
            @click="chooseFilter(group.reason, close)"
          />
        </EgFlotationMenu>
      </template>
    </EgFlotation>
  </div>
</template>
