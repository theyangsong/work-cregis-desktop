<script setup lang="ts">
import { toRef } from 'vue';
import { EgPopup, EgReminder } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import { usePopupShellLifecycle } from '../../shared/usePopupShellLifecycle';

const props = defineProps<{
  open: boolean;
  requiredUsd: number;
  remainingUsd: number;
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

function onConfirm() {
  popupOpen.value = false;
}

const message = () =>
  ui('This transaction requires an over-quota fee. Required ${required}, remaining ${remaining}.')
    .replace('${required}', formatGroupedNumber(props.requiredUsd))
    .replace('${remaining}', formatGroupedNumber(props.remainingUsd));
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
      :title="ui('Insufficient withdrawal quota')"
      :show-secondary-text="false"
      :confirm-label="ui('Confirm')"
      :action-count="1"
      @confirm="onConfirm"
    >
      <p>{{ message() }}</p>
    </EgReminder>
  </EgPopup>
</template>
