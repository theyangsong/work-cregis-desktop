<script setup lang="ts">
import { computed, toRef } from 'vue';
import { EgPopup } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { usePopupShellLifecycle } from '../shared/usePopupShellLifecycle';
import {
  buildSigningCustomPopupItems,
  resolveSigningCustomPopupCurrencyMeta,
} from './buildSigningCustomPopupItems';
import { buildSigningProgressPopupSteps } from './buildSigningCustomPopupProgressSteps';
import SigningCustomPopupPanel from './SigningCustomPopupPanel.vue';
import {
  SIGNING_CUSTOM_POPUP_HEIGHT,
  SIGNING_CUSTOM_POPUP_WIDTH,
} from './signingCustomPopup.constants';
import type { SigningDetail, SigningProgressPhase } from './types';

const props = defineProps<{
  open: boolean;
  detail: SigningDetail | null;
  phase: SigningProgressPhase;
  minerFeeDisplay?: string | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  close: [];
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
  props.detail
    ? buildSigningCustomPopupItems(props.detail, ui, props.minerFeeDisplay)
    : [],
);

const progressSteps = computed(() => buildSigningProgressPopupSteps(props.phase, ui));

function onClose() {
  popupOpen.value = false;
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
      @close="onClose"
    />
  </EgPopup>
</template>
