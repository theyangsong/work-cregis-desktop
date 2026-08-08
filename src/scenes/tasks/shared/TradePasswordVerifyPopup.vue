<script setup lang="ts">
import { toRef } from 'vue';
import {
  EgPopup,
  EgVerify,
  closeAllAnchoredTooltips,
  useVerifySubmit,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { usePopupShellLifecycle } from './usePopupShellLifecycle';

const props = defineProps<{
  open: boolean;
  submit: (code: string) => boolean | Promise<boolean>;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  closed: [accepted: boolean];
}>();

const { ui } = useAppI18n();

const {
  verify,
  onComplete,
  onRecover,
  reset,
  wasAccepted,
} = useVerifySubmit({
  submit: (code) => props.submit(code),
  requestClose: () => {
    popupOpen.value = false;
    emit('update:open', false);
  },
});

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  onBeforeOpen: () => {
    closeAllAnchoredTooltips();
    reset();
  },
  onClosed: () => {
    emit('update:open', false);
    emit('closed', wasAccepted());
    reset();
  },
});

function closePopup() {
  popupOpen.value = false;
  emit('update:open', false);
}
</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="popupOpen"
    uses="verify"
    verify-type="single-trade-password"
    @close="onPopupClosed"
  >
    <EgVerify
      v-model="verify.code"
      type="single-trade-password"
      action-tone="decor"
      :state="verify.state"
      :title="ui('Transaction password')"
      :secondary-text="ui('Please change your transaction password regularly')"
      :placeholder="ui('Please enter')"
      :confirm-label="ui('Confirm')"
      :cancel-label="ui('Cancel')"
      :forgot-password-label="ui('Forgot password?')"
      :switch-disabled="verify.switchDisabled"
      :countdown-seconds="verify.state === 'error' ? null : undefined"
      @complete="onComplete"
      @recover="onRecover"
      @switch="closePopup"
      @cancel="closePopup"
    />
  </EgPopup>
</template>
