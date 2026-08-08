<script setup lang="ts">
import {
  EgButton,
  EgDivider,
  EgFlotation,
  EgFlotationMenu,
  EgFlotationMenuItem,
  EgFlotationTrigger,
  EgIcon,
  EgIconButton,
  type DetailItemData,
} from '@eds/desktop-components';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import './signingCustomPopupHost.css';
import {
  SIGNING_FOOTER_LATENCY_MENU_TITLE,
  signingFooterLatencyNetworkItems,
} from './signingFooterLatencyMenu';
import SigningCustomPopupItemRow from './SigningCustomPopupItemRow.vue';
import SigningCustomPopupProgress from './SigningCustomPopupProgress.vue';
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

const selectedLatencyIndex = ref(0);

const selectedLatencyNetwork = computed(
  () =>
    signingFooterLatencyNetworkItems[selectedLatencyIndex.value]
    ?? signingFooterLatencyNetworkItems[0]!,
);

function selectLatencyNetwork(index: number, close: () => void) {
  selectedLatencyIndex.value = index;
  close();
}

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

      <footer
        :class="[
          styles.toolbar,
          styles.toolbarScrim,
          scrollOverflows && styles.toolbarScrimActive,
        ]"
      >
        <div :class="styles.toolbarScrimContent">
          <div :class="styles.toolbarPage">
            <EgDivider
              :class="styles.toolbarDivider"
              type="module"
              direction="horizontal"
            />
            <div :class="styles.toolbarBar">
              <div :class="styles.toolbarStart">
                <EgFlotation
                  :class="styles.latencyFlotation"
                  :style="{ '--latency-status-color': selectedLatencyNetwork.statusColor }"
                  placement="top"
                  trigger-style="text"
                  trigger-size="md"
                  :show-add="false"
                  boundary-selector=".app-preview"
                  flip
                  close-on-scroll
                >
                  <template #trigger="{ expanded }">
                    <EgFlotationTrigger
                      trigger-style="text"
                      size="md"
                      label=""
                      show-symbol
                      symbol-icon="eds-wifi-fill"
                      :expanded="expanded"
                    >
                      <template #message>
                        <span :class="styles.latencyText">
                          {{ selectedLatencyNetwork.statusLabel }}
                        </span>
                      </template>
                    </EgFlotationTrigger>
                  </template>
                  <template #content="{ close }">
                    <EgFlotationMenu
                      list-scroll
                      :show-add="false"
                      :show-divider="false"
                      width-mode="fixed"
                      :width="280"
                      height-mode="adaptive"
                    >
                      <template #header>
                        <p :class="styles.latencyMenuTitle">
                          {{ SIGNING_FOOTER_LATENCY_MENU_TITLE }}
                        </p>
                      </template>
                      <EgFlotationMenuItem
                        v-for="(network, index) in signingFooterLatencyNetworkItems"
                        :key="network.key"
                        box-type="text"
                        :label="network.label"
                        :focused="selectedLatencyIndex === index"
                        :show-tag="false"
                        @click="selectLatencyNetwork(index, close)"
                      >
                        <template #message>
                          <span
                            :class="styles.latencyMenuStatus"
                            :style="{ color: network.statusColor }"
                          >
                            {{ network.statusLabel }}
                          </span>
                        </template>
                      </EgFlotationMenuItem>
                    </EgFlotationMenu>
                  </template>
                </EgFlotation>
              </div>

              <div
                v-if="showFooterActions"
                :class="[styles.toolbarActions, styles.toolbarActionsRight]"
              >
                <slot name="actions">
                  <EgButton tone="decor" variant="solid" size="md" @click="emit('close')">
                    Close
                  </EgButton>
                </slot>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
