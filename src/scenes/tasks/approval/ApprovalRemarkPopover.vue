<script setup lang="ts">
import { computed, ref } from 'vue';
import { EgAnchoredPopover, POPOVER_PRESET_WIDTH_BASE } from '@eds/desktop-components';
import ApprovalRemarkPopoverPanel from './ApprovalRemarkPopoverPanel.vue';

type MinerFeeScreen = 'list' | 'custom';

const props = withDefaults(
  defineProps<{
    remark: string;
    selectedCount?: number;
    title: string;
    showMinerFee?: boolean;
    boundarySelector?: string;
    onBeforeOpen?: () => void | Promise<void>;
    placeholderKey?: string;
    feedbackKey?: string;
  }>(),
  {
    selectedCount: 1,
    showMinerFee: false,
    boundarySelector: '.eds-data-list',
    placeholderKey: 'Please enter',
    feedbackKey: 'Optional, Max. 256 characters',
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  confirm: [];
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
        :placeholder-key="placeholderKey"
        :feedback-key="feedbackKey"
        @update:remark="emit('update:remark', $event)"
        @miner-fee-screen-change="onMinerFeeScreenChange"
        @confirm="() => { emit('confirm'); close(); }"
        @cancel="close"
      />
    </template>
  </EgAnchoredPopover>
</template>
