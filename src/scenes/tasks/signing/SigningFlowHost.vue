<script setup lang="ts">
import { computed } from 'vue';
import AddressViewMoreReminderPopup from '../shared/AddressViewMoreReminderPopup.vue';
import TradePasswordVerifyPopup from '../shared/TradePasswordVerifyPopup.vue';
import MultiSignWaitingPopup from './MultiSignWaitingPopup.vue';
import SigningDetailPopup from './SigningDetailPopup.vue';
import SigningProgressPopup from './SigningProgressPopup.vue';
import type { useSigningFlow } from './useSigningFlow';

const props = defineProps<{
  flow: ReturnType<typeof useSigningFlow>;
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

const progressOpen = computed({
  get: () => props.flow.progressOpen.value,
  set: (value: boolean) => {
    props.flow.progressOpen.value = value;
  },
});

const multiSignOpen = computed({
  get: () => props.flow.multiSignOpen.value,
  set: (value: boolean) => {
    props.flow.multiSignOpen.value = value;
  },
});

const viewMoreOpen = computed({
  get: () => props.flow.viewMoreOpen.value,
  set: (value: boolean) => {
    props.flow.viewMoreOpen.value = value;
  },
});

const detailPopupMounted = computed(
  () => props.flow.detailOpen.value || props.flow.detail.value != null,
);

const detailShellSuspended = computed(
  () =>
    props.flow.verifyOpen.value
    || props.flow.progressOpen.value
    || props.flow.multiSignOpen.value
    || props.flow.viewMoreOpen.value,
);

function onVerifyClosed(accepted: boolean) {
  props.flow.onVerifyPopupClosed(accepted);
}

function onProgressPopupClosed() {
  props.flow.onProgressClosed();
}

function onMultiSignPopupClosed() {
  props.flow.onMultiSignPopupClosed();
}
</script>

<template>
  <SigningDetailPopup
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
    @pass-confirm="flow.onDetailPassConfirm($event)"
    @reject-confirm="flow.onDetailRejectConfirm()"
    @view-more="flow.openViewMore"
  />

  <AddressViewMoreReminderPopup
    v-model:open="viewMoreOpen"
    :shell-suspended="verifyOpen || progressOpen || multiSignOpen"
    :text="flow.viewMoreText.value"
  />

  <TradePasswordVerifyPopup
    v-model:open="verifyOpen"
    :submit="(code) => flow.onVerifyConfirm(code)"
    @closed="onVerifyClosed"
  />

  <MultiSignWaitingPopup
    v-model:open="multiSignOpen"
    :dismiss-without-animation="flow.multiSignClosingForProgress.value"
    :detail="flow.detail.value"
    :phase="flow.multiSignPhase.value"
    :perspective="flow.multiSignPerspective.value"
    :joined-count="flow.multiSignJoinedCount.value"
    :remark="flow.remark.value"
    :miner-fee-display="flow.selectedMinerFeeDisplay.value"
    @update:remark="flow.remark.value = $event"
    @ready-confirm="flow.onMultiSignReadyConfirm($event)"
    @close="onMultiSignPopupClosed"
  />

  <SigningProgressPopup
    v-model:open="progressOpen"
    :detail="flow.detail.value"
    :phase="flow.progressPhase.value"
    :miner-fee-display="flow.selectedMinerFeeDisplay.value"
    @close="onProgressPopupClosed"
    @retry="flow.retryProgressAfterSignFailed()"
  />
</template>
