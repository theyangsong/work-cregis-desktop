<script setup lang="ts">
import { computed } from 'vue';
import AddressViewMoreReminderPopup from '../shared/AddressViewMoreReminderPopup.vue';
import TradePasswordVerifyPopup from '../shared/TradePasswordVerifyPopup.vue';
import ApprovalDetailPopup from './ApprovalDetailPopup.vue';
import type { useApprovalFlow } from './useApprovalFlow';

const props = defineProps<{
  flow: ReturnType<typeof useApprovalFlow>;
}>();

const detailOpen = computed({
  get: () => props.flow.detailOpen.value,
  set: (value: boolean) => {
    props.flow.detailOpen.value = value;
  },
});

const verifyOpen = computed({
  get: () => props.flow.verifyOpen.value,
  set: (value: boolean) => {
    props.flow.verifyOpen.value = value;
  },
});

const viewMoreOpen = computed({
  get: () => props.flow.viewMoreOpen.value,
  set: (value: boolean) => {
    props.flow.viewMoreOpen.value = value;
  },
});

/** Detail 关闭时 EgPopup 仍保留 detail 直至 @close（出场动画结束）。 */
const detailPopupMounted = computed(
  () => props.flow.detailOpen.value || props.flow.detail.value != null,
);

/** 上层 Popup 打开时暂挂下层 shell（走 EgPopup 出场动效，见 usePopupShellLifecycle.suspended）。 */
const detailShellSuspended = computed(
  () => props.flow.verifyOpen.value || props.flow.viewMoreOpen.value,
);

function onVerifyClosed(accepted: boolean) {
  props.flow.onVerifyPopupClosed(accepted);
}
</script>

<template>
  <ApprovalDetailPopup
    v-if="detailPopupMounted"
    v-model:open="detailOpen"
    :shell-suspended="detailShellSuspended"
    :detail="flow.detail.value"
    :current-index="flow.currentIndex.value"
    :total-count="flow.totalCount.value"
    :prev-disabled="flow.prevDisabled.value"
    :next-disabled="flow.nextDisabled.value"
    :on-remark-before-open="() => flow.prepareDetailRemarkOpen()"
    @popup-closed="flow.onDetailPopupClosed()"
    @prev="flow.navigateRelative(-1)"
    @next="flow.navigateRelative(1)"
    @pass-confirm="flow.onDetailPassConfirm()"
    @reject-confirm="flow.onDetailRejectConfirm()"
    @view-more="flow.openViewMore"
  />

  <AddressViewMoreReminderPopup
    v-model:open="viewMoreOpen"
    :shell-suspended="verifyOpen"
    :text="flow.viewMoreText.value"
  />

  <TradePasswordVerifyPopup
    v-model:open="verifyOpen"
    :submit="(code) => flow.onVerifyConfirm(code)"
    @closed="onVerifyClosed"
  />
</template>
