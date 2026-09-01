<script setup lang="ts">
import { EgDivider } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import type { DetailApprovalProgressStep } from './detailApprovalProgress.types';
import DetailApprovalProgressTimeline from './DetailApprovalProgressTimeline.vue';
import detailChromeStyles from './detailPopupChrome.module.css';

defineProps<{
  steps: DetailApprovalProgressStep[];
}>();

const { ui } = useAppI18n();
</script>

<template>
  <div :class="detailChromeStyles.appendSection">
    <EgDivider type="page" direction="horizontal" :class="detailChromeStyles.sectionDivider" />
    <div :class="detailChromeStyles.sectionContent">
      <div :class="detailChromeStyles.sectionTitleRow">
        <span :class="detailChromeStyles.sectionTitle">{{ ui('Approval Progress') }}</span>
      </div>
      <DetailApprovalProgressTimeline :steps="steps" />
    </div>
  </div>
</template>
