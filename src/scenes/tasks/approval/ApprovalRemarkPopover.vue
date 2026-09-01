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
import { MINER_FEE_POPOVER_CHROME } from '../shared/minerFeePopoverChrome';
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
    /** 有矿工费时跳过备注步，点击触发器直接进入矿工费（详情签名等）。 */
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

const remarkPanelRef = ref<{ resetRemark: () => void } | null>(null);
const minerFeePanelRef = ref<InstanceType<typeof ApprovalRemarkPopoverPanel> | null>(null);
const minerFeeAnchoredRef = ref<{ close: () => void; openPanel: () => void } | null>(null);
const minerFeeScreen = ref<MinerFeeScreen>('list');
const minerFeeExpanded = ref(false);

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

async function onDirectMinerFeeTriggerClick() {
  if (minerFeeExpanded.value) {
    minerFeeAnchoredRef.value?.close();
    return;
  }
  if (props.onBeforeOpen) {
    try {
      await props.onBeforeOpen();
    } catch {
      return;
    }
  }
  minerFeeAnchoredRef.value?.openPanel();
}

function onDirectMinerFeeTooltipClose() {
  minerFeeExpanded.value = false;
  resetMinerFeeFlow();
  emit('dismiss');
}

function onDirectMinerFeeTooltipOpen() {
  minerFeeExpanded.value = true;
}
</script>

<template>
  <EgAnchoredTooltip
    v-if="hasMinerFeeStep && skipRemarkStep"
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
  </EgAnchoredTooltip>

  <EgAnchoredTooltip
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
          :placeholder-key="placeholderKey"
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
