<script setup lang="ts">
import { EgAnchoredTooltip, EgIcon, EgIconButton } from '@eds/desktop-components';
import styles from './DetailValueActionIcon.module.css';

withDefaults(
  defineProps<{
    label: string;
    icon: string;
    boundarySelector?: string;
  }>(),
  {
    boundarySelector: '.eds-popup',
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <EgAnchoredTooltip
    trigger="hover"
    placement="bottom"
    align="center"
    panel-kind="flotation"
    width-mode="adaptive"
    height-mode="adaptive"
    :scrollable="false"
    close-on-scroll
    :boundary-selector="boundarySelector"
    :open-delay="120"
    :close-delay="80"
    token-scope-class="desktopTokens"
  >
    <EgIconButton
      shape="square"
      size="xs"
      :label="label"
      @click="emit('click', $event)"
    >
      <EgIcon :name="icon" fit />
    </EgIconButton>
    <template #content>
      <span :class="styles.tooltipLabel">{{ label }}</span>
    </template>
  </EgAnchoredTooltip>
</template>
