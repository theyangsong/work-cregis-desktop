<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useSlots, watch } from 'vue';
import { EgIcon, EgIconButton, type ButtonTone, type ButtonVariant } from '@eds/desktop-components';
import chromeScrimStyles from '@eds/desktop-components/styles/popupChromeScrim.module.css';
import { useAppI18n } from '@/composables/useAppI18n';
import '@/styles/popup-inner-backdrop.css';
import {
  POPUP_SLOT_CONTENT_INSET_PRESETS,
  type PopupSlotContentInsetPreset,
} from './popupSlotContentInset';
import SigningBatchPopupSlotFooterBody from './SigningBatchPopupSlotFooterBody.vue';
import styles from './SigningBatchPopupSlotChrome.module.css';
import './batchSigning.popupSlotHost.css';

defineOptions({
  inheritAttrs: false,
});

const SCROLL_EDGE_EPSILON = 2;

const props = withDefaults(
  defineProps<{
    showSystemBarClose?: boolean;
    showToolbar?: boolean;
    showToolbarCancel?: boolean;
    showToolbarConfirm?: boolean;
    toolbarConfirmDisabled?: boolean;
    toolbarConfirmLabel?: string;
    toolbarCancelLabel?: string;
    toolbarCancelTone?: ButtonTone;
    toolbarCancelVariant?: ButtonVariant;
    toolbarConfirmTone?: ButtonTone;
    toolbarDividerPinned?: boolean;
    scrollFadeTopEnabled?: boolean;
    innerBackdrop?: boolean;
    contentInsetPreset?: PopupSlotContentInsetPreset;
    /** 与内容区 deform 同步的 footer 页（summary / detail / reasons）；仅切换内容，不做 motion-page。 */
    footerMotionKey?: string;
    /** contentFill 时内层滚动容器仍有内容被裁切（驱动 footer scrim）。 */
    nestedScrollOverflows?: boolean;
    contentFill?: boolean;
    systemBarCloseIcon?: string;
    systemBarCloseLabel?: string;
    systemBarCloseDisabled?: boolean;
  }>(),
  {
    showSystemBarClose: true,
    showToolbar: true,
    showToolbarCancel: true,
    showToolbarConfirm: true,
    toolbarConfirmDisabled: false,
    toolbarCancelTone: 'decor',
    toolbarCancelVariant: 'text',
    toolbarConfirmTone: 'decor',
    toolbarDividerPinned: false,
    innerBackdrop: true,
    contentInsetPreset: 'md',
    nestedScrollOverflows: false,
    contentFill: false,
    systemBarCloseIcon: 'eds-close-circle-fill',
    systemBarCloseDisabled: false,
    scrollFadeTopEnabled: true,
  },
);

const emit = defineEmits<{
  close: [];
  'toolbar-cancel': [];
  'toolbar-confirm': [];
}>();

const slots = useSlots();
const { ui } = useAppI18n();

const scrollRef = ref<HTMLElement | null>(null);
const scrollContentRef = ref<HTMLElement | null>(null);

/** 对齐 Showcase PopupCustomSlotChrome：下方仍有内容被裁切时开 scrim。 */
const scrollOverflows = ref(false);
const scrollFadeTop = ref(false);

let scrollResizeObserver: ResizeObserver | undefined;

const showChromeFooter = computed(() => {
  if (props.footerMotionKey) {
    return true;
  }
  return props.showToolbar || hasFooterSlotContent();
});

function hasFooterSlotContent() {
  const slot = slots.footer;
  if (!slot) return false;
  return slot().length > 0;
}

function showFooterPaginerRow() {
  if (props.footerMotionKey) {
    return props.footerMotionKey !== 'summary' && hasFooterSlotContent();
  }
  return hasFooterSlotContent();
}

function showFooterToolbarRow() {
  if (props.footerMotionKey) {
    return props.footerMotionKey === 'summary';
  }
  return props.showToolbar;
}

const resolvedCancelLabel = () => props.toolbarCancelLabel ?? ui('Cancel');
const resolvedConfirmLabel = () => props.toolbarConfirmLabel ?? ui('Confirm');
const resolvedSystemBarCloseLabel = () => props.systemBarCloseLabel ?? ui('Close');

function onSystemBarCloseClick() {
  if (props.systemBarCloseDisabled) {
    return;
  }
  emit('close');
}

const footerScrimActive = computed(() => {
  if (props.nestedScrollOverflows) {
    return true;
  }
  if (props.footerMotionKey === 'summary') {
    // 摘要：滚离顶部且下方仍有内容时才开 scrim，避免未滚动时常驻。
    return scrollFadeTop.value && scrollOverflows.value;
  }
  return scrollOverflows.value;
});

const showToolbarDivider = computed(() => {
  if (props.footerMotionKey) {
    if (props.footerMotionKey !== 'summary') {
      return false;
    }
    return scrollOverflows.value || props.toolbarDividerPinned;
  }
  if (hasFooterSlotContent()) {
    return false;
  }
  return props.showToolbar || scrollOverflows.value || props.toolbarDividerPinned;
});

