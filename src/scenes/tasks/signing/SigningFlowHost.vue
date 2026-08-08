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

const viewMoreOpen = computed({
  get: () => props.flow.viewMoreOpen.value,
  set: (value: boolean) => {
    props.flow.viewMoreOpen.value = value;
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

const detailPopupMounted = computed(
  () => props.flow.detailOpen.value || props.flow.detail.value != null,
);

const detailShellSuspended = computed(
  () =>
    props.flow.verifyOpen.value
    || props.flow.viewMoreOpen.value
    || props.flow.progressOpen.value
    || props.flow.multiSignOpen.value,
);

const viewMoreShellSuspended = computed(
  () =>
    props.flow.verifyOpen.value
    || props.flow.progressOpen.value
    || props.flow.multiSignOpen.value,
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

function onMultiSignSign() {
  props.flow.requestMultiSignProgress();
}

function onViewMoreClosed() {
  props.flow.viewMoreOpen.value = false;
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
    :remark="flow.remark.value"
    :on-remark-before-open="() => flow.prepareDetailRemarkOpen()"
    @update:remark="flow.remark.value = $event"
    @popup-closed="flow.onDetailPopupClosed()"
    @shell-opened="flow.onDetailShellOpened()"
    @prev="flow.navigateRelative(-1)"
    @next="flow.navigateRelative(1)"
    @pass-confirm="flow.onDetailPassConfirm()"
    @reject-confirm="flow.onDetailRejectConfirm()"
    @view-more-sender="flow.openViewMore('sender')"
    @view-more-receiver="flow.openViewMore('receiver')"
  />

  <TradePasswordVerifyPopup
    v-model:open="verifyOpen"
    :submit="(code) => flow.onVerifyConfirm(code)"
    @closed="onVerifyClosed"
  />

  <MultiSignWaitingPopup
    v-model:open="multiSignOpen"
    :detail="flow.detail.value"
    :phase="flow.multiSignPhase.value"
    :joined-count="flow.multiSignJoinedCount.value"
    @close="onMultiSignPopupClosed"
    @sign="onMultiSignSign"
  />

  <SigningProgressPopup
    v-model:open="progressOpen"
    :detail="flow.detail.value"
    :phase="flow.progressPhase.value"
    @close="onProgressPopupClosed"
  />

  <AddressViewMoreReminderPopup
    v-model:open="viewMoreOpen"
    :shell-suspended="viewMoreShellSuspended"
    :text="flow.viewMoreText.value"
    @closed="onViewMoreClosed"
  />
</template>
