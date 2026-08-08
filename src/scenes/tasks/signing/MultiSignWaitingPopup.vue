<script setup lang="ts">
import { computed, toRef } from 'vue';
import { EgButton, EgPopup } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { usePopupShellLifecycle } from '../shared/usePopupShellLifecycle';
import type { SigningDetail } from './types';
import styles from './MultiSignWaitingPopup.module.css';

const props = defineProps<{
  open: boolean;
  detail: SigningDetail | null;
  phase: 'waiting' | 'ready';
  joinedCount: number;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  close: [];
  sign: [];
}>();

const { ui } = useAppI18n();

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  onClosed: () => {
    emit('update:open', false);
    emit('close');
  },
});

const requiredCount = computed(() => {
  const threshold = props.detail?.signingThreshold ?? '2 / 3';
  const match = /^(\d+)/.exec(threshold);
  return match ? Number.parseInt(match[1], 10) : 2;
});

const statusTitle = computed(() =>
  props.phase === 'waiting' ? ui('Waiting') : ui('Ready'),
);

const statusHint = computed(() => {
  if (props.phase === 'waiting') {
    return ui('Need {required} members to join, {joined} joined')
      .replace('{required}', String(requiredCount.value))
      .replace('{joined}', String(props.joinedCount));
  }
  return ui('Members joined, please start signing');
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
    :box-height="560"
    alert-vertical-align="padding-top-md"
    @close="onPopupClosed"
  >
    <div v-if="detail" :class="styles.root">
      <header :class="styles.header">
        <p :class="styles.status">{{ statusTitle }}</p>
        <p :class="styles.hint">{{ statusHint }}</p>
        <p :class="styles.threshold">
          {{ ui('Signing threshold') }}: {{ detail.signingThreshold }}
        </p>
      </header>

      <section :class="styles.section">
        <h3 :class="styles.sectionTitle">{{ ui('Transaction') }}</h3>
        <p :class="styles.line">{{ ui('Amount') }}: {{ detail.amountDisplay }}</p>
        <p :class="styles.line">{{ ui('Type of Business') }}: {{ ui(detail.businessType) }}</p>
        <p :class="styles.line">{{ ui('Initiated') }}: {{ detail.initiatorDisplay }}</p>
        <p :class="styles.line">{{ ui('From Address') }}: {{ detail.senderSummary }}</p>
        <p :class="styles.line">{{ ui('To Address') }}: {{ detail.receiverSummary }}</p>
        <p :class="styles.line">{{ ui('Memo') }}: {{ detail.memo }}</p>
      </section>

      <section :class="styles.section">
        <h3 :class="styles.sectionTitle">{{ ui('Members') }}</h3>
        <p
          v-for="signer in detail.signers.slice(0, joinedCount)"
          :key="signer.emailMasked"
          :class="styles.line"
        >
          {{ signer.name }} ({{ signer.emailMasked }}) · {{ ui('Joined') }}
        </p>
      </section>

      <p :class="styles.network">{{ ui('Network') }}: 42ms</p>

      <div :class="styles.actions">
        <EgButton tone="danger" variant="text" size="md" @click="onClose">
          {{ ui('Cancel') }}
        </EgButton>
        <EgButton
          v-if="phase === 'ready'"
          tone="decor"
          variant="solid"
          size="md"
          @click="emit('sign')"
        >
          {{ ui('Sign') }}
        </EgButton>
      </div>
    </div>
  </EgPopup>
</template>
