<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  reactive,
  ref,
  toRef,
  watch,
} from 'vue';
import {
  EgPopup,
  EgStreamer,
  EgButton,
  EgAnchoredTooltip,
  EgPopover,
  EgComboTextareaItem,
  EgFormSubmission,
  EgTextarea,
  POPOVER_PRESET_WIDTH_BASE,
  REMARK_POPOVER_MAX_LENGTH,
  MOTION_LAYOUT_DEFORM_CONTENT,
  MOTION_LAYOUT_DEFORM_CONTENT_ENTERING,
  MOTION_LAYOUT_DEFORM_CONTENT_EXITING,
  useMotionLayoutDeformPageSwitch,
  type MotionLayoutDeformPageSpec,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import { usePopupShellLifecycle } from '../../shared/usePopupShellLifecycle';
import ApprovalRemarkPopoverPanel from '../../approval/ApprovalRemarkPopoverPanel.vue';
import {
  type MinerFeeProfile,
  type MinerFeeSelection,
  resolveMinerFeePopoverTitleKey,
} from '../../shared/minerFeeProfile';
import { formatBreakdownLine, buildBatchSummary } from './buildBatchSummary';
import { splitDetailAmountHeadline } from '../../shared/splitDetailAmountHeadline';
import detailChromeStyles from '../../shared/detailPopupChrome.module.css';
import { DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS } from '../../tasksDataListPageData';
import { sortIneligibleByReasonOrder } from './evaluateBatchEligibility';
import type { BatchIneligibleReasonFilter } from './batchIneligibleReasonFilter';
import type { BatchEligibilityResult, BatchSummaryBreakdown, SigningBatchRowModel } from './types';
import {
  BATCH_SIGN_CONFIRM_POPUP_HEIGHT,
  BATCH_SIGN_CONFIRM_POPUP_WIDTH,
  MOCK_WITHDRAWAL_QUOTA_USD,
} from './batchSigning.constants';
import SigningBatchDataListPaginerBar from './SigningBatchDataListPaginerBar.vue';
import SigningBatchPopupSlotChrome from './SigningBatchPopupSlotChrome.vue';
import SigningBatchSignDetailPanel from './SigningBatchSignDetailPanel.vue';
import SigningBatchSignReasonsPanel from './SigningBatchSignReasonsPanel.vue';
import SigningBatchIneligibleReasonFilterDecor from './SigningBatchIneligibleReasonFilterDecor.vue';
import SigningBatchSignSubPageShell from './SigningBatchSignSubPageShell.vue';
import { useBatchSignConfirmEscape } from './useBatchSignConfirmEscape';
import styles from './batchSigning.shared.module.css';
import type { PopupSlotContentInsetPreset } from './popupSlotContentInset';

type ConfirmPage = 'summary' | 'detail' | 'reasons';

const props = defineProps<{
  open: boolean;
  shellSuspended?: boolean;
  eligibility: BatchEligibilityResult;
  summary: BatchSummaryBreakdown;
  remark: string;
  minerFeeProfile: MinerFeeProfile | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:remark': [value: string];
  confirm: [selection: MinerFeeSelection | null];
  cancel: [];
}>();

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  suspended: toRef(props, 'shellSuspended'),
  onClosed: () => {
    emit('update:open', false);
    emit('cancel');
  },
});

const { ui } = useAppI18n();

const summaryContentRef = ref<HTMLElement | null>(null);
const slotChromeRef = ref<InstanceType<typeof SigningBatchPopupSlotChrome> | null>(null);
const minerFeePanelRef = ref<InstanceType<typeof ApprovalRemarkPopoverPanel> | null>(null);
const minerFeeAnchoredRef = ref<{ close: () => void } | null>(null);

const pageSpecs = reactive<Record<ConfirmPage, MotionLayoutDeformPageSpec>>({
  summary: { shellHeight: 360 },
  detail: { shellHeight: 360 },
  reasons: { shellHeight: 360 },
});

const {
  activePage,
  shellHeight,
  contentExiting,
  contentEntering,
  contentDirection,
  switchTo,
} = useMotionLayoutDeformPageSwitch<ConfirmPage>(pageSpecs, 'summary');

