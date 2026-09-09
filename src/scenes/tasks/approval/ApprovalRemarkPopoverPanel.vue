<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  EgMinerFeeBatchStubPanel,
  EgRemarkPopoverPanel,
  REMARK_POPOVER_MAX_LENGTH,
  type ButtonTone,
  type MinerFeeConfirmPayload,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import type { MinerFeeProfile, MinerFeeSelection } from '../shared/minerFeeProfile';
import {
  isMinerFeeBatchStubProfile,
  resolveMinerFeeBatchTransactionCount,
} from '../shared/minerFeeProfile';
import styles from './ApprovalRemarkPopoverPanel.module.css';

const props = withDefaults(
  defineProps<{
    selectedCount: number;
    remark: string;
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
  confirm: [selection: MinerFeeSelection | null];
  cancel: [];
}>();

const { ui } = useAppI18n();

type BatchStubPanelExpose = {
  attemptConfirm: () => void;
};

const batchStubPanelRef = ref<BatchStubPanelExpose | null>(null);

const resolvedProfile = computed<MinerFeeProfile | null>(() => props.minerFeeProfile ?? null);

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

const remarkModel = computed({
  get: () => props.remark,
  set: (value: string) => emit('update:remark', value.slice(0, REMARK_POPOVER_MAX_LENGTH)),
});

onMounted(() => {
  if (props.resetRemarkOnMount) {
    emit('update:remark', '');
  }
});

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

function attemptConfirm() {
  if (showBatchStubOnly.value) {
    batchStubPanelRef.value?.attemptConfirm();
    return;
  }
  onRemarkOnlyConfirm();
}

const minerFeeConfirmClass = computed(() =>
  props.confirmTone === 'danger' ? styles.minerFeeConfirmDanger : undefined,
);

defineExpose({
  attemptConfirm,
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

  <EgRemarkPopoverPanel
    v-else-if="!requireMinerFee"
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
