<script setup lang="ts">
import { computed } from 'vue';
import ApprovalFlowHost from '@/scenes/tasks/approval/ApprovalFlowHost.vue';
import { approvalFlowRegistry } from '@/scenes/tasks/approval/approvalFlowContext';
import SigningFlowHost from '@/scenes/tasks/signing/SigningFlowHost.vue';
import { signingFlowRegistry } from '@/scenes/tasks/signing/signingFlowContext';

const approvalFlow = computed(() => approvalFlowRegistry.value);
const signingFlow = computed(() => signingFlowRegistry.value);
</script>

<template>
  <div class="app-popup-overlay-host">
    <ApprovalFlowHost v-if="approvalFlow" :flow="approvalFlow" />
    <SigningFlowHost v-if="signingFlow" :flow="signingFlow" />
  </div>
</template>
