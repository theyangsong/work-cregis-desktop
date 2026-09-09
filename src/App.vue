<script setup lang="ts">
import { EgContainer, EgTooltipPanel } from '@eds/desktop-components';
import { RouterView } from 'vue-router';
import AppPopupOverlayHost from '@/components/AppPopupOverlayHost.vue';
import MultiSignInvitationFloatHost from '@/scenes/tasks/signing/multiSignInvitation/MultiSignInvitationFloatHost.vue';
</script>

<template>
  <EgTooltipPanel
    panel-kind="container"
    panel-radius="radius-lg"
    :scrollable="true"
    class="app-preview desktopTokens"
  >
    <EgContainer class="app-shell-container">
      <RouterView />
    </EgContainer>
    <AppPopupOverlayHost />
    <MultiSignInvitationFloatHost />
  </EgTooltipPanel>
</template>
