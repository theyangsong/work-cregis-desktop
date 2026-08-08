<script setup lang="ts">
import { computed } from 'vue';
import { EgAnchoredPopover, POPOVER_PRESET_WIDTH_BASE } from '@eds/desktop-components';
import ApprovalRemarkPopoverPanel from './ApprovalRemarkPopoverPanel.vue';

const props = withDefaults(
  defineProps<{
    remark: string;
    selectedCount?: number;
    title: string;
    showMinerFee?: boolean;
    boundarySelector?: string;
    onBeforeOpen?: () => void | Promise<void>;
  }>(),
  {
    selectedCount: 1,
    showMinerFee: false,
    boundarySelector: '.eds-data-list',
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  confirm: [];
  dismiss: [];
}>();

const popoverTitle = computed(() => props.title);

function onDismiss() {
  emit('update:remark', '');
  emit('dismiss');
}
</script>

<template>
  <EgAnchoredPopover
    :boundary-selector="boundarySelector"
    teleport-to=".app-preview"
    placement="top"
    width-mode="fixed"
    :width="POPOVER_PRESET_WIDTH_BASE"
    top-tool
    :top-tool-title="popoverTitle"
    top-tool-closable
    :on-before-open="onBeforeOpen"
    @dismiss="onDismiss"
  >
    <template #trigger="triggerSlot">
      <slot name="trigger" v-bind="triggerSlot" />
    </template>
    <template #default="{ close }">
      <ApprovalRemarkPopoverPanel
        :selected-count="selectedCount"
        :remark="remark"
        :show-miner-fee="showMinerFee"
        @update:remark="emit('update:remark', $event)"
        @confirm="() => { emit('confirm'); close(); }"
        @cancel="close"
      />
    </template>
  </EgAnchoredPopover>
</template>
