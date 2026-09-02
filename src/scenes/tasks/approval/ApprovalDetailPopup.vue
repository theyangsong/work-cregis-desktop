<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { EgButton, EgDetail, EgPopup, type TagStatus } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  formatGroupedAmountText,
  formatGroupedThresholdString,
} from '@/utils/formatGroupedDisplay';
import { splitDetailAmountHeadline } from '../shared/splitDetailAmountHeadline';
import {
  applyDetailAddressExpand,
  isDetailAddressExpandKey,
} from '../shared/detailAddressExpand';
import { findDetailItemByKey } from '../shared/findDetailItemByKey';
import { buildDetailApprovalProgressSteps } from '../shared/buildDetailApprovalProgressSteps';
import DetailApprovalProgressAppend from '../shared/DetailApprovalProgressAppend.vue';
import { resolveDetailHeadlineStatus } from '../shared/resolveDetailHeadlineStatus';
import { usePopupShellLifecycle } from '../shared/usePopupShellLifecycle';
import { useDetailToolbarPageMotion } from '../shared/useDetailToolbarPageMotion';
import { buildApprovalDetailSections } from './buildApprovalDetailSections';
import { parseRowIndexFromApprovalId } from './approvalStore';
import type { ApprovalDetail } from './types';
import DetailHeadlineGroupPortal from '../shared/DetailHeadlineGroupPortal.vue';
import detailChromeStyles from '../shared/detailPopupChrome.module.css';
import DetailToolbarSlot from '../shared/DetailToolbarSlot.vue';
import DetailToolbarRemarkTrigger from '../shared/DetailToolbarRemarkTrigger.vue';
import ExpiryCountdown from '../shared/ExpiryCountdown.vue';
import { useDetailAmlSearchFlow } from '../shared/useDetailAmlSearchFlow';
import { applyDetailAmlSearchSectionOverlay } from '../shared/applyDetailAmlSearchSectionOverlay';
import DetailAmlSearchToastHost from '../shared/DetailAmlSearchToastHost.vue';
import { sentRequestDetailShowsWithdrawToolbar } from '../tasksDataListPageData';

const props = withDefaults(
  defineProps<{
  open: boolean;
  shellSuspended?: boolean;
  detail: ApprovalDetail | null;
  currentIndex: number;
  totalCount: number;
  prevDisabled: boolean;
  nextDisabled: boolean;
  readOnly?: boolean;
  listStatusLabel?: string;
  listStatusKind?: TagStatus;
  recordMenuItem?: string;
  showWithdrawAction?: boolean;
  onRemarkBeforeOpen?: () => void | Promise<void>;
  }>(),
  {
    shellSuspended: false,
    readOnly: false,
    showWithdrawAction: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  'popup-closed': [];
  'shell-opened': [];
  prev: [];
  next: [];
  passConfirm: [];
  rejectConfirm: [];
  withdrawRequest: [];
  'view-more': [side: 'sender' | 'receiver'];
}>();

const { ui, locale } = useAppI18n();

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  suspended: toRef(props, 'shellSuspended'),
  onShellOpened: () => emit('shell-opened'),
  onClosed: () => {
    emit('update:open', false);
    emit('popup-closed');
  },
});

const detailId = computed(() => props.detail?.id);
const { detailToolbarPageKey } = useDetailToolbarPageMotion({
  detailId,
  currentIndex: computed(() => props.currentIndex),
});

const headline = computed(() =>
  formatGroupedAmountText(props.detail?.amountHeadline ?? ''),
);
const headlineParts = computed(() => splitDetailAmountHeadline(headline.value));
const signingThresholdDisplay = computed(() =>
  formatGroupedThresholdString(props.detail?.signingThreshold ?? ''),
);

const detailHostRef = ref<HTMLElement | null>(null);
const expandedAddressKeys = ref(new Set<string>());

const {
  amlSearchActiveItemKey,
  amlSearchResultsByKey,
  amlToastText,
  amlToastKeepMounted,
  amlToastMotionActive,
  onItemValueAmlSearchClick,
} = useDetailAmlSearchFlow({
  detailId: computed(() => props.detail?.id),
  ui,
});

watch(
  () => props.detail?.id,
  () => {
    expandedAddressKeys.value = new Set();
  },
);

const sections = computed(() => {
  void locale.value;
  const base = props.detail
    ? buildApprovalDetailSections(props.detail, ui, locale.value)
    : [];
  const expanded = applyDetailAddressExpand(base, expandedAddressKeys.value);
  return applyDetailAmlSearchSectionOverlay(expanded, {
    resultsByKey: amlSearchResultsByKey.value,
    translate: ui,
  });
});
const progressSteps = computed(() => {
  if (!props.detail) return [];

  const thresholdSubtitle = props.detail.signingThreshold
    ? `${ui('Signing threshold')}: ${signingThresholdDisplay.value}`
    : undefined;

  return buildDetailApprovalProgressSteps(props.detail, {
    thresholdSubtitle,
    viewMode: props.readOnly ? 'record' : 'workflow',
    listStatusLabel: props.readOnly ? props.listStatusLabel : undefined,
    applyFirstApprovalNodePendingDemo: !props.readOnly,
  });
});

