<script setup lang="ts">
import TasksDataListColumnCell from '../TasksDataListColumnCell.vue';

defineProps<{
  columnMinWidth?: string;
  columnAlign?: 'left' | 'center' | 'right';
  menuItem: string | undefined;
  rowIndex: number;
}>();
</script>

<template>
  <TasksDataListColumnCell
    data-source="receiver"
    :column-min-width="columnMinWidth"
    :column-align="columnAlign"
    :menu-item="menuItem"
    :row-index="rowIndex"
  />
</template>
