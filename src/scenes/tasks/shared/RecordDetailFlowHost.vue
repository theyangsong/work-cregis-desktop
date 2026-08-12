<script setup lang="ts">
import { computed } from 'vue';
import AddressViewMoreReminderPopup from './AddressViewMoreReminderPopup.vue';
import ApprovalDetailPopup from '../approval/ApprovalDetailPopup.vue';
import SigningDetailPopup from '../signing/SigningDetailPopup.vue';
import type { RecordDetailFlowInstance } from './recordDetailFlowContext';

const props = defineProps<{
  flow: RecordDetailFlowInstance;
}>();

const detailOpen = computed({
  get: () => props.flow.detailOpen.value,
  set: (value: boolean) => {
    props.flow.detailOpen.value = value;
  },
});

const viewMoreOpen = computed({
  get: () => props.flow.viewMoreOpen.value,
  set: (value: boolean) => {
    props.flow.viewMoreOpen.value = value;
  },
});

const approvalPopupMounted = computed(
  () =>
    props.flow.detailKind.value === 'approval'
    && (props.flow.detailOpen.value || props.flow.approvalDetail.value != null),
);

const signingPopupMounted = computed(
  () =>
    props.flow.detailKind.value === 'signing'
    && (props.flow.detailOpen.value || props.flow.signingDetail.value != null),
);
</script>

<template>
  <ApprovalDetailPopup
    v-if="approvalPopupMounted"
    v-model:open="detailOpen"
    :read-only="true"
    :detail="flow.approvalDetail.value"
    :current-index="flow.currentIndex.value"
    :total-count="flow.totalCount.value"
    :prev-disabled="flow.prevDisabled.value"
    :next-disabled="flow.nextDisabled.value"
    :list-status-label="flow.statusTagLabel.value"
    :list-status-kind="flow.statusTagStatus.value"
    @popup-closed="flow.onDetailPopupClosed()"
    @prev="flow.navigateRelative(-1)"
    @next="flow.navigateRelative(1)"
    @view-more="flow.openViewMore"
  />

  <SigningDetailPopup
    v-if="signingPopupMounted"
    v-model:open="detailOpen"
    :read-only="true"
    :detail="flow.signingDetail.value"
    :current-index="flow.currentIndex.value"
    :total-count="flow.totalCount.value"
    :prev-disabled="flow.prevDisabled.value"
    :next-disabled="flow.nextDisabled.value"
    :list-status-label="flow.statusTagLabel.value"
    :list-status-kind="flow.statusTagStatus.value"
    @popup-closed="flow.onDetailPopupClosed()"
    @prev="flow.navigateRelative(-1)"
    @next="flow.navigateRelative(1)"
    @view-more="flow.openViewMore"
  />

  <AddressViewMoreReminderPopup
    v-model:open="viewMoreOpen"
    :shell-suspended="detailOpen"
    :text="flow.viewMoreText.value"
  />
</template>
