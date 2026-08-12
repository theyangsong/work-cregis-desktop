<script setup lang="ts">
import { computed } from 'vue';
import RecordDetailFlowHost from '@/scenes/tasks/shared/RecordDetailFlowHost.vue';
import { recordDetailFlowRegistry } from '@/scenes/tasks/shared/recordDetailFlowContext';
import ApprovalFlowHost from '@/scenes/tasks/approval/ApprovalFlowHost.vue';
import { approvalFlowRegistry } from '@/scenes/tasks/approval/approvalFlowContext';
import SigningBatchFlowHost from '@/scenes/tasks/signing/batch/SigningBatchFlowHost.vue';
import SigningBatchGlobalProgressHost from '@/scenes/tasks/signing/batch/SigningBatchGlobalProgressHost.vue';
import { signingBatchFlowRegistry } from '@/scenes/tasks/signing/batch/signingBatchFlowContext';
import SigningFlowHost from '@/scenes/tasks/signing/SigningFlowHost.vue';
import { signingFlowRegistry } from '@/scenes/tasks/signing/signingFlowContext';

const approvalFlow = computed(() => approvalFlowRegistry.value);
const signingFlow = computed(() => signingFlowRegistry.value);
const signingBatchFlow = computed(() => signingBatchFlowRegistry.value);
const recordDetailFlow = computed(() => recordDetailFlowRegistry.value);
</script>

<template>
  <div class="app-popup-overlay-root">
    <div class="app-popup-overlay-host">
      <ApprovalFlowHost v-if="approvalFlow" :flow="approvalFlow" />
      <SigningFlowHost v-if="signingFlow" :flow="signingFlow" />
      <RecordDetailFlowHost v-if="recordDetailFlow" :flow="recordDetailFlow" />
      <SigningBatchFlowHost v-if="signingBatchFlow" :flow="signingBatchFlow" />
      <SigningBatchGlobalProgressHost />
    </div>
  </div>
</template>
