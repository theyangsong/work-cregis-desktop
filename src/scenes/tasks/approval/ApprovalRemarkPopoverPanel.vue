<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue';
import {
  EgMinerFeeBatchStubPanel,
  EgMinerFeeBitcoinPanel,
  EgMinerFeeEthereumPanel,
  EgMinerFeeTonPanel,
  EgMinerFeeTronPanel,
  EgRemarkPopoverPanel,
  REMARK_POPOVER_MAX_LENGTH,
  type ButtonTone,
  type GasFeeNetwork,
  type MinerFeeConfirmPayload,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { resolveGasFeeNetworkFromProfile } from '../shared/resolveGasFeeNetwork';
import type { MinerFeeProfile, MinerFeeSelection } from '../shared/minerFeeProfile';
import {
  isMinerFeeBatchStubProfile,
  resolveMinerFeeBatchTransactionCount,
} from '../shared/minerFeeProfile';
import styles from './ApprovalRemarkPopoverPanel.module.css';

type MinerFeeScreen = 'list' | 'custom';

const PANEL_BY_NETWORK: Record<GasFeeNetwork, Component> = {
  bitcoin: EgMinerFeeBitcoinPanel,
  ethereum: EgMinerFeeEthereumPanel,
  ton: EgMinerFeeTonPanel,
  tron: EgMinerFeeTronPanel,
};

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
    /** 批签：用户多选笔数（可签名笔数不足时仍用于 batch stub 判定）。 */
    pendingTransactionCount?: number;
  }>(),
  {
    placeholderKey: 'Please enter remark',
    feedbackKey: 'Optional, Max. 256 characters',
    requireMinerFee: false,
    hideInlineConfirm: false,
    resetRemarkOnMount: true,
    confirmTone: 'decor',
    pendingTransactionCount: 0,
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  'miner-fee-screen-change': [screen: MinerFeeScreen];
  confirm: [selection: MinerFeeSelection | null];
  cancel: [];
}>();

const { ui } = useAppI18n();

type MinerFeePanelExpose = {
  resetMinerFeeFlow?: () => void;
  attemptConfirm: () => void;
  attemptCancelCustom?: () => void;
  attemptSaveCustom?: () => void;
  confirmDisabled?: boolean | { value: boolean };
};

const gasFeePanelRef = ref<MinerFeePanelExpose | null>(null);
const batchStubPanelRef = ref<MinerFeePanelExpose | null>(null);
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

const minerFeeTransactionCount = computed(() =>
  resolveMinerFeeBatchTransactionCount(
    props.selectedCount,
    props.pendingTransactionCount,
  ),
);

const showBatchStubOnly = computed(() => {
  const profile = resolvedProfile.value;
  if (!profile) {
    return false;
  }
  return isMinerFeeBatchStubProfile(profile, minerFeeTransactionCount.value);
});

const gasFeeNetwork = computed(() => {
  const profile = resolvedProfile.value;
  if (!profile || showBatchStubOnly.value) {
    return null;
  }
  return resolveGasFeeNetworkFromProfile(profile);
});

const gasFeePanelComponent = computed(
  () => (gasFeeNetwork.value ? PANEL_BY_NETWORK[gasFeeNetwork.value] : null),
);

function resolveGasFeePanelSymbolProps(resolvedProfile: MinerFeeProfile) {
  if (
    resolvedProfile.kind === 'evm'
    || resolvedProfile.kind === 'ton-xrp'
    || resolvedProfile.kind === 'tron'
  ) {
    return { symbol: resolvedProfile.symbol };
  }
  return {};
}

const gasFeePanelProps = computed(() => {
  const profile = resolvedProfile.value;
  const base = {
    translate: ui,
    hideInlineConfirm: props.hideInlineConfirm,
    transactionCount: minerFeeTransactionCount.value,
  };
  if (!profile || profile.kind === 'evm' && gasFeeNetwork.value === 'bitcoin') {
    return base;
  }
  return { ...base, ...resolveGasFeePanelSymbolProps(profile) };
});

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

function resetMinerFeeFlow() {
  minerFeeScreen.value = 'list';
  gasFeePanelRef.value?.resetMinerFeeFlow?.();
}

function attemptCancelCustom() {
  gasFeePanelRef.value?.attemptCancelCustom?.();
}

function attemptSaveCustom() {
  gasFeePanelRef.value?.attemptSaveCustom?.();
}

function attemptConfirm() {
  if (showBatchStubOnly.value) {
    batchStubPanelRef.value?.attemptConfirm();
    return;
  }
  if (gasFeeNetwork.value) {
    gasFeePanelRef.value?.attemptConfirm();
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
  if (gasFeeNetwork.value === 'bitcoin' || gasFeeNetwork.value === 'ethereum') {
    return readConfirmDisabled(gasFeePanelRef.value?.confirmDisabled);
  }
  return false;
});

const isMinerFeeCustomScreen = computed(
  () =>
    (gasFeeNetwork.value === 'bitcoin' || gasFeeNetwork.value === 'ethereum')
    && minerFeeScreen.value === 'custom',
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
  <EgMinerFeeBatchStubPanel
    v-if="resolvedProfile && showBatchStubOnly"
    ref="batchStubPanelRef"
    :class="minerFeeConfirmClass"
    :translate="ui"
    :symbol="resolvedProfile.symbol"
    :profile-kind="resolvedProfile.kind"
    :transaction-count="minerFeeTransactionCount"
    :hide-inline-confirm="hideInlineConfirm"
    @confirm="onMinerFeeConfirm"
  />

  <component
    v-else-if="gasFeePanelComponent && resolvedProfile"
    :is="gasFeePanelComponent"
    ref="gasFeePanelRef"
    :class="minerFeeConfirmClass"
    v-bind="gasFeePanelProps"
    @miner-fee-screen-change="onMinerFeeScreenChange"
    @confirm="onMinerFeeConfirm"
  />

  <EgRemarkPopoverPanel
    v-else
    v-model="remarkModel"
    :hide-confirm="hideInlineConfirm"
    :label="ui('Remark')"
    :placeholder="ui(placeholderKey)"
    :feedback-text="ui(feedbackKey)"
    :confirm-label="ui('Confirm')"
    hide-label
    :reset-on-mount="false"
    @confirm="onRemarkOnlyConfirm"
  />
</template>
