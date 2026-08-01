<script setup lang="ts">
import { toRef } from 'vue';
import { EgPopup, EgReminder } from '@eds/desktop-components';
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
    dialog-type="compose"
    @close="onPopupClosed"
  >
    <EgReminder
      type="compose"
      :title="ui('Stop Signing')"
      :show-secondary-text="false"
      :confirm-label="ui('Confirm')"
      :cancel-label="ui('Cancel')"
      :action-count="2"
      @confirm="onConfirm"
      @cancel="onCancel"
    >
      <p>
        {{
          ui(
            'After stopping, transactions that have not completed signing will not continue. Completed signatures are not affected. Stop the current batch signing task?',
          )
        }}
      </p>
    </EgReminder>
  </EgPopup>
</template>
