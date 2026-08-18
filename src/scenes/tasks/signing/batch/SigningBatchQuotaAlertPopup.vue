<script setup lang="ts">
import { computed, toRef } from 'vue';
import { EgButton, EgPopup, EgReminder } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { formatGroupedDecimalAmount } from '@/utils/formatGroupedDisplay';
import { usePopupShellLifecycle } from '../../shared/usePopupShellLifecycle';
import styles from './SigningBatchQuotaAlertPopup.module.css';

const props = defineProps<{
  open: boolean;
  remainingUsd: number;
  overageFeeUsd: number;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  continue: [];
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

const formattedRemaining = computed(() =>
  `$${formatGroupedDecimalAmount(String(props.remainingUsd))}`,
);
const formattedOverageFee = computed(() =>
  `$${formatGroupedDecimalAmount(String(props.overageFeeUsd))}`,
);

const message = computed(() =>
  ui(
    'Team withdrawal quota remaining ${remaining}. A 0.1% over-quota service fee applies to the excess. This transaction will incur ${overageFee} in over-quota service fees. We recommend upgrading your team plan or expanding your withdrawal package to waive over-quota fees and enjoy a higher withdrawal limit.',
  )
    .replace('${remaining}', formattedRemaining.value)
    .replace('${overageFee}', formattedOverageFee.value),
);

function onIncreaseQuota() {
  popupOpen.value = false;
}

function onContinueSending() {
  emit('continue');
  popupOpen.value = false;
}
</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="popupOpen"
    uses="reminder"
    reminder-type="echo"
    alert-vertical-align="offset-top"
    @close="onPopupClosed"
  >
    <EgReminder
      :class="styles.host"
      type="echo"
      :title="ui('Withdrawal quota exceeded')"
      :show-secondary-text="false"
    >
      <p :class="styles.message">{{ message }}</p>
      <template #actions>
        <div :class="styles.toolbarBar">
          <div :class="styles.toolbarActions">
            <EgButton
              tone="decor"
              variant="text"
              size="lg"
              @click="onIncreaseQuota"
            >
              {{ ui('Increase quota') }}
            </EgButton>
            <EgButton
              tone="decor"
              variant="solid"
              size="lg"
              @click="onContinueSending"
            >
              {{ ui('Continue sending') }}
            </EgButton>
          </div>
        </div>
      </template>
    </EgReminder>
  </EgPopup>
</template>
