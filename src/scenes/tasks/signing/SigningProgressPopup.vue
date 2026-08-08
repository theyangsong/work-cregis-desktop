<script setup lang="ts">
import { computed, toRef } from 'vue';
import { EgButton, EgPopup } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { usePopupShellLifecycle } from '../shared/usePopupShellLifecycle';
import type { SigningDetail, SigningProgressPhase } from './types';
import styles from './SigningProgressPopup.module.css';

const props = defineProps<{
  open: boolean;
  detail: SigningDetail | null;
  phase: SigningProgressPhase;
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

const phaseLabel = computed(() => {
  switch (props.phase) {
    case 'signing':
      return ui('Signing in progress');
    case 'sign-failed':
      return ui('Sign Failed');
    case 'broadcasting':
      return ui('Broadcasting');
    case 'broadcast-success':
      return ui('Broadcast Success');
    case 'broadcast-failed':
      return ui('Broadcast Failed');
    default:
      return ui('Signing in progress');
  }
});

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
    :box-width="460"
    :box-height="520"
    alert-vertical-align="padding-top-md"
    @close="onPopupClosed"
  >
    <div v-if="detail" :class="styles.root">
      <header :class="styles.header">
        <p :class="styles.phase">{{ phaseLabel }}</p>
        <p :class="styles.subPhase">
          {{ ui('Signing in progress') }} — {{ ui('Broadcasting') }}
        </p>
      </header>

      <dl :class="styles.fields">
        <div :class="styles.field">
          <dt>{{ ui('Currency') }}</dt>
          <dd>{{ detail.amountDisplay.split(' ')[1] ?? detail.amountHeadline }}</dd>
        </div>
        <div :class="styles.field">
          <dt>{{ ui('Amount') }}</dt>
          <dd>{{ detail.amountDisplay }}</dd>
        </div>
        <div :class="styles.field">
          <dt>{{ ui('Initiated') }}</dt>
          <dd>{{ detail.initiatorDisplay }}</dd>
        </div>
        <div :class="styles.field">
          <dt>{{ ui('From Address') }}</dt>
          <dd>{{ detail.senderSummary }}</dd>
        </div>
        <div :class="styles.field">
          <dt>{{ ui('To Address') }}</dt>
          <dd>{{ detail.receiverSummary }}</dd>
        </div>
        <div :class="styles.field">
          <dt>{{ ui('Memo') }}</dt>
          <dd>{{ detail.memo }}</dd>
        </div>
        <div :class="styles.field">
          <dt>{{ ui('Miner Fee') }}</dt>
          <dd>{{ ui('Medium') }}</dd>
        </div>
      </dl>

      <EgButton tone="decor" variant="solid" size="md" @click="onClose">
        {{ ui('Close') }}
      </EgButton>
    </div>
  </EgPopup>
</template>
