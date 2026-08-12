<script setup lang="ts">
import { EgIcon, EgIconButtonPro } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';

const { ui } = useAppI18n();

function onFilterClick() {
  // TopTool 筛选仅作视觉入口，与列表头下拉筛选分离，暂不挂载功能。
}
</script>

<template>
  <EgIconButtonPro :label="ui('Filter')" @click="onFilterClick">
    <EgIcon name="eds-filter" size="sm" />
  </EgIconButtonPro>
</template>
