<script setup lang="ts">
import { computed } from 'vue';
import TradePasswordVerifyPopup from '../../shared/TradePasswordVerifyPopup.vue';
import type { SigningBatchFlowInstance } from './useSigningBatchFlow';
import SigningBatchQuotaAlertPopup from './SigningBatchQuotaAlertPopup.vue';
import SigningBatchSignConfirmPopup from './SigningBatchSignConfirmPopup.vue';

const props = defineProps<{
  flow: SigningBatchFlowInstance;
}>();

function bindFlowOpen(key: keyof Pick<
  SigningBatchFlowInstance,
  | 'signConfirmOpen'
  | 'quotaAlertOpen'
  | 'verifyOpen'
>) {
  return computed({
    get: () => props.flow[key].value,
    set: (value: boolean) => {
      props.flow[key].value = value;
    },
  });
}

const signConfirmOpen = bindFlowOpen('signConfirmOpen');
const quotaAlertOpen = bindFlowOpen('quotaAlertOpen');
const verifyOpen = bindFlowOpen('verifyOpen');

const quotaRemainingUsd = computed(
  () => props.flow.quotaFailure.value?.remainingUsd ?? 0,
);
const quotaOverageFeeUsd = computed(
  () => props.flow.quotaFailure.value?.overageFeeUsd ?? 0,
);

const signConfirmShellSuspended = computed(
  () => props.flow.verifyOpen.value || props.flow.quotaAlertOpen.value,
);
</script>

<template>
  <SigningBatchSignConfirmPopup
    v-model:open="signConfirmOpen"
    :shell-suspended="signConfirmShellSuspended"
    :eligibility="flow.eligibility.value"
    :summary="flow.signSummary.value"
    :remark="flow.remark.value"
    :miner-fee-profile="flow.batchMinerFeeProfile.value"
    :pending-transaction-count="flow.pendingRowIndexes.value.length"
    @update:remark="flow.remark.value = $event"
    @cancel="flow.onSignConfirmCancel()"
    @confirm="(selection) => {
      flow.onBatchMinerFeeConfirm(selection);
      flow.onSignConfirmProceed();
    }"
  />

  <SigningBatchQuotaAlertPopup
    v-model:open="quotaAlertOpen"
    :remaining-usd="quotaRemainingUsd"
    :overage-fee-usd="quotaOverageFeeUsd"
    @continue="flow.onQuotaAlertContinue()"
    @close="flow.onQuotaAlertClose()"
  />

  <TradePasswordVerifyPopup
    v-model:open="verifyOpen"
    :submit="(code) => flow.onVerifyConfirm(code)"
    @closed="flow.onVerifyClosed"
  />
</template>
