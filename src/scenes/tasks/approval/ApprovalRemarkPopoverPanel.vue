<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  EgMinerFeeBitcoinPanel,
  EgMinerFeeEthereumPanel,
  EgMinerFeeTonPanel,
  EgMinerFeeTronPanel,
  REMARK_POPOVER_MAX_LENGTH,
  type ButtonTone,
  type MinerFeeConfirmPayload,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import type { MinerFeeProfile, MinerFeeSelection } from '../shared/minerFeeProfile';
import ApprovalRemarkFormPanel from './ApprovalRemarkFormPanel.vue';
import styles from './ApprovalRemarkPopoverPanel.module.css';

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
    /** 为 true 时隐藏面板内确认按钮，由外层 Popup 工具栏承接。 */
    hideInlineConfirm?: boolean;
    /** 挂载时是否清空备注；矿工费第二步应 false，避免覆盖已填备注。 */
    resetRemarkOnMount?: boolean;
    /** Popover 内「确定」按钮 tone。 */
    confirmTone?: ButtonTone;
  }>(),
  {
    placeholderKey: 'Please Enter',
    feedbackKey: 'Optional, up to 256 characters.',
    requireMinerFee: false,
    hideInlineConfirm: false,
    resetRemarkOnMount: true,
    confirmTone: 'decor',
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  'miner-fee-screen-change': [screen: MinerFeeScreen];
  confirm: [selection: MinerFeeSelection | null];
  cancel: [];
}>();

const { ui } = useAppI18n();

type MinerFeeEvmPanelExpose = {
  resetMinerFeeFlow: () => void;
  attemptConfirm: () => void;
  attemptCancelCustom: () => void;
  attemptSaveCustom: () => void;
  confirmDisabled?: boolean | { value: boolean };
};

type MinerFeeSimplePanelExpose = {
  attemptConfirm: () => void;
};

const evmPanelRef = ref<MinerFeeEvmPanelExpose | null>(null);
const bitcoinPanelRef = ref<MinerFeeEvmPanelExpose | null>(null);
const tonPanelRef = ref<MinerFeeSimplePanelExpose | null>(null);
const tronPanelRef = ref<MinerFeeSimplePanelExpose | null>(null);
const minerFeeScreen = ref<MinerFeeScreen>('list');

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

const isBitcoinProfile = computed(
  () =>
    resolvedProfile.value?.kind === 'evm'
    && resolvedProfile.value.symbol.trim().toUpperCase() === 'BTC',
);

const remarkModel = computed({
  get: () => props.remark,
  set: (value: string) => emit('update:remark', value.slice(0, REMARK_POPOVER_MAX_LENGTH)),
});

onMounted(() => {
  if (props.resetRemarkOnMount) {
    emit('update:remark', '');
  }
});

function onMinerFeeScreenChange(screen: MinerFeeScreen) {
  minerFeeScreen.value = screen;
  emit('miner-fee-screen-change', screen);
}

function onMinerFeeConfirm(payload: MinerFeeConfirmPayload) {
  if (!resolvedProfile.value) {
    return;
  }
  emit('confirm', {
    profileKind: resolvedProfile.value.kind,
    displayValue: payload.displayValue,
  });
}

function onRemarkOnlyConfirm() {
  emit('confirm', null);
}

function activeEvmPanelRef() {
  return isBitcoinProfile.value ? bitcoinPanelRef.value : evmPanelRef.value;
}

function resetMinerFeeFlow() {
  minerFeeScreen.value = 'list';
  activeEvmPanelRef()?.resetMinerFeeFlow();
}

function attemptCancelCustom() {
  activeEvmPanelRef()?.attemptCancelCustom();
}

function attemptSaveCustom() {
  activeEvmPanelRef()?.attemptSaveCustom();
}

function attemptConfirm() {
  if (resolvedProfile.value?.kind === 'evm') {
    activeEvmPanelRef()?.attemptConfirm();
    return;
  }
  if (resolvedProfile.value?.kind === 'ton-xrp') {
    tonPanelRef.value?.attemptConfirm();
    return;
  }
  if (resolvedProfile.value?.kind === 'tron') {
    tronPanelRef.value?.attemptConfirm();
    return;
  }
  onRemarkOnlyConfirm();
}

function readConfirmDisabled(
  disabled: boolean | { value: boolean } | undefined,
): boolean {
  if (typeof disabled === 'boolean') {
    return disabled;
  }
  return disabled?.value ?? true;
}

const confirmDisabled = computed(() => {
  if (resolvedProfile.value?.kind === 'evm') {
    return readConfirmDisabled(activeEvmPanelRef()?.confirmDisabled);
  }
  return false;
});

const isMinerFeeCustomScreen = computed(
  () => resolvedProfile.value?.kind === 'evm' && minerFeeScreen.value === 'custom',
);

const minerFeeConfirmClass = computed(() =>
  props.confirmTone === 'danger' ? styles.minerFeeConfirmDanger : undefined,
);

defineExpose({
  resetMinerFeeFlow,
  attemptConfirm,
  attemptCancelCustom,
  attemptSaveCustom,
  confirmDisabled,
  minerFeeScreen,
  isMinerFeeCustomScreen,
});
</script>

<template>
  <div v-if="resolvedProfile" :class="minerFeeConfirmClass">
    <EgMinerFeeBitcoinPanel
      v-if="isBitcoinProfile"
      ref="bitcoinPanelRef"
      :translate="ui"
      :hide-inline-confirm="hideInlineConfirm"
      :transaction-count="selectedCount"
      @miner-fee-screen-change="onMinerFeeScreenChange"
      @confirm="onMinerFeeConfirm"
    />

    <EgMinerFeeEthereumPanel
      v-else-if="resolvedProfile.kind === 'evm'"
      ref="evmPanelRef"
      :translate="ui"
      :symbol="resolvedProfile.symbol"
      :hide-inline-confirm="hideInlineConfirm"
      :transaction-count="selectedCount"
      @miner-fee-screen-change="onMinerFeeScreenChange"
      @confirm="onMinerFeeConfirm"
    />

    <EgMinerFeeTonPanel
      v-else-if="resolvedProfile.kind === 'ton-xrp'"
      ref="tonPanelRef"
      :translate="ui"
      :symbol="resolvedProfile.symbol"
      :hide-inline-confirm="hideInlineConfirm"
      :transaction-count="selectedCount"
      @confirm="onMinerFeeConfirm"
    />

    <EgMinerFeeTronPanel
      v-else-if="resolvedProfile.kind === 'tron'"
      ref="tronPanelRef"
      :translate="ui"
      :hide-inline-confirm="hideInlineConfirm"
      :transaction-count="selectedCount"
      @confirm="onMinerFeeConfirm"
    />
  </div>

  <ApprovalRemarkFormPanel
    v-else
    v-model="remarkModel"
    :hide-confirm="hideInlineConfirm"
    :label="ui('Remark')"
    :placeholder="ui(placeholderKey)"
    :feedback-text="feedbackKey"
    :confirm-label="ui('Confirm')"
    :confirm-tone="confirmTone"
    hide-label
    :reset-on-mount="false"
    @confirm="onRemarkOnlyConfirm"
  />
</template>