const pageStackDirection = ref<'forward' | 'backward' | 'none'>('none');
const detailDisplayRows = ref<SigningBatchRowModel[]>([]);
const reasonsDisplayRows = ref<SigningBatchRowModel[]>([]);
const reasonsFilter = ref<BatchIneligibleReasonFilter>('all');
const footerMotionKey = computed(() => activePage.value);
const isSummaryPage = computed(() => activePage.value === 'summary');
const isDetailPage = computed(() => activePage.value === 'detail');
const isReasonsPage = computed(() => activePage.value === 'reasons');
const deformUsesPixelHeight = computed(
  () => contentExiting.value || contentEntering.value,
);

const ineligiblePaginatorItems = computed(() => {
  const sorted = sortIneligibleByReasonOrder(props.eligibility.ineligible);
  if (reasonsFilter.value === 'all') {
    return sorted.map((item) => item.row);
  }
  return sorted
    .filter((item) => item.reason === reasonsFilter.value)
    .map((item) => item.row);
});

function defaultPaginatorPageSize(): number {
  const parsed = Number.parseInt(DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS[0] ?? '20', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}

watch(reasonsFilter, () => {
  reasonsDisplayRows.value = ineligiblePaginatorItems.value.slice(0, defaultPaginatorPageSize());
});

const hasSignable = computed(() => props.eligibility.signable.length > 0);
const showRemarkSection = computed(
  () => hasSignable.value && props.minerFeeProfile != null,
);

const remarkModel = computed({
  get: () => props.remark,
  set: (value: string) => emit('update:remark', value.slice(0, REMARK_POPOVER_MAX_LENGTH)),
});

const showToolbarConfirm = computed(() => true);
const quotaNoticeText = computed(() =>
  ui('Team withdrawal quota remaining: ${amount}. Upgrade to increase quota or enjoy unlimited withdrawal.')
    .replace('${amount}', formatGroupedNumber(MOCK_WITHDRAWAL_QUOTA_USD)),
);
const breakdownSummary = computed(() => {
  if (hasSignable.value) {
    return props.summary;
  }
  return buildBatchSummary(props.eligibility.ineligible.map((item) => item.row));
});
const summaryHeadlineParts = computed(() => {
  if (!hasSignable.value) {
    return { primary: '0', fiat: null as string | null };
  }
  return splitDetailAmountHeadline(
    `${props.summary.totalCrypto} ≈ ${props.summary.totalFiat}`,
  );
});
const businessTypeLine = computed(() =>
  formatBreakdownLine(
    breakdownSummary.value.businessTypes.map((item) => ({ ...item, label: ui(item.label) })),
  ),
);
const payoutWalletLine = computed(() => formatBreakdownLine(breakdownSummary.value.wallets));
const minerFeeSectionTitle = computed(() => {
  if (!props.minerFeeProfile) {
    return ui('Gas fee');
  }
  return ui(resolveMinerFeePopoverTitleKey(props.minerFeeProfile));
});
const subPageTitle = computed(() => {
  if (isDetailPage.value) {
    return ui('Signable transaction details');
  }
  if (isReasonsPage.value) {
    return ui('Ineligible transaction reasons');
  }
  return '';
});

const showSystemBarClose = computed(() => isSummaryPage.value);
const popupContentInsetPreset = computed<PopupSlotContentInsetPreset>(() =>
  isSummaryPage.value ? 'md' : 'xs',
);

function readPanelConfirmDisabled(
  disabled: boolean | { value: boolean } | undefined,
): boolean {
  if (typeof disabled === 'boolean') {
    return disabled;
  }
  return disabled?.value ?? true;
}

const toolbarConfirmDisabled = computed(() => {
  if (!hasSignable.value) {
    return true;
  }

  if (!props.minerFeeProfile) {
    return false;
  }

  const panel = minerFeePanelRef.value;
  if (!panel) {
    return false;
  }

  return readPanelConfirmDisabled(panel.confirmDisabled);
});

function measureSummaryShellHeight() {
  const measured = summaryContentRef.value?.scrollHeight ?? 0;
  return measured > 0 ? measured : 0;
}

function measureSubPageShellHeight() {
  return slotChromeRef.value?.readScrollViewportHeight() ?? 0;
}

async function syncShellHeightForPage(page: ConfirmPage) {
  await nextTick();
  if (page === 'summary') {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    const summaryH = measureSummaryShellHeight();
    if (summaryH > 0) {
      pageSpecs.summary.shellHeight = summaryH;
    }
    return;
  }

  const viewportH = measureSubPageShellHeight();
  if (viewportH > 0) {
    pageSpecs.detail.shellHeight = viewportH;
    pageSpecs.reasons.shellHeight = viewportH;
    shellHeight.value = viewportH;
  }
}

function resetToSummary() {
  activePage.value = 'summary';
  contentExiting.value = false;
  contentEntering.value = false;
  contentDirection.value = null;
  pageStackDirection.value = 'none';
  reasonsFilter.value = 'all';
}

async function bootstrapSummaryShell() {
  resetToSummary();
  await syncShellHeightForPage('summary');
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void bootstrapSummaryShell();
    }
  },
);

