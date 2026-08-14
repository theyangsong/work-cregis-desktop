<script setup lang="ts">
import { defineAsyncComponent, onErrorCaptured, ref } from 'vue';
import App from './App.vue';

const shellDebugEnabled = import.meta.env.VITE_SHELL_DEBUG !== 'false';
const shellDebugFailed = ref(false);

const ShellDebugPlatform = shellDebugEnabled
  ? defineAsyncComponent(() => import('@/dev/shell-debug/ShellDebugPlatform.vue'))
  : null;

onErrorCaptured((error, _instance, info) => {
  if (info.includes('ShellDebugPlatform')) {
    shellDebugFailed.value = true;
    return false;
  }
  return true;
});
</script>

<template>
  <App />
  <Teleport v-if="ShellDebugPlatform && !shellDebugFailed" to="body">
    <ShellDebugPlatform />
  </Teleport>
</template>
