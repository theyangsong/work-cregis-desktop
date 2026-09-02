<script setup lang="ts">
import { toRef } from 'vue';
import { EgDialog, EgPopup } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './AddressViewMoreReminderPopup.module.css';
import { usePopupShellLifecycle } from './usePopupShellLifecycle';

const props = defineProps<{
  open: boolean;
  shellSuspended?: boolean;
  text: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  closed: [];
}>();

const { ui } = useAppI18n();

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  suspended: toRef(props, 'shellSuspended'),
  onClosed: () => {
    emit('update:open', false);
    emit('closed');
  },
});

function onConfirm() {
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
    dialog-type="compose"
    alert-vertical-align="offset-top"
    @close="onPopupClosed"
  >
    <EgDialog
      type="compose"
      :title="ui('Address details')"
      :show-secondary-text="false"
      :confirm-label="ui('Confirm')"
      :cancel-label="ui('Cancel')"
      @confirm="onConfirm"
      @cancel="onCancel"
    >
      <template #default>
        <pre :class="styles.viewMoreText">{{ text }}</pre>
      </template>
    </EgDialog>
  </EgPopup>
</template>
