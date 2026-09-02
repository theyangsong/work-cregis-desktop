<script setup lang="ts">
import { EgTag, type TagSystemType } from '@eds/desktop-components';
import styles from './TasksListFieldRowTag.module.css';

withDefaults(
  defineProps<{
    label: string;
    systemType?: TagSystemType;
  }>(),
  {
    systemType: 'gray',
  },
);
</script>

<template>
  <span :class="styles.rowTagHost">
    <EgTag size="sm" :system-type="systemType">
      {{ label }}
    </EgTag>
  </span>
</template>
