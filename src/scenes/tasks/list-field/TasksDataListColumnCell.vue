<script setup lang="ts">
import { computed } from 'vue';
import TasksListFieldAmount from './TasksListFieldAmount.vue';
import TasksListFieldCurrency from './TasksListFieldCurrency.vue';
import TasksListFieldGeneralStructure from './TasksListFieldGeneralStructure.vue';
import TasksListFieldStatus from './TasksListFieldStatus.vue';
import { buildTasksListFieldAmountCustomize } from './tasksListFieldAmountDefaults';
import { buildTasksListFieldBusinessTypeCustomize } from './tasksListFieldBusinessTypeDefaults';
import { buildTasksListFieldCurrencyCustomize } from './tasksListFieldCurrencyDefaults';
import { buildTasksListFieldGeneralStructureCustomize } from './tasksListFieldGeneralStructureDefaults';
import { buildTasksListFieldStatusCustomize } from './tasksListFieldStatusDefaults';
import styles from './TasksDataListColumnCell.module.css';

const props = withDefaults(
  defineProps<{
    dataSource:
      | 'placeholder'
      | 'currency'
      | 'general-structure'
      | 'business-type'
      | 'status'
      | 'amount'
      | 'action';
    columnMinWidth?: string;
    columnAlign?: 'left' | 'center' | 'right';
    menuItem?: string;
    variant?: 'combo' | 'cell';
    rowIndex?: number;
  }>(),
  {
    columnMinWidth: '',
    columnAlign: 'left',
    menuItem: undefined,
    variant: 'cell',
  },
);

const listFieldCustomize = computed(() => {
  if (props.dataSource === 'currency') {
    return buildTasksListFieldCurrencyCustomize(props.rowIndex, props.columnMinWidth);
  }
  if (props.dataSource === 'general-structure') {
    return buildTasksListFieldGeneralStructureCustomize(props.columnMinWidth, props.rowIndex);
  }
  if (props.dataSource === 'business-type') {
    return buildTasksListFieldBusinessTypeCustomize(
      props.columnMinWidth,
      props.rowIndex,
      props.menuItem,
    );
  }
  if (props.dataSource === 'status') {
    return buildTasksListFieldStatusCustomize(
      props.columnMinWidth,
      props.rowIndex,
      props.menuItem,
    );
  }
  if (props.dataSource === 'amount') {
    return buildTasksListFieldAmountCustomize(
      props.columnMinWidth,
      props.rowIndex,
      props.columnAlign,
    );
  }
  return null;
});
</script>

<template>
  <div v-if="dataSource === 'currency' && listFieldCustomize" :class="styles.listFieldCell" @click.stop>
    <TasksListFieldCurrency :customize="listFieldCustomize" />
  </div>
  <div v-else-if="dataSource === 'general-structure' && listFieldCustomize" :class="styles.listFieldCell">
    <TasksListFieldGeneralStructure :customize="listFieldCustomize" />
  </div>
  <div v-else-if="dataSource === 'business-type' && listFieldCustomize" :class="styles.listFieldCell">
    <TasksListFieldGeneralStructure :customize="listFieldCustomize" />
  </div>
  <div v-else-if="dataSource === 'status' && listFieldCustomize" :class="[styles.listFieldCell, styles.statusFieldCell]">
    <TasksListFieldStatus :customize="listFieldCustomize" />
  </div>
  <div v-else-if="dataSource === 'amount' && listFieldCustomize" :class="styles.listFieldCell">
    <TasksListFieldAmount :customize="listFieldCustomize" />
  </div>
  <div v-else-if="variant === 'combo'" :class="styles.fieldItem">
    <span :class="styles.fieldBarPrimary" aria-hidden="true" />
    <span :class="styles.fieldBarSecondary" aria-hidden="true" />
  </div>
  <span v-else :class="styles.cellBar" aria-hidden="true" />
</template>
