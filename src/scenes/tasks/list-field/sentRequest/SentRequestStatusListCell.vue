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
    data-source="status"
    :column-min-width="columnMinWidth"
    column-align="right"
    :menu-item="menuItem"
    :row-index="rowIndex"
  />
</template>
