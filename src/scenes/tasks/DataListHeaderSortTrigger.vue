<script setup lang="ts">
import { computed } from 'vue';
import {
  EgFlotation,
  EgFlotationMenu,
  EgFlotationMenuItem,
  EgIcon,
  EgIconButton,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import type { TasksDataListSortOrder } from './tasksDataListSort';
import dataListStyles from '../../../../eds-desktop/packages/components/src/organisms/data-list/DataList.module.css';

const props = withDefaults(
  defineProps<{
    label?: string;
    disabled?: boolean;
    activeOrder?: TasksDataListSortOrder | '';
  }>(),
  {
    label: '',
    disabled: false,
    activeOrder: '',
  },
);

const emit = defineEmits<{
  'sort-change': [order: TasksDataListSortOrder | null];
}>();

const { ui } = useAppI18n();

const sortTriggerLabel = computed(() => {
  const header = props.label.trim();
  return header ? ui(`Sort ${header}`) : ui('Sort');
});

function chooseSort(order: TasksDataListSortOrder, close: () => void) {
  emit('sort-change', props.activeOrder === order ? null : order);
  close();
}
</script>

<template>
  <EgFlotation
    :class="dataListStyles.sortDropdown"
    placement="bottom"
    align="start"
    :disabled="disabled"
    :show-add="false"
    :show-menu-divider="false"
    close-on-scroll
  >
    <template #trigger="{ expanded }">
      <EgIconButton
        shape="square"
        size="xs"
        data-no-corner-smoothing
        :label="sortTriggerLabel"
        :aria-expanded="expanded"
        :disabled="disabled"
        :class="[
          dataListStyles.sortTrigger,
          expanded && dataListStyles.sortTriggerFocus,
          disabled && dataListStyles.sortTriggerDisabled,
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
          :label="ui('Ascending')"
          :show-tag="false"
          :focused="activeOrder === 'asc'"
          @click="chooseSort('asc', close)"
        />
        <EgFlotationMenuItem
          box-type="text"
          :label="ui('Descending')"
          :show-tag="false"
          :focused="activeOrder === 'desc'"
          @click="chooseSort('desc', close)"
        />
      </EgFlotationMenu>
    </template>
  </EgFlotation>
</template>
