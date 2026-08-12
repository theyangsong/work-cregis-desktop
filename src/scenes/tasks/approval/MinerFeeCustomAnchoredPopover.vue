<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { EgAnchoredPopover, POPOVER_PRESET_WIDTH_BASE } from '@eds/desktop-components';
import MinerFeeCustomPanel from './MinerFeeCustomPanel.vue';
import type { MinerFeeCustomDraft } from './minerFeeCustomTypes';
import styles from './ApprovalRemarkPopoverPanel.module.css';

const props = withDefaults(
  defineProps<{
    draft?: MinerFeeCustomDraft;
    symbol?: string;
    boundarySelector?: string;
  }>(),
  {
    symbol: 'ETH',
    boundarySelector: '.eds-popup',
  },
);

const emit = defineEmits<{
  save: [draft: MinerFeeCustomDraft];
  open: [];
  dismiss: [];
}>();

type MinerFeeCustomAnchoredPopoverExpose = {
  open: () => void;
  close: () => void;
};

const popoverRef = ref<MinerFeeCustomAnchoredPopoverExpose | null>(null);
const hostRef = ref<HTMLElement | null>(null);
const popoverOpen = ref(false);
const blockerStyle = ref<Record<string, string>>({ display: 'none' });

let lockedScrollEl: HTMLElement | null = null;
let lockedScrollOverflow = '';

function resolvePopupEl(): HTMLElement | null {
  return hostRef.value?.closest('.eds-popup') ?? null;
}

function updateBlockerStyle() {
  const popup = resolvePopupEl();
  if (!popup || !popoverOpen.value) {
    blockerStyle.value = { display: 'none' };
    return;
  }

  const rect = popup.getBoundingClientRect();
  blockerStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
}

function resolvePopupScrollContainer(): HTMLElement | null {
  const chrome = hostRef.value?.closest('.eds-popup-slot-chrome');
  if (!chrome) {
    return null;
  }
  return chrome.querySelector('[class*="scroll"]') as HTMLElement | null;
}

function lockUnderlyingScroll() {
  if (lockedScrollEl) {
    return;
  }

  const scrollEl = resolvePopupScrollContainer();
  if (!scrollEl) {
    return;
  }

  lockedScrollEl = scrollEl;
  lockedScrollOverflow = scrollEl.style.overflow;
  scrollEl.style.overflow = 'hidden';
}

function unlockUnderlyingScroll() {
  if (!lockedScrollEl) {
    return;
  }

  lockedScrollEl.style.overflow = lockedScrollOverflow;
  lockedScrollEl = null;
  lockedScrollOverflow = '';
}

function onSave(draft: MinerFeeCustomDraft, close: () => void) {
  emit('save', draft);
  close();
}

function onDismiss() {
  popoverOpen.value = false;
  unlockUnderlyingScroll();
  window.removeEventListener('resize', updateBlockerStyle);
  emit('dismiss');
}

function onOpen() {
  popoverOpen.value = true;
  lockUnderlyingScroll();
  updateBlockerStyle();
  window.addEventListener('resize', updateBlockerStyle);
  emit('open');
}

watch(popoverOpen, (open) => {
  if (open) {
    requestAnimationFrame(() => updateBlockerStyle());
  }
});

onBeforeUnmount(() => {
  unlockUnderlyingScroll();
  window.removeEventListener('resize', updateBlockerStyle);
});

defineExpose({
  open: () => popoverRef.value?.open(),
  close: () => popoverRef.value?.close(),
});
</script>

<template>
  <div ref="hostRef" :class="styles.minerFeeCustomAnchoredPopoverHost">
    <EgAnchoredPopover
      ref="popoverRef"
      :boundary-selector="boundarySelector"
      teleport-to=".app-preview"
      placement="top"
      align="center"
      :cross-axis-offset="342"
      :close-on-scroll="false"
      width-mode="fixed"
      :width="POPOVER_PRESET_WIDTH_BASE"
      top-tool
      top-tool-closable
      @open="onOpen"
      @dismiss="onDismiss"
    >
    <template #trigger="triggerSlot">
      <slot name="trigger" v-bind="triggerSlot" />
    </template>
    <template #default="{ close }">
      <div
        class="motion-layout-deform"
        :class="styles.minerFeeDeformShell"
        data-miner-fee-popover
        data-miner-fee-screen="custom"
        data-miner-fee-custom-anchored-popover
      >
        <MinerFeeCustomPanel
          :draft="draft"
          :symbol="symbol"
          hide-top-tool-back
          @cancel="close"
          @save="(draftValue) => onSave(draftValue, close)"
        />
      </div>
    </template>
    </EgAnchoredPopover>
    <Teleport to=".app-preview">
      <div
        v-if="popoverOpen"
        :class="styles.minerFeeCustomPopoverBlocker"
        :style="blockerStyle"
        aria-hidden="true"
      />
    </Teleport>
  </div>
</template>
