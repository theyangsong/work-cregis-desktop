<script setup lang="ts">
import {
  EgButton,
  EgIcon,
  EgIconButton,
  MOTION_LAYOUT_DEFORM_CONTENT,
  MOTION_LAYOUT_DEFORM_CONTENT_ENTERING,
  MOTION_LAYOUT_DEFORM_CONTENT_EXITING,
  useMotionLayoutDeformPageSwitch,
  type DetailItemData,
  type MotionLayoutDeformPageSpec,
} from '@eds/desktop-components';
import chromeScrimStyles from '@eds/desktop-components/styles/popupChromeScrim.module.css';
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue';
import DetailToolbarSlot from '../shared/DetailToolbarSlot.vue';
import './signingCustomPopupHost.css';
import SigningCustomPopupItemRow from './SigningCustomPopupItemRow.vue';
import SigningCustomPopupProgress from './SigningCustomPopupProgress.vue';
import SigningFooterLatencyToolbar from './SigningFooterLatencyToolbar.vue';
import SigningMpcNetworkErrorPanel from './SigningMpcNetworkErrorPanel.vue';
import type { SigningCustomPopupProgressStep } from './signingCustomPopupProgress.types';
import { useSigningCustomPopupHost } from './useSigningCustomPopupHost';
import styles from './SigningCustomPopupPanel.module.css';

type ProgressBodyPage = 'signing' | 'sign-failed';

const props = withDefaults(
  defineProps<{
    items: DetailItemData[];
    progressSteps: SigningCustomPopupProgressStep[];
    contentVariant?: 'detail' | 'mpc-network-error';
    footerMode?: 'latency' | 'detail-toolbar';
    footerLatencyLabel?: string;
    footerLatencyColor?: string;
    showFooterActions?: boolean;
    mpcNetworkSelectedIndex?: number | null;
  }>(),
  {
    contentVariant: 'detail',
    footerMode: 'latency',
    showFooterActions: false,
    mpcNetworkSelectedIndex: null,
  },
);

const emit = defineEmits<{
  close: [];
  retry: [];
  'update:mpcNetworkSelectedIndex': [value: number | null];
}>();

const shellRef = ref<HTMLElement | null>(null);
useSigningCustomPopupHost(shellRef);

const SCROLL_EDGE_EPSILON = 2;

const bodyDeformRef = ref<HTMLElement | null>(null);
const signingBodyMeasureRef = ref<HTMLElement | null>(null);
const failedBodyMeasureRef = ref<HTMLElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const scrollContentRef = ref<HTMLElement | null>(null);
const scrollOverflows = ref(false);
const bodyMounted = ref(false);
let scrollResizeObserver: ResizeObserver | undefined;

const pageSpecs = reactive<Record<ProgressBodyPage, MotionLayoutDeformPageSpec>>({
  signing: { shellHeight: 320 },
  'sign-failed': { shellHeight: 320 },
});

const {
  activePage,
  shellHeight,
  contentExiting,
  contentEntering,
  contentDirection,
  switchTo,
} = useMotionLayoutDeformPageSwitch<ProgressBodyPage>(pageSpecs, 'signing');

const deformUsesPixelHeight = computed(
  () => contentExiting.value || contentEntering.value,
);

const deformShellStyle = computed(() =>
  deformUsesPixelHeight.value
    ? { height: `${shellHeight.value}px` }
    : undefined,
);

const deformContentClass = computed(() => [
  MOTION_LAYOUT_DEFORM_CONTENT,
  styles.deformContent,
  contentDirection.value,
  contentExiting.value && MOTION_LAYOUT_DEFORM_CONTENT_EXITING,
  contentEntering.value && MOTION_LAYOUT_DEFORM_CONTENT_ENTERING,
]);

const isSigningBodyPage = computed(() => activePage.value === 'signing');
const isSignFailedBodyPage = computed(() => activePage.value === 'sign-failed');

function contentVariantToPage(
  variant: 'detail' | 'mpc-network-error',
): ProgressBodyPage {
  return variant === 'mpc-network-error' ? 'sign-failed' : 'signing';
}

function readMeasureHeight(element: HTMLElement | null): number {
  if (!element) {
    return 0;
  }
  return Math.max(Math.ceil(element.getBoundingClientRect().height), 0);
}

function readBodyViewportHeight(): number {
  const fromShell = bodyDeformRef.value?.clientHeight ?? 0;
  if (fromShell > 0) {
    return fromShell;
  }
  return Math.max(
    readMeasureHeight(signingBodyMeasureRef.value),
    readMeasureHeight(failedBodyMeasureRef.value),
    280,
  );
}

