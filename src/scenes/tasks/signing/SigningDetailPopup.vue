<script setup lang="ts">
import { computed, toRef } from 'vue';
import { EgAvatar, EgButton, EgDetail, EgPopup } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { usePopupShellLifecycle } from '../shared/usePopupShellLifecycle';
import { buildSigningDetailSections } from './buildSigningDetailSections';
import type { SigningDetail } from './types';
import styles from './SigningDetailPopup.module.css';
import ApprovalRemarkPopover from '../approval/ApprovalRemarkPopover.vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    shellSuspended?: boolean;
    detail: SigningDetail | null;
    currentIndex: number;
    totalCount: number;
    prevDisabled: boolean;
    nextDisabled: boolean;
    remark: string;
    onRemarkBeforeOpen?: () => void | Promise<void>;
  }>(),
  {
    shellSuspended: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:remark': [value: string];
  'popup-closed': [];
  'shell-opened': [];
  prev: [];
  next: [];
  passConfirm: [];
  rejectConfirm: [];
  'view-more-sender': [];
  'view-more-receiver': [];
}>();

const { ui } = useAppI18n();

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  suspended: toRef(props, 'shellSuspended'),
  onShellOpened: () => emit('shell-opened'),
  onClosed: () => {
    emit('update:open', false);
    emit('popup-closed');
  },
});

const headline = computed(() => props.detail?.amountHeadline ?? '');
const eyebrow = computed(() => ui(props.detail?.amountColumnLabel ?? 'Amount'));
const statusTag = computed(() => ui('Pending Signature'));
const sections = computed(() =>
  props.detail ? buildSigningDetailSections(props.detail, ui) : [],
);
const isMultiSign = computed(() => props.detail?.signingMode === 'multi');

function onItemValueLinkClick(key: string) {
  if (key === 'sender') {
    emit('view-more-sender');
    return;
  }
  if (key === 'receiver') {
    emit('view-more-receiver');
  }
}

function onRemarkDismiss() {
  emit('update:remark', '');
}

function onPassClick() {
  if (isMultiSign.value) {
    emit('passConfirm');
  }
}

function onDetailClose() {
  popupOpen.value = false;
  emit('update:open', false);
}
</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="popupOpen"
    uses="detail"
    @close="onPopupClosed"
  >
    <EgDetail
      v-if="detail"
      :toolbar-page-key="detail.id"
      :eyebrow="eyebrow"
      :headline="headline"
      :status-tag="statusTag"
      status-tag-size="lg"
      status-tag-status="ready"
      :show-tabs="false"
      :sections="sections"
      show-toolbar
      show-toolbar-nav
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
      <template #toolbar-actions>
        <ApprovalRemarkPopover
          boundary-selector=".eds-popup"
          :title="ui('Signature Reject')"
          :remark="remark"
          :on-before-open="onRemarkBeforeOpen"
          @update:remark="emit('update:remark', $event)"
          @confirm="emit('rejectConfirm')"
          @dismiss="onRemarkDismiss"
        >
          <template #trigger="{ onClick }">
            <EgButton tone="danger" variant="text" size="md" @click.stop="onClick">
              {{ ui('Reject') }}
            </EgButton>
          </template>
        </ApprovalRemarkPopover>

        <ApprovalRemarkPopover
          v-if="!isMultiSign"
          boundary-selector=".eds-popup"
          :title="ui('Signed')"
          :remark="remark"
          show-miner-fee
          :on-before-open="onRemarkBeforeOpen"
          @update:remark="emit('update:remark', $event)"
          @confirm="emit('passConfirm')"
          @dismiss="onRemarkDismiss"
        >
          <template #trigger="{ onClick }">
            <EgButton tone="decor" variant="solid" size="md" @click.stop="onClick">
              {{ ui('Sign') }}
            </EgButton>
          </template>
        </ApprovalRemarkPopover>

        <EgButton
          v-else
          tone="decor"
          variant="solid"
          size="md"
          @click.stop="onPassClick"
        >
          {{ ui('Sign') }}
        </EgButton>
      </template>

      <template #append>
        <section :class="styles.progress">
          <h3 :class="styles.progressTitle">{{ ui('Approval Progress') }}</h3>

          <div :class="styles.progressBlock">
            <p :class="styles.progressLabel">{{ ui('Initiated') }}</p>
            <p :class="styles.progressValue">{{ detail.initiatorDisplay }}</p>
            <p :class="styles.progressSecondary">{{ detail.initiatorNote }}</p>
            <p :class="styles.progressSecondary">{{ detail.initiatorAtDisplay }}</p>
          </div>

          <div
            v-for="node in detail.approvalNodes"
            :key="node.title"
            :class="styles.progressBlock"
          >
            <p :class="styles.progressLabel">
              {{ node.title }} · {{ ui(node.statusLabel) }}
            </p>
            <div :class="styles.memberRow">
              <div
                v-for="member in node.members"
                :key="`${node.title}-${member.emailMasked}`"
                :class="styles.member"
              >
                <EgAvatar size="sm" :name="member.avatarName" />
                <span :class="styles.memberText">
                  {{ member.name }} ({{ member.emailMasked }})
                </span>
              </div>
            </div>
          </div>

          <div :class="styles.progressBlock">
            <p :class="styles.progressLabel">
              {{ ui('Signature step') }} · {{ ui('Pending Signature') }}
            </p>
            <p v-if="detail.signingThreshold" :class="styles.progressSecondary">
              {{ ui('Signing threshold') }}: {{ detail.signingThreshold }}
            </p>
            <div :class="styles.memberRow">
              <div
                v-for="signer in detail.signers"
                :key="signer.emailMasked"
                :class="styles.member"
              >
                <EgAvatar size="sm" :name="signer.avatarName" />
                <span :class="styles.memberText">
                  {{ signer.name }} ({{ signer.emailMasked }})
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </EgDetail>
  </EgPopup>
</template>
