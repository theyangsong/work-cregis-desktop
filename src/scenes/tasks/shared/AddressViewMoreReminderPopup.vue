<script setup lang="ts">
import { toRef } from 'vue';
import { EgPopup, EgReminder } from '@eds/desktop-components';
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
  emit('update:open', false);
}
</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="popupOpen"
    uses="reminder"
    reminder-type="echo"
    @close="onPopupClosed"
  >
    <EgReminder
      type="echo"
      :title="ui('Address details')"
      :show-secondary-text="false"
      :confirm-label="ui('Confirm')"
      :action-count="1"
      @confirm="onConfirm"
    >
      <pre :class="styles.viewMoreText">{{ text }}</pre>
    </EgReminder>
  </EgPopup>
</template>
