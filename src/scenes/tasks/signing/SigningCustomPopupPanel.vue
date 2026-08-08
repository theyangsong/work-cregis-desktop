<script setup lang="ts">
import {
  EgButton,
  EgIcon,
  EgIconButton,
  type DetailItemData,
} from '@eds/desktop-components';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import './signingCustomPopupHost.css';
import SigningCustomPopupItemRow from './SigningCustomPopupItemRow.vue';
import SigningCustomPopupProgress from './SigningCustomPopupProgress.vue';
import SigningFooterLatencyToolbar from './SigningFooterLatencyToolbar.vue';
import type { SigningCustomPopupProgressStep } from './signingCustomPopupProgress.types';
import { useSigningCustomPopupHost } from './useSigningCustomPopupHost';
import styles from './SigningCustomPopupPanel.module.css';

const props = withDefaults(
  defineProps<{
    items: DetailItemData[];
    progressSteps: SigningCustomPopupProgressStep[];
    footerLatencyLabel?: string;
    showFooterActions?: boolean;
  }>(),
  {
    footerLatencyLabel: '122ms',
    showFooterActions: false,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const shellRef = ref<HTMLElement | null>(null);
useSigningCustomPopupHost(shellRef);

const SCROLL_EDGE_EPSILON = 2;

const scrollRef = ref<HTMLElement | null>(null);
const scrollContentRef = ref<HTMLElement | null>(null);
const scrollOverflows = ref(false);
let scrollResizeObserver: ResizeObserver | undefined;

function updateScrollState() {
  const element = scrollRef.value;

  if (!element) {
    scrollOverflows.value = false;
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = element;
  const canScroll = scrollHeight - clientHeight > SCROLL_EDGE_EPSILON;
  const hasHiddenContentBelow =
    canScroll && scrollTop + clientHeight < scrollHeight - SCROLL_EDGE_EPSILON;

  scrollOverflows.value = hasHiddenContentBelow;
}

function onScroll() {
  updateScrollState();
}

function observeScrollTargets() {
  scrollResizeObserver?.disconnect();
  scrollResizeObserver = new ResizeObserver(() => {
    updateScrollState();
  });
  if (scrollRef.value) {
    scrollResizeObserver.observe(scrollRef.value);
  }
  if (scrollContentRef.value) {
    scrollResizeObserver.observe(scrollContentRef.value);
  }
  updateScrollState();
}

onMounted(async () => {
  await nextTick();
  observeScrollTargets();
});

onUnmounted(() => {
  scrollResizeObserver?.disconnect();
});

watch([scrollRef, scrollContentRef, () => props.items.length], () => {
  void nextTick(observeScrollTargets);
});
</script>

<template>
  <div
    ref="shellRef"
    class="desktopTokens signing-custom-popup-shell"
    :class="styles.shell"
  >
    <div :class="styles.root">
      <div :class="styles.systemBarClose">
        <EgIconButton
          shape="square"
          size="md"
          label="关闭"
          motion="asym"
          @click="emit('close')"
        >
          <EgIcon name="eds-close-circle-fill" fit />
        </EgIconButton>
      </div>

      <SigningCustomPopupProgress :steps="progressSteps" />

      <div
        ref="scrollRef"
        :class="styles.scroll"
        @scroll="onScroll"
      >
        <div ref="scrollContentRef" :class="styles.itemList">
          <div
            v-for="(item, index) in items"
            :key="item.key ?? index"
            :class="styles.item"
          >
            <SigningCustomPopupItemRow
              :item="item"
              :item-index="index"
            />
          </div>
        </div>
      </div>

      <SigningFooterLatencyToolbar
        :scroll-overflows="scrollOverflows"
        :show-actions="showFooterActions"
      >
        <template #actions>
          <slot name="actions">
            <EgButton tone="decor" variant="solid" size="md" @click="emit('close')">
              Close
            </EgButton>
          </slot>
        </template>
      </SigningFooterLatencyToolbar>
    </div>
  </div>
</template>
