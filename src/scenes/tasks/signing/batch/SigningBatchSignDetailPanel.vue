<script setup lang="ts">
import type { SigningBatchRowModel } from './types';
import SigningBatchDetailTable from './SigningBatchDetailTable.vue';

defineProps<{
  rows: SigningBatchRowModel[];
}>();
</script>

<template>
  <SigningBatchDetailTable :rows="rows" fill />
</template>
