<script setup lang="ts">
import { toRef } from 'vue';
import { EgDialog, EgPopup } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { usePopupShellLifecycle } from '../../shared/usePopupShellLifecycle';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const { ui } = useAppI18n();

const stopSigningMessage = ui(
  'After stopping, transactions that have not yet been signed will no longer be signed, while transactions that have already been signed will not be affected. Are you sure you want to stop the current batch signing task?',
);

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  onClosed: () => {
    emit('update:open', false);
    emit('cancel');
  },
});

function onConfirm() {
  emit('confirm');
  popupOpen.value = false;
}

function onCancel() {
  popupOpen.value = false;
}
</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="popupOpen"
    uses="dialog"
    dialog-type="standard"
    alert-vertical-align="offset-top"
    @close="onPopupClosed"
  >
    <EgDialog
      type="standard"
      :title="ui('Stop Signing')"
      :secondary-text="stopSigningMessage"
      :show-secondary-text="true"
      :confirm-label="ui('Confirm')"
      :cancel-label="ui('Cancel')"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </EgPopup>
</template>