function syncBodyPageHeights() {
  const viewportHeight = readBodyViewportHeight();
  if (viewportHeight <= 0) {
    return;
  }

  pageSpecs.signing.shellHeight = viewportHeight;
  pageSpecs['sign-failed'].shellHeight = viewportHeight;

  if (!contentExiting.value && !contentEntering.value) {
    shellHeight.value = viewportHeight;
  }
}

function onMpcNetworkSelectedIndexUpdate(value: number | null) {
  emit('update:mpcNetworkSelectedIndex', value);
}

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

async function bootstrapBodyPage() {
  await nextTick();
  syncBodyPageHeights();

  const targetPage = contentVariantToPage(props.contentVariant);
  activePage.value = targetPage;
  contentExiting.value = false;
  contentEntering.value = false;
  contentDirection.value = null;

  if (pageSpecs[targetPage].shellHeight > 0) {
    shellHeight.value = pageSpecs[targetPage].shellHeight;
  }

  observeScrollTargets();
  bodyMounted.value = true;
}

onMounted(() => {
  void bootstrapBodyPage();
});

onUnmounted(() => {
  scrollResizeObserver?.disconnect();
});

watch(
  () => props.contentVariant,
  async (variant) => {
    if (!bodyMounted.value) {
      return;
    }

    const nextPage = contentVariantToPage(variant);
    await nextTick();
    syncBodyPageHeights();
    switchTo(nextPage);
  },
);

watch(activePage, async () => {
  await nextTick();
  scrollRef.value?.scrollTo({ top: 0 });
  observeScrollTargets();
});

watch(
  () => [props.items.length, props.progressSteps] as const,
  () => {
    void nextTick(syncBodyPageHeights);
  },
);
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
        ref="bodyDeformRef"
        class="motion-layout-deform"
        :class="styles.bodyDeform"
        :style="deformShellStyle"
        :data-signing-body-page="activePage"
      >
        <div :class="deformContentClass">
          <div :class="styles.pageShell">
            <div
              ref="scrollRef"
              :class="styles.scroll"
              @scroll="onScroll"
            >
              <div ref="scrollContentRef" :class="styles.itemList">
                <template v-if="isSigningBodyPage">
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
                </template>

                <SigningMpcNetworkErrorPanel
                  v-else
                  :selected-index="mpcNetworkSelectedIndex"
                  @update:selected-index="onMpcNetworkSelectedIndexUpdate"
                />
              </div>
            </div>

            <footer
              v-if="isSignFailedBodyPage"
              :class="[
                styles.toolbar,
                !scrollOverflows && styles.toolbarSolid,
                chromeScrimStyles.root,
                scrollOverflows && chromeScrimStyles.active,
              ]"
            >
              <div :class="chromeScrimStyles.content">
                <DetailToolbarSlot
                  :show-toolbar-nav="false"
                  toolbar-divider-pinned
                >
                  <template #actions>
                    <slot name="actions" />
                  </template>
                </DetailToolbarSlot>
              </div>
            </footer>

            <SigningFooterLatencyToolbar
              v-else
              toolbar-bar-preset="customPopup"
              :scroll-overflows="scrollOverflows"
              :show-actions="showFooterActions"
              :latency-label="footerLatencyLabel"
              :latency-color="footerLatencyColor"
            >
              <template #actions>
                <EgButton tone="decor" variant="solid" size="md" @click="emit('close')">
                  Close
                </EgButton>
              </template>
            </SigningFooterLatencyToolbar>
          </div>
        </div>
      </div>

      <div :class="styles.measureHost" aria-hidden="true">
        <div ref="signingBodyMeasureRef" :class="styles.measureBody">
          <div :class="styles.itemList">
            <div
              v-for="(item, index) in items"
              :key="`measure-signing-${item.key ?? index}`"
              :class="styles.item"
            >
              <SigningCustomPopupItemRow
                :item="item"
                :item-index="index"
              />
            </div>
          </div>

          <SigningFooterLatencyToolbar
            :class="styles.measureFooter"
            toolbar-bar-preset="customPopup"
            :scroll-overflows="false"
            :show-actions="showFooterActions"
            :latency-label="footerLatencyLabel"
            :latency-color="footerLatencyColor"
          />
        </div>

        <div ref="failedBodyMeasureRef" :class="styles.measureBody">
          <div :class="styles.itemList">
            <SigningMpcNetworkErrorPanel />
          </div>

          <footer :class="[styles.toolbar, styles.toolbarSolid, styles.measureFooter]">
            <DetailToolbarSlot
              :show-toolbar-nav="false"
              toolbar-divider-pinned
            >
              <template #actions>
                <EgButton tone="decor" variant="solid" size="md" tabindex="-1">
                  Retry
                </EgButton>
              </template>
            </DetailToolbarSlot>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>
