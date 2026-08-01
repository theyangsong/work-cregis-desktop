<script setup lang="ts">
import TasksDataListColumnCell from '../TasksDataListColumnCell.vue';

defineProps<{
  columnMinWidth?: string;
  menuItem: string | undefined;
  rowIndex: number;
}>();
</script>

<template>
  <TasksDataListColumnCell
    data-source="operation-type"
    :column-min-width="columnMinWidth"
    :menu-item="menuItem"
    :row-index="rowIndex"
  />
</template>