const scrollBodyInset = computed(
  () => POPUP_SLOT_CONTENT_INSET_PRESETS[props.contentInsetPreset],
);

const scrollBodyStyle = computed(() => ({
  padding: scrollBodyInset.value,
  '--eds-popup-slot-content-inset': scrollBodyInset.value,
}));

function updateScrollState() {
  const element = scrollRef.value;

  if (!element) {
    scrollOverflows.value = false;
    scrollFadeTop.value = false;
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = element;
  const canScroll = scrollHeight - clientHeight > SCROLL_EDGE_EPSILON;
  const hasHiddenContentBelow =
    canScroll && scrollTop + clientHeight < scrollHeight - SCROLL_EDGE_EPSILON;

  scrollOverflows.value = hasHiddenContentBelow;
  scrollFadeTop.value = canScroll && scrollTop > SCROLL_EDGE_EPSILON;
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

function scheduleChromeUpdate() {
  void nextTick(observeScrollTargets);
}

onMounted(scheduleChromeUpdate);
onUpdated(scheduleChromeUpdate);

watch(scrollRef, scheduleChromeUpdate);
watch(scrollContentRef, scheduleChromeUpdate);

watch(
  () => [props.showToolbar, props.contentInsetPreset, props.contentFill, props.footerMotionKey] as const,
  scheduleChromeUpdate,
);

onBeforeUnmount(() => {
  scrollResizeObserver?.disconnect();
});

function onScroll() {
  updateScrollState();
}

function scrollToTop() {
  if (scrollRef.value) {
    scrollRef.value.scrollTop = 0;
  }
}

defineExpose({
  scrollToTop,
  readScrollViewportHeight: () => scrollRef.value?.clientHeight ?? 0,
});
</script>

<template>
  <div
    class="eds-popup-slot-chrome"
    :class="[styles.root, innerBackdrop && 'eds-popup-inner-backdrop']"
    data-no-corner-smoothing
  >
    <div v-if="showSystemBarClose" :class="styles.systemBarClose">
      <EgIconButton
        shape="square"
        size="md"
        :label="resolvedSystemBarCloseLabel()"
        motion="asym"
        :disabled="systemBarCloseDisabled"
        @click="onSystemBarCloseClick"
      >
        <EgIcon :name="systemBarCloseIcon" fit />
      </EgIconButton>
    </div>

    <div
      ref="scrollRef"
      :class="[
        styles.scroll,
        scrollFadeTopEnabled && scrollFadeTop && styles.scrollFadeTop,
        contentFill && styles.scrollContentFill,
      ]"
      @scroll="onScroll"
    >
      <div
        :class="[
          styles.scrollTopEdge,
          scrollFadeTop && styles.scrollTopEdgeVisible,
        ]"
        aria-hidden="true"
      />

      <div
        ref="scrollContentRef"
        :class="[styles.scrollBody, contentFill && styles.scrollBodyFill]"
        :style="scrollBodyStyle"
      >
        <div :class="[styles.slotHost, contentFill && styles.slotHostFill]">
          <slot />
        </div>
      </div>
    </div>

    <footer
      v-if="showChromeFooter"
      :class="[
        styles.toolbar,
        chromeScrimStyles.root,
        footerScrimActive && chromeScrimStyles.active,
      ]"
    >
      <div :class="chromeScrimStyles.content">
        <SigningBatchPopupSlotFooterBody
          v-if="showFooterToolbarRow() || showFooterPaginerRow()"
          :key="footerMotionKey ?? 'default'"
          :show-toolbar-divider="showToolbarDivider"
          :show-paginer-row="showFooterPaginerRow()"
          :show-toolbar-row="showFooterToolbarRow()"
          :show-toolbar-cancel="showToolbarCancel"
          :show-toolbar-confirm="showToolbarConfirm"
          :toolbar-confirm-disabled="toolbarConfirmDisabled"
          :toolbar-cancel-label="resolvedCancelLabel()"
          :toolbar-confirm-label="resolvedConfirmLabel()"
          :toolbar-cancel-tone="toolbarCancelTone"
          :toolbar-cancel-variant="toolbarCancelVariant"
          :toolbar-confirm-tone="toolbarConfirmTone"
          @toolbar-cancel="emit('toolbar-cancel')"
          @toolbar-confirm="emit('toolbar-confirm')"
        >
          <template v-if="$slots['toolbar-confirm']" #toolbar-confirm>
            <slot name="toolbar-confirm" />
          </template>
          <template #footer>
            <slot name="footer" />
          </template>
          <template #footer-actions>
            <slot name="footer-actions" />
          </template>
        </SigningBatchPopupSlotFooterBody>
      </div>
    </footer>
  </div>
</template>
