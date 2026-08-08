<script setup lang="ts">
import { computed, ref } from 'vue';
import { EgAnchoredPopover, POPOVER_PRESET_WIDTH_BASE } from '@eds/desktop-components';
import type { MinerFeeProfile, MinerFeeSelection } from '../shared/minerFeeProfile';
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
  }>(),
  {
    selectedCount: 1,
    showMinerFee: false,
    boundarySelector: '.eds-data-list',
    placeholderKey: 'Please enter',
    feedbackKey: 'Optional, Max. 256 characters',
    requireMinerFee: false,
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  confirm: [selection: MinerFeeSelection | null];
  dismiss: [];
}>();

const panelRef = ref<InstanceType<typeof ApprovalRemarkPopoverPanel> | null>(null);
const minerFeeScreen = ref<MinerFeeScreen>('list');

/** 矿工费列表 / 自定义子页均复用 Popover topTool（「矿工费」+ 关闭）；返回键由子页注入 topTool 行。 */
const showTopTool = computed(() => true);

function onDismiss() {
  panelRef.value?.resetMinerFeeFlow();
  minerFeeScreen.value = 'list';
  emit('update:remark', '');
  emit('dismiss');
}

function onMinerFeeScreenChange(screen: MinerFeeScreen) {
  minerFeeScreen.value = screen;
}
</script>

<template>
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
      <ApprovalRemarkPopoverPanel
        ref="panelRef"
        :selected-count="selectedCount"
        :remark="remark"
        :show-miner-fee="showMinerFee"
        :miner-fee-profile="minerFeeProfile"
        :require-miner-fee="requireMinerFee"
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
