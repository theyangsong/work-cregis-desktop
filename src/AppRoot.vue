<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import App from './App.vue';

const shellDebugEnabled = import.meta.env.DEV;

const ShellDebugPlatform = shellDebugEnabled
  ? defineAsyncComponent(() => import('@/dev/shell-debug/ShellDebugPlatform.vue'))
  : null;
</script>

<template>
  <App />
  <ShellDebugPlatform v-if="ShellDebugPlatform" />
</template>
