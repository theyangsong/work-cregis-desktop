<script setup lang="ts">
import { EgToast } from '@eds/desktop-components';

defineProps<{
  keepMounted: boolean;
  motionActive: boolean;
  text: string;
}>();
</script>

<template>
  <Teleport to=".app-popup-overlay-root">
    <div
      v-if="keepMounted"
      :class="['detail-aml-toast-host', motionActive && 'is-active']"
    >
      <div class="motion-flotation desktopTokens">
        <EgToast type="result" :text="text" />
      </div>
    </div>
  </Teleport>
</template>
