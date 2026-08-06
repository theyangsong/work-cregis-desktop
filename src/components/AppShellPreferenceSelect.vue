<script setup lang="ts">
import { computed } from 'vue';
import {
  EgFlotation,
  EgFlotationMenu,
  EgFlotationMenuItem,
  EgFlotationTrigger,
} from '@eds/desktop-components';
import styles from './AppShellPreferenceSelect.module.css';

export type AppShellPreferenceOption = {
  value: string;
  label: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: readonly AppShellPreferenceOption[];
    ariaLabel?: string;
  }>(),
  {
    ariaLabel: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectedLabel = computed(() => {
  const match = props.options.find((option) => option.value === props.modelValue);
  return match?.label ?? props.options[0]?.label ?? '';
});

function select(value: string, close: () => void) {
  if (value !== props.modelValue) {
    emit('update:modelValue', value);
  }
  close();
}
</script>

<template>
  <EgFlotation
    :class="styles.root"
    placement="bottom"
    align="start"
    :show-add="false"
    :show-menu-divider="false"
    close-on-scroll
  >
    <template #trigger="{ expanded }">
      <EgFlotationTrigger
        trigger-style="subtle"
        size="sm"
        width-mode="adaptive"
        :label="selectedLabel"
        :expanded="expanded"
        :aria-label="ariaLabel"
      />
    </template>

    <template #content="{ close }">
      <EgFlotationMenu
        :class="['desktopTokens', styles.menu]"
        data-no-corner-smoothing
        panel-radius="radius-md"
        width-mode="adaptive"
        height-mode="adaptive"
        :scrollable="false"
        :show-add="false"
        :show-divider="false"
      >
        <EgFlotationMenuItem
          v-for="option in options"
          :key="option.value"
          box-type="text"
          :label="option.label"
          :show-tag="false"
          :focused="option.value === modelValue"
          @click="select(option.value, close)"
        />
      </EgFlotationMenu>
    </template>
  </EgFlotation>
</template>
