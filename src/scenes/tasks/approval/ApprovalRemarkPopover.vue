<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import {
  EgAnchoredPopover,
  EgGasFeePopover,
  EgRemarkPopover,
  EgTooltip,
  EgPopover,
  POPOVER_PRESET_WIDTH_BASE,
  REMARK_POPOVER_MAX_LENGTH,
  type ButtonTone,
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
import { MINER_FEE_POPOVER_CHROME } from '../shared/minerFeePopoverChrome';
import ApprovalRemarkPopoverPanel from './ApprovalRemarkPopoverPanel.vue';

type MinerFeeScreen = 'list' | 'custom';

const props = withDefaults(
  defineProps<{
    remark: string;
    selectedCount?: number;
    title: string;
    /** @deprecated 用 minerFeeProfile；true 且无 profile 时回退以太坊网络。 */
    showMinerFee?: boolean;
    minerFeeProfile?: MinerFeeProfile | null;
    boundarySelector?: string;
    onBeforeOpen?: () => void | Promise<void>;
    placeholderKey?: string;
    feedbackKey?: string;
    requireMinerFee?: boolean;
    confirmTone?: ButtonTone;
    minerFeeConfirmTone?: ButtonTone;
    skipRemarkStep?: boolean;
  }>(),
  {
    selectedCount: 1,
    showMinerFee: false,
    boundarySelector: '.eds-data-list',
    placeholderKey: 'Please enter remark',
    feedbackKey: 'Optional, Max. 256 characters',
    requireMinerFee: false,
    confirmTone: 'decor',
    minerFeeConfirmTone: 'decor',
    skipRemarkStep: false,
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  confirm: [selection: MinerFeeSelection | null];
  dismiss: [];
}>();

const { ui } = useAppI18n();

const minerFeePanelRef = ref<InstanceType<typeof ApprovalRemarkPopoverPanel> | null>(null);
const gasFeePopoverRef = ref<{ close?: () => void; open?: () => void } | null>(null);
const minerFeeAnchoredRef = ref<{ close?: () => void; openPanel?: () => void } | null>(null);
const minerFeeScreen = ref<MinerFeeScreen>('list');
const minerFeeExpanded = ref(false);
const draftRemark = ref('');

const resolvedMinerFeeProfile = computed<MinerFeeProfile | null>(() => {
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

function resetMinerFeeFlow() {
  minerFeePanelRef.value?.resetMinerFeeFlow();
  minerFeeScreen.value = 'list';
}

function onDismiss() {
  resetMinerFeeFlow();
  minerFeeAnchoredRef.value?.close?.();
  gasFeePopoverRef.value?.close?.();
  emit('update:remark', '');
  emit('dismiss');
}

function onMinerFeeScreenChange(screen: MinerFeeScreen) {
  minerFeeScreen.value = screen;
}

function prepareRemarkDraft() {
  draftRemark.value = props.remark;
}

function onRemarkStepConfirm() {
  remarkModel.value = draftRemark.value;
  void nextTick(() => {
    if (showBatchStubOnly.value) {
      minerFeeAnchoredRef.value?.openPanel?.();
      return;
    }
    gasFeePopoverRef.value?.open?.();
  });
}

function onMinerFeeStepConfirm(selection: MinerFeeSelection | null) {
  minerFeeAnchoredRef.value?.close?.();
  gasFeePopoverRef.value?.close?.();
  emit('confirm', selection);
}

function onMinerFeePopoverTopToolClose() {
  minerFeeAnchoredRef.value?.close?.();
  gasFeePopoverRef.value?.close?.();
}

function onMinerFeePopoverDismiss() {
  resetMinerFeeFlow();
}

function onGasFeeConfirm(payload: { displayValue: string }) {
  if (!resolvedMinerFeeProfile.value) return;
  onMinerFeeStepConfirm({
    profileKind: resolvedMinerFeeProfile.value.kind,
    displayValue: payload.displayValue,
  });
}

async function onDirectMinerFeeTriggerClick() {
  if (minerFeeExpanded.value) {
    minerFeeAnchoredRef.value?.close?.();
    gasFeePopoverRef.value?.close?.();
    return;
  }
  if (props.onBeforeOpen) {
    try {
      await props.onBeforeOpen();
    } catch {
      return;
    }
  }
  if (showBatchStubOnly.value) {
    minerFeeAnchoredRef.value?.openPanel?.();
    return;
  }
  gasFeePopoverRef.value?.open?.();
}

function onDirectMinerFeeTooltipClose() {
  minerFeeExpanded.value = false;
  resetMinerFeeFlow();
  emit('dismiss');
}

function onDirectMinerFeeTooltipOpen() {
  minerFeeExpanded.value = true;
}

function onRemarkDismissRestore() {
  draftRemark.value = props.remark;
}

function onRemarkOnlyConfirm() {
  emit('confirm', null);
}
</script>

<template>
  <EgTooltip
    v-if="hasMinerFeeStep && skipRemarkStep && showBatchStubOnly"
    ref="minerFeeAnchoredRef"
    placement="top"
    align="center"
    trigger="click"
    :click-toggle="false"
    :wrap-tooltip="false"
    :boundary-selector="boundarySelector"
    teleport-to=".app-preview"
    token-scope-class="desktopTokens"
    @open="onDirectMinerFeeTooltipOpen"
    @close="onDirectMinerFeeTooltipClose"
  >
    <slot
      name="trigger"
      :active="minerFeeExpanded"
      :on-click="onDirectMinerFeeTriggerClick"
    />
    <template #content>
      <EgPopover
        v-bind="MINER_FEE_POPOVER_CHROME"
        :top-tool-title="minerFeeTopToolTitle"
        @top-tool-close="onMinerFeePopoverTopToolClose"
      >
        <ApprovalRemarkPopoverPanel
          ref="minerFeePanelRef"
          :selected-count="selectedCount"
          :remark="remark"
          :miner-fee-profile="resolvedMinerFeeProfile"
          :require-miner-fee="requireMinerFee"
          :placeholder-key="placeholderKey"
          :feedback-key="feedbackKey"
          :confirm-tone="minerFeeConfirmTone"
          :reset-remark-on-mount="false"
          @update:remark="emit('update:remark', $event)"
          @miner-fee-screen-change="onMinerFeeScreenChange"
          @confirm="onMinerFeeStepConfirm"
        />
      </EgPopover>
    </template>
  </EgTooltip>

  <EgGasFeePopover
    v-else-if="hasMinerFeeStep && skipRemarkStep && gasFeeNetwork"
    ref="gasFeePopoverRef"
    :network="gasFeeNetwork"
    :translate="ui"
    :symbol="gasFeeSymbol"
    :title="minerFeeTopToolTitle"
    :transaction-count="minerFeeTransactionCount"
    :boundary-selector="boundarySelector"
    :on-before-open="onBeforeOpen"
    @confirm="onGasFeeConfirm"
    @dismiss="onMinerFeePopoverDismiss"
  >
    <template #trigger="triggerSlot">
      <slot name="trigger" v-bind="triggerSlot" />
    </template>
  </EgGasFeePopover>

  <EgTooltip
    v-else-if="hasMinerFeeStep"
    ref="minerFeeAnchoredRef"
    placement="top"
    align="center"
    trigger="click"
    :click-toggle="false"
    :wrap-tooltip="false"
    :boundary-selector="boundarySelector"
    teleport-to=".app-preview"
    token-scope-class="desktopTokens"
    @close="onMinerFeePopoverDismiss"
  >
    <EgRemarkPopover
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
      <template #trigger="triggerSlot">
        <slot name="trigger" v-bind="triggerSlot" />
      </template>
    </EgRemarkPopover>
    <template #content>
      <EgPopover
        v-bind="MINER_FEE_POPOVER_CHROME"
        :top-tool-title="minerFeeTopToolTitle"
        @top-tool-close="onMinerFeePopoverTopToolClose"
      >
        <ApprovalRemarkPopoverPanel
          ref="minerFeePanelRef"
          :selected-count="selectedCount"
          :remark="remark"
          :miner-fee-profile="resolvedMinerFeeProfile"
          :require-miner-fee="requireMinerFee"
          :placeholder-key="placeholderKey"
          :feedback-key="feedbackKey"
          :confirm-tone="minerFeeConfirmTone"
          :reset-remark-on-mount="false"
          @update:remark="emit('update:remark', $event)"
          @miner-fee-screen-change="onMinerFeeScreenChange"
          @confirm="onMinerFeeStepConfirm"
        />
      </EgPopover>
    </template>
  </EgTooltip>

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
