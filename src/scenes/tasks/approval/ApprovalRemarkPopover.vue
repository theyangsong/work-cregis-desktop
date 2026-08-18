<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import {
  EgAnchoredPopover,
  EgAnchoredTooltip,
  EgPopover,
  POPOVER_PRESET_WIDTH_BASE,
  REMARK_POPOVER_MAX_LENGTH,
  type ButtonTone,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  resolveMinerFeePopoverTitleKey,
  type MinerFeeProfile,
  type MinerFeeSelection,
} from '../shared/minerFeeProfile';
import ApprovalRemarkFormPanel from './ApprovalRemarkFormPanel.vue';
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
    /** 备注 Popover 内「确定」按钮 tone；驳回等破坏性操作用 danger。 */
    confirmTone?: ButtonTone;
    /** 矿工费 Popover 内「确定」按钮 tone。 */
    minerFeeConfirmTone?: ButtonTone;
  }>(),
  {
    selectedCount: 1,
    showMinerFee: false,
    boundarySelector: '.eds-data-list',
    placeholderKey: 'Please Enter',
    feedbackKey: 'Optional, up to 256 characters.',
    requireMinerFee: false,
    confirmTone: 'decor',
    minerFeeConfirmTone: 'decor',
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  confirm: [selection: MinerFeeSelection | null];
  dismiss: [];
}>();

const { ui } = useAppI18n();

const remarkPanelRef = ref<{ resetRemark: () => void } | null>(null);
const minerFeePanelRef = ref<InstanceType<typeof ApprovalRemarkPopoverPanel> | null>(null);
const minerFeeAnchoredRef = ref<{ close: () => void; openPanel: () => void } | null>(null);
const minerFeeScreen = ref<MinerFeeScreen>('list');

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

/** 矿工费列表 / 自定义子页均复用 Popover topTool（「矿工费」+ 关闭）；返回键由子页注入 topTool 行。 */
const showTopTool = computed(() => true);

function resetMinerFeeFlow() {
  minerFeePanelRef.value?.resetMinerFeeFlow();
  minerFeeScreen.value = 'list';
}

function onDismiss() {
  remarkPanelRef.value?.resetRemark();
  resetMinerFeeFlow();
  minerFeeAnchoredRef.value?.close();
  emit('update:remark', '');
  emit('dismiss');
}

function onMinerFeeScreenChange(screen: MinerFeeScreen) {
  minerFeeScreen.value = screen;
}

function onRemarkStepConfirm(close: () => void) {
  close();
  void nextTick(() => {
    minerFeeAnchoredRef.value?.openPanel();
  });
}

function onMinerFeeStepConfirm(selection: MinerFeeSelection | null) {
  minerFeeAnchoredRef.value?.close();
  emit('confirm', selection);
}

function onMinerFeePopoverTopToolClose() {
  minerFeeAnchoredRef.value?.close();
}

function onMinerFeePopoverDismiss() {
  resetMinerFeeFlow();
}
</script>

<template>
  <EgAnchoredTooltip
    v-if="hasMinerFeeStep"
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
    <EgAnchoredPopover
      :boundary-selector="boundarySelector"
      teleport-to=".app-preview"
      placement="top"
      width-mode="fixed"
      :width="POPOVER_PRESET_WIDTH_BASE"
      :top-tool="showTopTool"
      :top-tool-title="title"
      top-tool-closable
      :on-before-open="onBeforeOpen"
      @dismiss="onDismiss"
    >
      <template #trigger="triggerSlot">
        <slot name="trigger" v-bind="triggerSlot" />
      </template>
      <template #default="{ close }">
        <ApprovalRemarkFormPanel
          ref="remarkPanelRef"
          v-model="remarkModel"
          :label="ui('Remark')"
          :placeholder="ui(placeholderKey)"
          :feedback-text="feedbackKey"
          :confirm-label="ui('Confirm')"
          :confirm-tone="confirmTone"
          hide-label
          @confirm="onRemarkStepConfirm(close)"
        />
      </template>
    </EgAnchoredPopover>
    <template #content>
      <EgPopover
        placement="top"
        align="center"
        top-tool
        :top-tool-title="minerFeeTopToolTitle"
        top-tool-closable
        width-mode="fixed"
        :width="POPOVER_PRESET_WIDTH_BASE"
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
  </EgAnchoredTooltip>

  <EgAnchoredPopover
    v-else
    :boundary-selector="boundarySelector"
    teleport-to=".app-preview"
    placement="top"
    width-mode="fixed"
    :width="POPOVER_PRESET_WIDTH_BASE"
    :top-tool="showTopTool"
    :top-tool-title="title"
    top-tool-closable
    :on-before-open="onBeforeOpen"
    @dismiss="onDismiss"
  >
    <template #trigger="triggerSlot">
      <slot name="trigger" v-bind="triggerSlot" />
    </template>
    <template #default="{ close }">
      <ApprovalRemarkPopoverPanel
        ref="minerFeePanelRef"
        :selected-count="selectedCount"
        :remark="remark"
        :confirm-tone="confirmTone"
        :placeholder-key="placeholderKey"
        :feedback-key="feedbackKey"
        @update:remark="emit('update:remark', $event)"
        @miner-fee-screen-change="onMinerFeeScreenChange"
        @confirm="(selection) => { emit('confirm', selection); close(); }"
        @cancel="close"
      />
    </template>
  </EgAnchoredPopover>
</template>
