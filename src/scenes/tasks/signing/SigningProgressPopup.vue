<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { EgButton, EgPopup } from '@eds/desktop-components';
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
  retry: [];
}>();

const { ui } = useAppI18n();

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  onClosed: () => {
    emit('update:open', false);
    emit('close');
  },
});

const isMpcNetworkSignFailed = computed(() => props.phase === 'sign-failed');
const mpcNetworkSelectedIndex = ref<number | null>(null);

const retryDisabled = computed(
  () => isMpcNetworkSignFailed.value && mpcNetworkSelectedIndex.value === null,
);

watch(
  () => props.phase,
  (phase) => {
    if (phase !== 'sign-failed') {
      mpcNetworkSelectedIndex.value = null;
    }
  },
);

const currencyMeta = computed(() =>
  props.detail ? resolveSigningCustomPopupCurrencyMeta(props.detail) : null,
);

const items = computed(() =>
  props.detail
    ? buildSigningCustomPopupItems(props.detail, ui, props.minerFeeDisplay)
    : [],
);

const progressSteps = computed(() => buildSigningProgressPopupSteps(props.phase, ui));

const panelReady = computed(
  () => props.detail != null && (isMpcNetworkSignFailed.value || currencyMeta.value != null),
);

function onClose() {
  popupOpen.value = false;
}

function onRetry() {
  if (retryDisabled.value) return;
  emit('retry');
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
      v-if="panelReady"
      :items="items"
      :progress-steps="progressSteps"
      :content-variant="isMpcNetworkSignFailed ? 'mpc-network-error' : 'detail'"
      :footer-mode="isMpcNetworkSignFailed ? 'detail-toolbar' : 'latency'"
      :mpc-network-selected-index="mpcNetworkSelectedIndex"
      footer-latency-label="122ms"
      footer-latency-color="var(--status-success)"
      @update:mpc-network-selected-index="mpcNetworkSelectedIndex = $event"
      @close="onClose"
      @retry="onRetry"
    >
      <template v-if="isMpcNetworkSignFailed" #actions>
        <EgButton
          tone="decor"
          variant="solid"
          size="md"
          :disabled="retryDisabled"
          @click="onRetry"
        >
          {{ ui('Retry') }}
        </EgButton>
      </template>
    </SigningCustomPopupPanel>
  </EgPopup>
</template>
