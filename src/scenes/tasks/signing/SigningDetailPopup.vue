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
import { buildSigningDetailSections } from './buildSigningDetailSections';
import {
  resolveMinerFeeProfileFromDetail,
} from '../shared/minerFeeProfile';
import type { MinerFeeSelection } from '../shared/minerFeeProfile';
import { isMultiSignSigningDetail } from './signingStore';
import type { SigningDetail } from './types';
import DetailHeadlineEyebrowPortal from '../shared/DetailHeadlineEyebrowPortal.vue';
import detailChromeStyles from '../shared/detailPopupChrome.module.css';
import DetailToolbarSlot from '../shared/DetailToolbarSlot.vue';
import ExpiryCountdown from '../shared/ExpiryCountdown.vue';
import { useTasksDetailToolbarGuide } from '../shared/useTasksDetailToolbarGuide';
import ApprovalRemarkPopover from '../approval/ApprovalRemarkPopover.vue';
import remarkTriggerStyles from '../shared/remarkPopoverTrigger.module.css';

const props = withDefaults(
  defineProps<{
    open: boolean;
    shellSuspended?: boolean;
    detail: SigningDetail | null;
    currentIndex: number;
    totalCount: number;
    prevDisabled: boolean;
    nextDisabled: boolean;
    remark?: string;
    readOnly?: boolean;
    listStatusLabel?: string;
    listStatusKind?: TagStatus;
    onRemarkBeforeOpen?: () => void | Promise<void>;
  }>(),
  {
    shellSuspended: false,
    remark: '',
    readOnly: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:remark': [value: string];
  'popup-closed': [];
  'shell-opened': [];
  prev: [];
  next: [];
  passConfirm: [selection: MinerFeeSelection | null];
  rejectConfirm: [];
  'view-more': [side: 'sender' | 'receiver'];
}>();

const { ui, locale } = useAppI18n();
const { shouldShowGuide, markGuideSeen } = useTasksDetailToolbarGuide();

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  suspended: toRef(props, 'shellSuspended'),
  onShellOpened: () => emit('shell-opened'),
  onClosed: () => {
    emit('update:open', false);
    emit('popup-closed');
  },
});

const guideActive = computed(
  () => popupOpen.value && shouldShowGuide.value && Boolean(props.detail),
);

const headline = computed(() =>
  formatGroupedAmountText(props.detail?.amountHeadline ?? ''),
);
const headlineParts = computed(() => splitDetailAmountHeadline(headline.value));
const signingThresholdDisplay = computed(() =>
  formatGroupedThresholdString(props.detail?.signingThreshold ?? ''),
);
const isMultiSign = computed(() => isMultiSignSigningDetail(props.detail));

const detailHostRef = ref<HTMLElement | null>(null);
const expandedAddressKeys = ref(new Set<string>());

watch(
  () => props.detail?.id,
  () => {
    expandedAddressKeys.value = new Set();
  },
);

const sections = computed(() => {
  void locale.value;
  const base = props.detail
    ? buildSigningDetailSections(props.detail, ui, locale.value)
    : [];
  return applyDetailAddressExpand(base, expandedAddressKeys.value);
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
const minerFeeProfile = computed(() =>
  props.detail ? resolveMinerFeeProfileFromDetail(props.detail) : null,
);

async function onMultiSignPassClick() {
  try {
    await props.onRemarkBeforeOpen?.();
    emit('update:remark', '');
    emit('passConfirm', null);
  } catch {
    // prepareDetailRemarkOpen rejected (processed / disabled).
  }
}

async function onMultiSignRejectClick() {
  try {
    await props.onRemarkBeforeOpen?.();
    emit('update:remark', '');
    emit('rejectConfirm');
  } catch {
    // prepareDetailRemarkOpen rejected (processed / disabled).
  }
}

function onRemarkDismiss() {
  emit('update:remark', '');
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
      :toolbar-page-key="detail.id"
      :headline="headline"
      :show-eyebrow="false"
      :show-status-tag="showStatusTag"
      :status-tag="statusTag"
      status-tag-size="lg"
      :status-tag-status="statusTagStatus"
      :show-tabs="false"
      :sections="sections"
      show-toolbar
      show-toolbar-nav
      toolbar-divider-pinned
      :toolbar-current="currentIndex"
      :toolbar-total="totalCount"
      :toolbar-prev-disabled="prevDisabled"
      :toolbar-next-disabled="nextDisabled"
      toolbar-tone="decor"
      @close="onDetailClose"
      @toolbar-prev="emit('prev')"
      @toolbar-next="emit('next')"
      @item-value-link-click="onItemValueLinkClick"
    >
      <template #toolbar>
        <DetailToolbarSlot
          :toolbar-current="currentIndex"
          :toolbar-total="totalCount"
          :toolbar-prev-disabled="prevDisabled"
          :toolbar-next-disabled="nextDisabled"
          :guide-active="guideActive"
          @toolbar-prev="emit('prev')"
          @toolbar-next="emit('next')"
          @guide-dismiss="markGuideSeen"
        >
          <template v-if="!readOnly" #actions>
            <EgButton
              v-if="isMultiSign"
              tone="danger"
              variant="text"
              size="md"
              @click="onMultiSignRejectClick"
            >
              {{ ui('Reject') }}
            </EgButton>
            <ApprovalRemarkPopover
              v-else
              boundary-selector=".eds-popup"
              :title="ui('Remark')"
              :remark="remark"
              :on-before-open="onRemarkBeforeOpen"
              @update:remark="emit('update:remark', $event)"
              @confirm="emit('rejectConfirm')"
              @dismiss="onRemarkDismiss"
            >
              <template #trigger="{ active, onClick }">
                <span
                  :class="[
                    remarkTriggerStyles.remarkTrigger,
                    active && remarkTriggerStyles.remarkTriggerRejectPressed,
                  ]"
                >
                  <EgButton
                    tone="danger"
                    variant="text"
                    size="md"
                    :aria-expanded="active"
                    @click.stop="onClick"
                  >
                    {{ ui('Reject') }}
                  </EgButton>
                </span>
              </template>
            </ApprovalRemarkPopover>

            <EgButton
              v-if="isMultiSign"
              tone="decor"
              variant="solid"
              size="md"
              @click="onMultiSignPassClick"
            >
              {{ ui('Sign') }}
            </EgButton>

            <ApprovalRemarkPopover
              v-else
              boundary-selector=".eds-popup"
              :title="ui('Remark')"
              :remark="remark"
              :miner-fee-profile="minerFeeProfile ?? undefined"
              :on-before-open="onRemarkBeforeOpen"
              @update:remark="emit('update:remark', $event)"
              @confirm="emit('passConfirm', $event)"
              @dismiss="onRemarkDismiss"
            >
              <template #trigger="{ active, onClick }">
                <span
                  :class="[
                    remarkTriggerStyles.remarkTrigger,
                    active && remarkTriggerStyles.remarkTriggerPassPressed,
                  ]"
                >
                  <EgButton
                    tone="decor"
                    variant="solid"
                    size="md"
                    :aria-expanded="active"
                    @click.stop="onClick"
                  >
                    {{ ui('Sign') }}
                  </EgButton>
                </span>
              </template>
            </ApprovalRemarkPopover>
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
    <DetailHeadlineEyebrowPortal
      v-if="detail"
      :host-ref="detailHostRef"
      :business-type-key="detail.businessType"
      :page-key="detail.id"
    />
    </div>
  </EgPopup>
</template>
