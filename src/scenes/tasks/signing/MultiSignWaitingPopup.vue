<script setup lang="ts">
import { computed, toRef } from 'vue';
import { EgButton, EgPopup } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { usePopupShellLifecycle } from '../shared/usePopupShellLifecycle';
import {
  buildSigningCustomPopupItems,
  resolveSigningCustomPopupCurrencyMeta,
} from './buildSigningCustomPopupItems';
import { buildMultiSignWaitingPopupSteps } from './buildSigningCustomPopupProgressSteps';
import SigningCustomPopupPanel from './SigningCustomPopupPanel.vue';
import {
  SIGNING_CUSTOM_POPUP_HEIGHT,
  SIGNING_CUSTOM_POPUP_WIDTH,
} from './signingCustomPopup.constants';
import type { SigningDetail } from './types';

const props = defineProps<{
  open: boolean;
  detail: SigningDetail | null;
  phase: 'waiting' | 'ready';
  joinedCount: number;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  close: [];
  sign: [];
}>();

const { ui } = useAppI18n();

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  onClosed: () => {
    emit('update:open', false);
    emit('close');
  },
});

const currencyMeta = computed(() =>
  props.detail ? resolveSigningCustomPopupCurrencyMeta(props.detail) : null,
);

const items = computed(() =>
  props.detail ? buildSigningCustomPopupItems(props.detail, ui) : [],
);

const progressSteps = computed(() => buildMultiSignWaitingPopupSteps(props.phase, ui));

function onClose() {
  popupOpen.value = false;
  emit('update:open', false);
}
</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="popupOpen"
    uses="custom"
    :box-width="SIGNING_CUSTOM_POPUP_WIDTH"
    :box-height="SIGNING_CUSTOM_POPUP_HEIGHT"
    @close="onPopupClosed"
  >
    <SigningCustomPopupPanel
      v-if="detail && currencyMeta"
      :items="items"
      :progress-steps="progressSteps"
      footer-latency-label="122ms"
      :show-footer-actions="phase === 'ready'"
      @close="onClose"
    >
      <template #actions>
        <EgButton tone="danger" variant="text" size="md" @click="onClose">
          {{ ui('Cancel') }}
        </EgButton>
        <EgButton
          v-if="phase === 'ready'"
          tone="decor"
          variant="solid"
          size="md"
          @click="emit('sign')"
        >
          {{ ui('Sign') }}
        </EgButton>
      </template>
    </SigningCustomPopupPanel>
  </EgPopup>
</template>
