<script setup lang="ts">
import { EgRadio } from '@eds/desktop-components';
import { formatGroupedLatencyLabel } from '@/utils/formatGroupedDisplay';
import rowStyles from './SigningCustomPopupItemRow.module.css';
import styles from './SigningMpcNetworkItemRow.module.css';

const props = defineProps<{
  label: string;
  latencyLabel: string;
  latencyColor: string;
  selected: boolean;
  radioName: string;
  radioValue: string;
}>();

const emit = defineEmits<{
  select: [];
}>();
</script>

<template>
  <div
    :class="[
      rowStyles.itemRow,
      styles.itemRow,
      selected && styles.itemRowSelected,
    ]"
    role="radio"
    tabindex="0"
    :aria-checked="selected"
    @click="emit('select')"
    @keydown.enter.prevent="emit('select')"
    @keydown.space.prevent="emit('select')"
  >
    <div :class="[rowStyles.itemTitle, styles.itemTitleRadio]">
      <EgRadio
        :class="styles.radio"
        :model-value="selected"
        :name="radioName"
        :value="radioValue"
        tabindex="-1"
        aria-hidden="true"
      />
    </div>

    <div :class="[rowStyles.itemValue, styles.itemValueStack]">
      <span :class="[rowStyles.itemValueText, rowStyles.itemValueTextNowrap, styles.networkLabel]">
        {{ label }}
      </span>
      <span
        :class="[rowStyles.itemValueText, rowStyles.itemValueTextNowrap, styles.latency]"
        :style="{ color: latencyColor }"
      >
        {{ formatGroupedLatencyLabel(latencyLabel) }}
      </span>
    </div>
  </div>
</template>
