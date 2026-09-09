<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import {
  EgAnchoredPopover,
  EgGasFeePopover,
  EgMinerFeeBatchStubPanel,
  EgRemarkPopover,
  REMARK_POPOVER_MAX_LENGTH,
  type GasFeeNetwork,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  resolveMinerFeePopoverTitleKey,
  type MinerFeeProfile,
  type MinerFeeSelection,
} from '../shared/minerFeeProfile';
import {
  isMinerFeeBatchStubProfile,
  resolveMinerFeeBatchTransactionCount,
} from '../shared/minerFeeProfile';
import { resolveGasFeeNetworkFromProfile } from '../shared/resolveGasFeeNetwork';

const props = withDefaults(
  defineProps<{
    remark: string;
    selectedCount?: number;
    title: string;
    minerFeeProfile?: MinerFeeProfile | null;
    boundarySelector?: string;
    onBeforeOpen?: () => void | Promise<void>;
    placeholderKey?: string;
    feedbackKey?: string;
    skipRemarkStep?: boolean;
  }>(),
  {
    selectedCount: 1,
    boundarySelector: '.eds-data-list',
    placeholderKey: 'Please enter remark',
    feedbackKey: 'Optional, Max. 256 characters',
    skipRemarkStep: false,
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  confirm: [selection: MinerFeeSelection | null];
  dismiss: [];
}>();

const { ui } = useAppI18n();

const gasFeePopoverRef = ref<{ close?: () => void; open?: () => void } | null>(null);
const batchStubAnchoredRef = ref<{ close?: () => void; open?: () => void } | null>(null);
const draftRemark = ref('');

const resolvedMinerFeeProfile = computed<MinerFeeProfile | null>(
  () => props.minerFeeProfile ?? null,
);

const hasMinerFeeStep = computed(() => resolvedMinerFeeProfile.value != null);

const minerFeeTransactionCount = computed(() =>
  resolveMinerFeeBatchTransactionCount(
    props.selectedCount ?? 1,
    0,
  ),
);

const showBatchStubOnly = computed(() => {
  const profile = resolvedMinerFeeProfile.value;
  if (!profile) return false;
  return isMinerFeeBatchStubProfile(profile, minerFeeTransactionCount.value);
});

const gasFeeNetwork = computed<GasFeeNetwork | null>(() => {
  const profile = resolvedMinerFeeProfile.value;
  if (!profile || showBatchStubOnly.value) return null;
  return resolveGasFeeNetworkFromProfile(profile);
});

const remarkModel = computed({
  get: () => props.remark,
  set: (value: string) => emit('update:remark', value.slice(0, REMARK_POPOVER_MAX_LENGTH)),
});

const minerFeeTopToolTitle = computed(() => {
  if (!resolvedMinerFeeProfile.value) {
    return ui('Miner Fee');
  }
  return ui(resolveMinerFeePopoverTitleKey(resolvedMinerFeeProfile.value));
});

const gasFeeSymbol = computed(
  () => resolvedMinerFeeProfile.value?.symbol,
);

function onDismiss() {
  batchStubAnchoredRef.value?.close?.();
  gasFeePopoverRef.value?.close?.();
  emit('update:remark', '');
  emit('dismiss');
}

function prepareRemarkDraft() {
  draftRemark.value = props.remark;
}

function onRemarkStepConfirm() {
  remarkModel.value = draftRemark.value;
  void nextTick(() => {
    if (showBatchStubOnly.value) {
      batchStubAnchoredRef.value?.open?.();
      return;
    }
    gasFeePopoverRef.value?.open?.();
  });
}

function onMinerFeeStepConfirm(selection: MinerFeeSelection | null) {
  batchStubAnchoredRef.value?.close?.();
  gasFeePopoverRef.value?.close?.();
  emit('confirm', selection);
}

function onMinerFeePopoverDismiss() {
  batchStubAnchoredRef.value?.close?.();
  gasFeePopoverRef.value?.close?.();
}

function onGasFeeConfirm(payload: { displayValue: string }) {
  if (!resolvedMinerFeeProfile.value) return;
  onMinerFeeStepConfirm({
    profileKind: resolvedMinerFeeProfile.value.kind,
    displayValue: payload.displayValue,
  });
}

function onRemarkDismissRestore() {
  draftRemark.value = props.remark;
}

function onRemarkOnlyConfirm() {
  emit('confirm', null);
}
</script>

<template>
  <EgAnchoredPopover
    v-if="hasMinerFeeStep && showBatchStubOnly"
    ref="batchStubAnchoredRef"
    :boundary-selector="boundarySelector"
    :top-tool-title="minerFeeTopToolTitle"
    top-tool
    top-tool-closable
    width-mode="fixed"
    height-mode="adaptive"
    @dismiss="onMinerFeePopoverDismiss"
  >
    <template #trigger="anchorTrigger">
      <EgRemarkPopover
        v-if="!skipRemarkStep"
        v-model="draftRemark"
        :title="title"
        :placeholder="ui(placeholderKey)"
        :feedback-text="feedbackKey"
        :confirm-label="ui('Confirm')"
        :boundary-selector="boundarySelector"
        :on-before-open="prepareRemarkDraft"
        @confirm="onRemarkStepConfirm"
        @dismiss="onRemarkDismissRestore"
      >
        <template #trigger>
          <slot name="trigger" v-bind="anchorTrigger" />
        </template>
      </EgRemarkPopover>
      <slot v-else name="trigger" v-bind="anchorTrigger" />
    </template>
    <EgMinerFeeBatchStubPanel
      v-if="resolvedMinerFeeProfile"
      :translate="ui"
      :symbol="resolvedMinerFeeProfile.symbol"
      :profile-kind="resolvedMinerFeeProfile.kind"
      :transaction-count="minerFeeTransactionCount"
      @confirm="onGasFeeConfirm"
    />
  </EgAnchoredPopover>

  <EgGasFeePopover
    v-else-if="hasMinerFeeStep && gasFeeNetwork"
    ref="gasFeePopoverRef"
    :network="gasFeeNetwork"
    :translate="ui"
    :symbol="gasFeeSymbol"
    :title="minerFeeTopToolTitle"
    :transaction-count="minerFeeTransactionCount"
    :boundary-selector="boundarySelector"
    :on-before-open="skipRemarkStep ? onBeforeOpen : undefined"
    @confirm="onGasFeeConfirm"
    @dismiss="onMinerFeePopoverDismiss"
  >
    <template #trigger="gasTrigger">
      <EgRemarkPopover
        v-if="!skipRemarkStep"
        v-model="draftRemark"
        :title="title"
        :placeholder="ui(placeholderKey)"
        :feedback-text="feedbackKey"
        :confirm-label="ui('Confirm')"
        :boundary-selector="boundarySelector"
        :on-before-open="prepareRemarkDraft"
        @confirm="onRemarkStepConfirm"
        @dismiss="onRemarkDismissRestore"
      >
        <template #trigger>
          <slot name="trigger" v-bind="gasTrigger" />
        </template>
      </EgRemarkPopover>
      <slot v-else name="trigger" v-bind="gasTrigger" />
    </template>
  </EgGasFeePopover>

  <EgRemarkPopover
    v-else
    v-model="remarkModel"
    :title="title"
    :placeholder="ui(placeholderKey)"
    :feedback-text="feedbackKey"
    :confirm-label="ui('Confirm')"
    :boundary-selector="boundarySelector"
    :on-before-open="onBeforeOpen"
    @confirm="onRemarkOnlyConfirm"
    @dismiss="onDismiss"
  >
    <template #trigger="triggerSlot">
      <slot name="trigger" v-bind="triggerSlot" />
    </template>
  </EgRemarkPopover>
</template>