watch(
  () => activePage.value,
  async (page, previousPage) => {
    if (previousPage != null) {
      if (previousPage === 'summary' && page !== 'summary') {
        pageStackDirection.value = 'forward';
      } else if (previousPage !== 'summary' && page === 'summary') {
        pageStackDirection.value = 'backward';
      } else {
        pageStackDirection.value = 'none';
      }
    }

    await nextTick();
    await nextTick();
    slotChromeRef.value?.scrollToTop?.();
    await syncShellHeightForPage(page);
  },
);

watch(
  () => [props.open, showRemarkSection.value, props.eligibility.signable.length] as const,
  ([open]) => {
    if (open && isSummaryPage.value) {
      void syncShellHeightForPage('summary');
    }
  },
);

onMounted(() => {
  if (props.open) {
    void bootstrapSummaryShell();
  }
});

function onClose() {
  popupOpen.value = false;
}

async function goToDetail() {
  const summaryH = measureSummaryShellHeight();
  if (summaryH > 0) {
    pageSpecs.summary.shellHeight = summaryH;
  }
  const viewportH = measureSubPageShellHeight();
  if (viewportH > 0) {
    pageSpecs.detail.shellHeight = viewportH;
    pageSpecs.reasons.shellHeight = viewportH;
  }
  switchTo('detail');
}

async function goToReasons() {
  const summaryH = measureSummaryShellHeight();
  if (summaryH > 0) {
    pageSpecs.summary.shellHeight = summaryH;
  }
  const viewportH = measureSubPageShellHeight();
  if (viewportH > 0) {
    pageSpecs.detail.shellHeight = viewportH;
    pageSpecs.reasons.shellHeight = viewportH;
  }
  switchTo('reasons');
}

async function goBack() {
  await syncShellHeightForPage('summary');
  switchTo('summary');
}

function onSubPageBack() {
  void goBack();
}

function onMinerFeePopoverTopToolClose() {
  minerFeeAnchoredRef.value?.close();
}

function onMinerFeePanelConfirm(selection: MinerFeeSelection | null) {
  if (!selection) {
    return;
  }
  minerFeeAnchoredRef.value?.close();
  emit('confirm', selection);
}

function onToolbarConfirm() {
  emit('confirm', null);
}

