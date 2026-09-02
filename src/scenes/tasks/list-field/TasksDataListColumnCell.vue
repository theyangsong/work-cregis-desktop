<script setup lang="ts">
import { computed } from 'vue';
import TasksListFieldAmount from './TasksListFieldAmount.vue';
import TasksListFieldGeneralStructure from './TasksListFieldGeneralStructure.vue';
import TasksListFieldOperationType from './TasksListFieldOperationType.vue';
import TasksListFieldReceiver from './TasksListFieldReceiver.vue';
import TasksListFieldSender from './TasksListFieldSender.vue';
import TasksListFieldStatus from './TasksListFieldStatus.vue';
import TasksListFieldTime from './TasksListFieldTime.vue';
import { buildTasksListFieldAmountCustomize } from './tasksListFieldAmountDefaults';
import { buildTasksListFieldBusinessTypeCustomize } from './tasksListFieldBusinessTypeDefaults';
import { buildTasksListFieldGeneralStructureCustomize } from './tasksListFieldGeneralStructureDefaults';
import { buildTasksListFieldOperationTypeCustomize } from './tasksListFieldOperationTypeDefaults';
import { buildTasksListFieldReceiverCustomize } from './tasksListFieldReceiverDefaults';
import { buildTasksListFieldStatusCustomize } from './tasksListFieldStatusDefaults';
import { buildTasksListFieldTimeCustomize } from './tasksListFieldTimeDefaults';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './TasksDataListColumnCell.module.css';

const props = withDefaults(
  defineProps<{
    dataSource:
      | 'placeholder'
      | 'currency'
      | 'general-structure'
      | 'operation-type'
      | 'business-type'
      | 'status'
      | 'amount'
      | 'receiver'
      | 'created-time'
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

const { locale } = useAppI18n();

/** 旧 customize 仍可能用 currency；与 receiver 列同源。 */
const resolvedDataSource = computed(() =>
  props.dataSource === 'currency' ? 'receiver' : props.dataSource,
);

const listFieldCustomize = computed(() => {
  void locale.value;
  if (resolvedDataSource.value === 'receiver') {
    return buildTasksListFieldReceiverCustomize(
      props.rowIndex,
      props.columnMinWidth,
      props.menuItem,
    );
  }
  if (resolvedDataSource.value === 'general-structure') {
    return buildTasksListFieldGeneralStructureCustomize(
      props.columnMinWidth,
      props.rowIndex,
      props.menuItem,
      locale.value,
    );
  }
  if (resolvedDataSource.value === 'operation-type') {
    return buildTasksListFieldOperationTypeCustomize(
      props.columnMinWidth,
      props.rowIndex,
      props.menuItem,
    );
  }
  if (resolvedDataSource.value === 'business-type') {
    return buildTasksListFieldBusinessTypeCustomize(
      props.columnMinWidth,
      props.rowIndex,
      props.menuItem,
      locale.value,
    );
  }
  if (resolvedDataSource.value === 'status') {
    return buildTasksListFieldStatusCustomize(
      props.columnMinWidth,
      props.rowIndex,
      props.menuItem,
    );
  }
  if (resolvedDataSource.value === 'created-time') {
    return buildTasksListFieldTimeCustomize(props.columnMinWidth, props.rowIndex);
  }
  if (resolvedDataSource.value === 'amount') {
    return buildTasksListFieldAmountCustomize(
      props.columnMinWidth,
      props.rowIndex,
      props.columnAlign,
      props.menuItem,
    );
  }
  return null;
});
</script>

<template>
  <div v-if="resolvedDataSource === 'receiver' && listFieldCustomize" :class="[
    styles.listFieldCell,
    columnAlign === 'right' && styles.receiverFieldCellEnd,
  ]">
    <TasksListFieldReceiver
      :customize="listFieldCustomize"
      :align-end="columnAlign === 'right'"
    />
  </div>
  <div v-else-if="resolvedDataSource === 'general-structure' && listFieldCustomize" :class="styles.listFieldCell">
    <TasksListFieldGeneralStructure :customize="listFieldCustomize" />
  </div>
  <div
    v-else-if="resolvedDataSource === 'operation-type' && listFieldCustomize"
    :class="styles.listFieldCell"
  >
    <TasksListFieldOperationType :customize="listFieldCustomize" />
  </div>
  <div
    v-else-if="resolvedDataSource === 'business-type' && listFieldCustomize"
    :class="[
      styles.listFieldCell,
      columnAlign === 'right' && styles.senderFieldCellEnd,
    ]"
  >
    <TasksListFieldSender
      :customize="listFieldCustomize"
      :align-end="columnAlign === 'right'"
    />
  </div>
  <div
    v-else-if="resolvedDataSource === 'status' && listFieldCustomize"
    :class="[
      styles.listFieldCell,
      columnAlign === 'right' ? styles.statusFieldCellEnd : styles.statusFieldCell,
    ]"
  >
    <TasksListFieldStatus
      :customize="listFieldCustomize"
      :align-end="columnAlign === 'right'"
    />
  </div>
  <div v-else-if="resolvedDataSource === 'created-time' && listFieldCustomize" :class="styles.listFieldCell">
    <TasksListFieldTime :customize="listFieldCustomize" />
  </div>
  <div v-else-if="resolvedDataSource === 'amount' && listFieldCustomize" :class="styles.listFieldCell">
    <TasksListFieldAmount :customize="listFieldCustomize" />
  </div>
  <div v-else-if="variant === 'combo'" :class="styles.fieldItem">
    <span :class="styles.fieldBarPrimary" aria-hidden="true" />
    <span :class="styles.fieldBarSecondary" aria-hidden="true" />
  </div>
  <span v-else :class="styles.cellBar" aria-hidden="true" />
</template>
