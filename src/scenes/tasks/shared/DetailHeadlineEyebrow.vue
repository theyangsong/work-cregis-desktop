<script setup lang="ts">
import { computed } from 'vue';
import { EgDivider } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { splitBusinessTypeSecondaryKey } from '../list-field/businessTypeDisplay';
import detailChromeStyles from './detailPopupChrome.module.css';

const props = defineProps<{
  businessTypeKey: string;
}>();

const { ui } = useAppI18n();

const businessTypeParts = computed(() => {
  const parts = splitBusinessTypeSecondaryKey(props.businessTypeKey);
  if (!parts) return null;
  return {
    source: ui(parts.sourceKey),
    action: ui(parts.actionKey),
  };
});

const plainBusinessType = computed(() => ui(props.businessTypeKey));
</script>

<template>
  <span
    v-if="businessTypeParts"
    :class="detailChromeStyles.detailEyebrowRow"
  >
    <span>{{ businessTypeParts.source }}</span>
    <EgDivider
      type="navigator"
      direction="vertical"
      :class="detailChromeStyles.detailEyebrowDivider"
    />
    <span>{{ businessTypeParts.action }}</span>
  </span>
  <span
    v-else-if="businessTypeKey"
    :class="detailChromeStyles.detailEyebrowRow"
  >
    {{ plainBusinessType }}
  </span>
</template>