useBatchSignConfirmEscape({
  open: toRef(props, 'open'),
  activePage: () => activePage.value,
  onBack: goBack,
  onClose,
});
</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="popupOpen"
    uses="custom"
    :box-width="BATCH_SIGN_CONFIRM_POPUP_WIDTH"
    :box-height="BATCH_SIGN_CONFIRM_POPUP_HEIGHT"
    @close="onPopupClosed"
  >
    <SigningBatchPopupSlotChrome
      ref="slotChromeRef"
      :show-system-bar-close="showSystemBarClose"
      :content-fill="!isSummaryPage"
      :content-inset-preset="popupContentInsetPreset"
      :footer-motion-key="footerMotionKey"
      :page-stack-direction="pageStackDirection"
      :show-toolbar="isSummaryPage"
      :show-toolbar-cancel="false"
      :show-toolbar-confirm="showToolbarConfirm"
      :toolbar-confirm-disabled="toolbarConfirmDisabled"
      :toolbar-confirm-label="ui('Confirm')"
      :toolbar-divider-pinned="isSummaryPage"
      @close="onClose"
      @toolbar-confirm="onToolbarConfirm"
    >
      <template v-if="minerFeeProfile" #toolbar-confirm>
        <EgAnchoredTooltip
          ref="minerFeeAnchoredRef"
          placement="top"
          align="center"
          trigger="click"
          :wrap-tooltip="false"
          boundary-selector=".eds-popup"
          token-scope-class="desktopTokens"
        >
          <EgButton
            tone="decor"
            variant="solid"
            size="md"
            :disabled="toolbarConfirmDisabled"
          >
            {{ ui('Confirm') }}
          </EgButton>
          <template #content>
            <EgPopover
              placement="top"
              align="center"
              top-tool
              :top-tool-title="minerFeeSectionTitle"
              top-tool-closable
              width-mode="fixed"
              :width="POPOVER_PRESET_WIDTH_BASE"
              @top-tool-close="onMinerFeePopoverTopToolClose"
            >
              <ApprovalRemarkPopoverPanel
                ref="minerFeePanelRef"
                :selected-count="eligibility.signable.length"
                :remark="remark"
                :miner-fee-profile="minerFeeProfile"
                :reset-remark-on-mount="false"
                @update:remark="emit('update:remark', $event)"
                @confirm="onMinerFeePanelConfirm"
              />
            </EgPopover>
          </template>
        </EgAnchoredTooltip>
      </template>
      <div
        :class="[
          styles.batchPopupContent,
          !isSummaryPage && styles.batchPopupContentFill,
        ]"
      >
        <div
          class="motion-layout-deform"
          :class="[
            styles.batchPopupContentDeform,
            isSummaryPage
              ? styles.batchPopupContentDeformSummary
              : styles.batchPopupContentDeformFill,
          ]"
          :style="deformUsesPixelHeight ? { height: `${shellHeight}px` } : undefined"
          :data-batch-popup-page="footerMotionKey"
        >
          <div
            :class="[
              MOTION_LAYOUT_DEFORM_CONTENT,
              styles.batchPopupDeformContent,
              contentDirection,
              contentExiting && MOTION_LAYOUT_DEFORM_CONTENT_EXITING,
              contentEntering && MOTION_LAYOUT_DEFORM_CONTENT_ENTERING,
            ]"
          >
            <div
              v-if="isSummaryPage"
              ref="summaryContentRef"
              :class="styles.batchPopupPageSummary"
            >
              <div :class="styles.batchSummaryStack">
                <section :class="styles.detailHeadline">
                  <div :class="styles.detailHeadlineInner">
                    <div :class="styles.detailHeadlineTop">
                      <div :class="styles.detailHeadlineTitleGroup">
                        <span :class="styles.detailHeadlineEyebrow">{{ ui('Signing total amount') }}</span>
                        <h2 :class="styles.detailHeadlineText">
                          {{ summaryHeadlineParts.primary }}
                          <span
                            v-if="summaryHeadlineParts.fiat"
                            :class="detailChromeStyles.headlineFiat"
                          >{{ summaryHeadlineParts.fiat }}</span>
                        </h2>
                      </div>
                      <EgStreamer
                        :class="styles.detailHeadlineStreamer"
                        visual="moderate"
                        :text="quotaNoticeText"
                        show-button
                        :button-label="ui('Increase quota')"
                        button-tone="decor"
                        button-size="sm"
                      />
                    </div>

                    <div :class="styles.detailHeadlineMenu">
                      <div :class="styles.detailHeadlineBid" aria-hidden="true">
                        <span :class="styles.detailHeadlineBidBar" />
                      </div>
                      <div :class="styles.detailHeadlineMenuBody">
                        <div :class="styles.detailHeadlineDataBox">
                          <div :class="styles.detailHeadlineList">
                            <div :class="styles.detailHeadlineRow">
                              <span :class="styles.detailHeadlineRowLabel">
                                {{ ui('Type of Business') }}:
                              </span>
                              <span :class="styles.detailHeadlineRowValue">{{ businessTypeLine }}</span>
                            </div>
                            <div :class="styles.detailHeadlineRow">
                              <span :class="styles.detailHeadlineRowLabel">
                                {{ ui('Outbound wallets') }}:
                              </span>
                              <span :class="styles.detailHeadlineRowValue">{{ payoutWalletLine }}</span>
                            </div>
                            <div :class="styles.detailHeadlineRow">
                              <span :class="styles.detailHeadlineRowLabel">
                                {{ ui('Signable transactions') }}:
                              </span>
                              <span :class="styles.detailHeadlineRowValue">
                                {{ formatGroupedNumber(eligibility.signable.length) }}{{ ui('Signing transaction count unit') }}
                              </span>
                              <button
                                v-if="hasSignable"
                                type="button"
                                :class="styles.detailHeadlineRowLink"
                                @click="goToDetail"
                              >
                                {{ ui('View details') }}
                              </button>
                            </div>
                            <div
                              v-if="eligibility.ineligible.length > 0"
                              :class="styles.detailHeadlineRow"
                            >
                              <span :class="styles.detailHeadlineRowLabel">
                                {{ ui('Ineligible transactions') }}:
                              </span>
                              <span
                                :class="[
                                  styles.detailHeadlineRowValue,
                                  styles.detailHeadlineRowValueDanger,
                                ]"
                              >
                                {{ formatGroupedNumber(eligibility.ineligible.length) }}{{ ui('Signing transaction count unit') }}
                              </span>
                              <button
                                type="button"
                                :class="styles.detailHeadlineRowLink"
                                @click="goToReasons"
                              >
                                {{ ui('View reasons') }}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div
                  v-if="showRemarkSection"
                  :class="styles.batchPopupSectionDivider"
                  role="separator"
                  aria-orientation="horizontal"
                />
              </div>

              <section v-if="showRemarkSection" :class="styles.minerFeeSection">
                <h3 :class="styles.minerFeeSectionTitle">
                  {{ ui('Remark') }}
                </h3>
                <div :class="styles.batchRemarkField">
                  <EgComboTextareaItem
                    v-model="remarkModel"
                    feedback
                    :label="ui('Remark')"
                    :placeholder="ui('Please enter')"
                  >
                    <EgTextarea
                      v-model="remarkModel"
                      :placeholder="ui('Please enter')"
                      width-mode="full"
                      :paste-label="ui('Paste')"
                      :clear-label="ui('Clear')"
                    />
                    <template #feedback>
                      <EgFormSubmission
                        type="notes"
                        :text="ui('Optional, Max. 256 characters')"
                        :show-link="false"
                      />
                    </template>
                  </EgComboTextareaItem>
                </div>
              </section>
            </div>

            <SigningBatchSignSubPageShell
              v-else-if="isDetailPage"
              enable-amount-sort
              :class="styles.batchPopupPageFill"
              :title="subPageTitle"
              @back="onSubPageBack"
            >
              <SigningBatchSignDetailPanel :rows="detailDisplayRows" />
            </SigningBatchSignSubPageShell>

            <SigningBatchSignSubPageShell
              v-else-if="isReasonsPage"
              enable-amount-sort
              :class="styles.batchPopupPageFill"
              :title="subPageTitle"
              @back="onSubPageBack"
            >
              <template #topActions>
                <SigningBatchIneligibleReasonFilterDecor />
              </template>
              <SigningBatchSignReasonsPanel
                :key="`reasons-panel-${reasonsFilter}`"
                v-model:filter="reasonsFilter"
                :eligibility="eligibility"
                :rows="reasonsDisplayRows"
              />
            </SigningBatchSignSubPageShell>
          </div>
        </div>
      </div>

      <template v-if="isDetailPage" #footer>
        <SigningBatchDataListPaginerBar
          :items="eligibility.signable"
          @paginated-change="detailDisplayRows = $event"
        />
      </template>

      <template v-else-if="isReasonsPage" #footer>
        <SigningBatchDataListPaginerBar
          :key="`reasons-${reasonsFilter}`"
          :items="ineligiblePaginatorItems"
          @paginated-change="reasonsDisplayRows = $event"
        />
      </template>
    </SigningBatchPopupSlotChrome>
  </EgPopup>
</template>
