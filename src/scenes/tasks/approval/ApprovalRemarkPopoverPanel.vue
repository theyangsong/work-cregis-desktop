<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import {
  EgButton,
  EgComboTextareaItem,
  EgFormSubmission,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import type { MinerFeeProfile, MinerFeeSelection } from '../shared/minerFeeProfile';
import MinerFeeEvmPopoverPanel from './MinerFeeEvmPopoverPanel.vue';
import MinerFeeTonLikePanel from './MinerFeeTonLikePanel.vue';
import MinerFeeTronPanel from './MinerFeeTronPanel.vue';
import styles from './ApprovalRemarkPopoverPanel.module.css';

const REMARK_MAX_LENGTH = 256;

type MinerFeeScreen = 'list' | 'custom';

const props = withDefaults(
  defineProps<{
    selectedCount: number;
    remark: string;
    /** @deprecated 用 minerFeeProfile；true 且无 profile 时回退以太坊网络。 */
    showMinerFee?: boolean;
    minerFeeProfile?: MinerFeeProfile | null;
    placeholderKey?: string;
    feedbackKey?: string;
    /** 为 true 时不展示「仅备注」fallback（多签等待页 Sign 等）。 */
    requireMinerFee?: boolean;
  }>(),
  {
    placeholderKey: 'Please enter',
    feedbackKey: 'Optional, Max. 256 characters',
    requireMinerFee: false,
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  'miner-fee-screen-change': [screen: MinerFeeScreen];
  confirm: [selection: MinerFeeSelection | null];
  cancel: [];
}>();

const { ui } = useAppI18n();

const remarkFieldRef = ref<HTMLElement | null>(null);
const evmPanelRef = ref<InstanceType<typeof MinerFeeEvmPopoverPanel> | null>(null);

const resolvedProfile = computed<MinerFeeProfile | null>(() => {
  if (props.minerFeeProfile) {
    return props.minerFeeProfile;
  }
  if (props.showMinerFee || props.requireMinerFee) {
    return {
      kind: 'evm',
      symbol: 'ETH',
      networkLabel: '',
      rowIndex: -1,
    };
  }
  return null;
});

const remarkModel = computed({
  get: () => props.remark,
  set: (value: string) => emit('update:remark', value.slice(0, REMARK_MAX_LENGTH)),
});

function getRemarkControlElement() {
  return remarkFieldRef.value?.querySelector('input, textarea') as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;
}

async function focusRemarkInput() {
  await nextTick();
  getRemarkControlElement()?.focus();

  window.requestAnimationFrame(() => {
    getRemarkControlElement()?.focus();
  });

  window.setTimeout(() => {
    getRemarkControlElement()?.focus();
  }, 120);
}

onMounted(async () => {
  emit('update:remark', '');
  if (resolvedProfile.value) {
    return;
  }
  await focusRemarkInput();
});

function onMinerFeeScreenChange(screen: MinerFeeScreen) {
  emit('miner-fee-screen-change', screen);
}

function onMinerFeeConfirm(selection: MinerFeeSelection) {
  emit('confirm', selection);
}

function onRemarkOnlyConfirm() {
  emit('confirm', null);
}

function resetMinerFeeFlow() {
  evmPanelRef.value?.resetMinerFeeFlow();
}

defineExpose({
  resetMinerFeeFlow,
});
</script>

<template>
  <template v-if="resolvedProfile">
    <MinerFeeEvmPopoverPanel
      v-if="resolvedProfile.kind === 'evm'"
      ref="evmPanelRef"
      :symbol="resolvedProfile.symbol"
      :remark="remarkModel"
      :placeholder-key="placeholderKey"
      :feedback-key="feedbackKey"
      @update:remark="remarkModel = $event"
      @miner-fee-screen-change="onMinerFeeScreenChange"
      @confirm="onMinerFeeConfirm"
    />

    <MinerFeeTonLikePanel
      v-else-if="resolvedProfile.kind === 'ton-xrp'"
      :profile="resolvedProfile"
      :remark="remarkModel"
      :placeholder-key="placeholderKey"
      :feedback-key="feedbackKey"
      @update:remark="remarkModel = $event"
      @confirm="onMinerFeeConfirm"
    />

    <MinerFeeTronPanel
      v-else-if="resolvedProfile.kind === 'tron'"
      :profile="resolvedProfile"
      :remark="remarkModel"
      :placeholder-key="placeholderKey"
      :feedback-key="feedbackKey"
      @update:remark="remarkModel = $event"
      @confirm="onMinerFeeConfirm"
    />
  </template>

  <div v-else :class="styles.root">
    <div
      ref="remarkFieldRef"
      :class="[styles.remarkField, styles.remarkFieldNoLabel]"
    >
      <EgComboTextareaItem
        v-model="remarkModel"
        feedback
        :label="ui('Remark')"
        :placeholder="ui(placeholderKey)"
      >
        <template #feedback>
          <EgFormSubmission
            type="notes"
            :text="ui(feedbackKey)"
            :show-link="false"
          />
        </template>
      </EgComboTextareaItem>
    </div>

    <EgButton
      :class="styles.confirm"
      tone="decor"
      variant="solid"
      size="md"
      @click="onRemarkOnlyConfirm"
    >
      {{ ui('Confirm') }}
    </EgButton>
  </div>
</template>