const headlineStatus = computed(() => {
  if (!progressSteps.value.length) return null;
  const listStatus =
    props.listStatusLabel && props.listStatusKind
      ? { label: props.listStatusLabel, status: props.listStatusKind }
      : undefined;
  return resolveDetailHeadlineStatus(progressSteps.value, ui, listStatus);
});
const showStatusTag = computed(() => headlineStatus.value != null);
const statusTag = computed(() => headlineStatus.value?.label ?? '');
const statusTagStatus = computed(() => headlineStatus.value?.status ?? 'ready');

const resolvedShowWithdrawAction = computed(() => {
  if (!props.readOnly) return props.showWithdrawAction;
  if (props.showWithdrawAction) return true;

  const rowIndex = props.detail?.id
    ? parseRowIndexFromApprovalId(props.detail.id)
    : undefined;

  return sentRequestDetailShowsWithdrawToolbar({
    menuItem: props.recordMenuItem,
    listStatusLabel: props.listStatusLabel,
    rowIndex,
    locale: locale.value,
  });
});

const showDetailToolbar = computed(
  () => !props.readOnly || resolvedShowWithdrawAction.value,
);

function onItemValueLinkClick(key: string) {
  const item = findDetailItemByKey(sections.value, key);
  if (item?.addressLayout === 'multi-orders' && isDetailAddressExpandKey(key)) {
    emit('view-more', key);
    return;
  }
  if (isDetailAddressExpandKey(key)) {
    expandedAddressKeys.value = new Set([...expandedAddressKeys.value, key]);
  }
}

async function onRejectClick() {
  try {
    await props.onRemarkBeforeOpen?.();
    emit('rejectConfirm');
  } catch {
    // prepareDetailRemarkOpen rejected (processed / disabled).
  }
}

async function onPassClick() {
  try {
    await props.onRemarkBeforeOpen?.();
    emit('passConfirm');
  } catch {
    // prepareDetailRemarkOpen rejected (processed / disabled).
  }
}

function onWithdrawClick() {
  emit('withdrawRequest');
}

function onDetailClose() {
  popupOpen.value = false;
}
</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="popupOpen"
    uses="detail"
    @close="onPopupClosed"
  >
    <div ref="detailHostRef" :class="detailChromeStyles.detailHost">
    <EgDetail
      v-if="detail"
      :toolbar-page-key="detailToolbarPageKey"
      :headline="headline"
      :show-eyebrow="false"
      :show-status-tag="showStatusTag"
      :status-tag="statusTag"
      status-tag-size="lg"
      :status-tag-status="statusTagStatus"
      :show-tabs="false"
      :sections="sections"
      :show-toolbar="showDetailToolbar"
      :show-toolbar-nav="false"
      toolbar-divider-pinned
      :value-copy-label="ui('Copy')"
      :value-address-book-label="ui('Add to address book')"
      :value-aml-search-label="ui('AML Search')"
      :value-browser-label="ui('Block explorer')"
      :aml-search-active-item-key="amlSearchActiveItemKey"
      toolbar-tone="decor"
      @close="onDetailClose"
      @item-value-link-click="onItemValueLinkClick"
      @item-value-aml-search-click="onItemValueAmlSearchClick"
    >
      <template v-if="showDetailToolbar" #toolbar>
        <DetailToolbarSlot :show-toolbar-nav="false" toolbar-divider-pinned>
          <template v-if="resolvedShowWithdrawAction || !readOnly" #leading>
            <DetailToolbarRemarkTrigger :page-key="detail?.id" />
          </template>
          <template #actions>
            <EgButton
              v-if="resolvedShowWithdrawAction"
              tone="danger"
              variant="solid"
              size="md"
              @click="onWithdrawClick"
            >
              {{ ui('Withdraw Application') }}
            </EgButton>
            <template v-else-if="!readOnly">
              <EgButton
                tone="danger"
                variant="text"
                size="md"
                @click="onRejectClick"
              >
                {{ ui('Reject') }}
              </EgButton>

              <EgButton
                tone="decor"
                variant="solid"
                size="md"
                @click="onPassClick"
              >
                {{ ui('Pass') }}
              </EgButton>
            </template>
          </template>
        </DetailToolbarSlot>
      </template>

      <template v-if="detail?.expiryCountdownMinutes" #item-value-expiry>
        <ExpiryCountdown
          :minutes="detail.expiryCountdownMinutes"
          :seconds="detail.expiryCountdownSeconds ?? '00'"
        />
      </template>

      <template #headline-text>
        {{ headlineParts.primary }}<span
          v-if="headlineParts.fiat"
          :class="detailChromeStyles.headlineFiat"
        >{{ headlineParts.fiat }}</span>
      </template>

      <template #append>
        <DetailApprovalProgressAppend :steps="progressSteps" />
      </template>
    </EgDetail>
    <DetailHeadlineGroupPortal
      v-if="detail"
      :host-ref="detailHostRef"
      :business-type-key="detail.businessType"
      :page-key="detail.id"
    />
    <DetailAmlSearchToastHost
      :keep-mounted="amlToastKeepMounted"
      :motion-active="amlToastMotionActive"
      :text="amlToastText"
    />
    </div>
  </EgPopup>
</template>
