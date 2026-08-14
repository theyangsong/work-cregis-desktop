<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, withDefaults } from 'vue';
import {
  EgAvatar,
  EgDivider,
  EgIcon,
  EgIconButton,
  EgRipplePulse,
  EgTag,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import './multiSignWaitingPopupHost.css';
import type { MultiSignWaitingPanelModel } from './buildMultiSignWaitingPanelModel';
import type { MultiSignRoomPhase, MultiSignWaitingPerspective } from './types';
import SigningFooterLatencyToolbar from './SigningFooterLatencyToolbar.vue';
import MultiSignWaitingExitConfirmPopover from './MultiSignWaitingExitConfirmPopover.vue';
import { useMultiSignWaitingPopupHost } from './useMultiSignWaitingPopupHost';
import styles from './MultiSignWaitingPanel.module.css';

const props = withDefaults(
  defineProps<{
    model: MultiSignWaitingPanelModel;
    phase: MultiSignRoomPhase;
    perspective?: MultiSignWaitingPerspective;
  }>(),
  {
    perspective: 'signer',
  },
);

const emit = defineEmits<{
  close: [];
}>();

const { ui } = useAppI18n();

const shellRef = ref<HTMLElement | null>(null);
useMultiSignWaitingPopupHost(shellRef);

const SCROLL_EDGE_EPSILON = 2;

const memberListRef = ref<HTMLElement | null>(null);
const scrollOverflows = ref(false);
let scrollResizeObserver: ResizeObserver | undefined;

const statusTitle = computed(() => {
  switch (props.phase) {
    case 'ready':
      return ui('Ready to sign');
    case 'signing':
      return ui('Signing in progress');
    case 'sign-failed':
      return ui('Signing failed');
    default:
      return ui('Waiting');
  }
});

type StatusSubtitlePart =
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: string };

function buildStatusSubtitleParts(
  template: string,
  values: Record<string, string>,
): StatusSubtitlePart[] {
  const parts: StatusSubtitlePart[] = [];
  const placeholderPattern = /\{(required|joined)\}/g;
  let lastIndex = 0;

  for (const match of template.matchAll(placeholderPattern)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ kind: 'text', value: template.slice(lastIndex, index) });
    }

    parts.push({ kind: 'number', value: values[match[1]!] ?? '' });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < template.length) {
    parts.push({ kind: 'text', value: template.slice(lastIndex) });
  }

  return parts;
}

const statusSubtitleParts = computed((): StatusSubtitlePart[] | null => {
  if (props.phase === 'sign-failed') {
    return null;
  }

  const template = ui('Need {required} members to participate, {joined} joined');

  return buildStatusSubtitleParts(template, {
    required: formatGroupedNumber(props.model.thresholdRequired),
    joined: formatGroupedNumber(props.model.joinedCount),
  });
});

const showSignActions = computed(() => props.perspective === 'signer');

const showMpcNetworkGuide = computed(
  () => props.perspective === 'participant' && props.phase === 'sign-failed',
);

const showParticipantStatusRipple = computed(
  () =>
    props.perspective === 'participant'
    && (props.phase === 'ready' || props.phase === 'signing' || props.phase === 'sign-failed'),
);

function updateScrollState() {
  const element = memberListRef.value;

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

function onMemberListScroll() {
  updateScrollState();
}

function observeScrollTargets() {
  scrollResizeObserver?.disconnect();
  scrollResizeObserver = new ResizeObserver(() => {
    updateScrollState();
  });
  if (memberListRef.value) {
    scrollResizeObserver.observe(memberListRef.value);
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

watch([memberListRef, () => props.model.members.length], () => {
  void nextTick(observeScrollTargets);
});
</script>

<template>
  <div
    ref="shellRef"
    class="desktopTokens multi-sign-waiting-shell"
    :class="styles.shell"
  >
    <div :class="styles.root">
      <div :class="styles.systemBarClose">
        <MultiSignWaitingExitConfirmPopover @confirm="emit('close')">
          <template #trigger="{ onClick, active }">
            <span
              :class="[
                styles.systemBarCloseTrigger,
                active && styles.systemBarCloseTriggerActive,
              ]"
            >
              <EgIconButton
                shape="square"
                size="md"
                label="关闭"
                motion="asym"
                :aria-expanded="active"
                @click.stop="onClick"
              >
                <EgIcon name="eds-close-circle-fill" fit />
              </EgIconButton>
            </span>
          </template>
        </MultiSignWaitingExitConfirmPopover>
      </div>

      <div :class="styles.body">
        <aside :class="styles.sidebar">
          <h2 :class="styles.sidebarTitle">{{ ui('Transaction') }}</h2>
          <div :class="styles.sidebarFields">
            <div
              v-for="field in model.sidebarFields"
              :key="field.key"
              :class="styles.sidebarField"
            >
              <p :class="styles.sidebarLabel">{{ ui(field.labelKey) }}</p>
              <p :class="styles.sidebarValue">
                {{ field.value }}
              </p>
            </div>
          </div>
        </aside>

        <EgDivider :class="styles.sidebarDivider" direction="vertical" />

        <section :class="styles.main">
          <div :class="styles.statusBlock">
            <div :class="styles.statusIconShell">
              <template v-if="phase === 'waiting'">
                <EgRipplePulse
                  :class="[styles.statusIconRipple, styles.statusIconRippleWaiting]"
                  active
                />
                <div :class="styles.statusIconWaiting">
                  <EgIcon
                    name="eds-time-wait-fill"
                    size="md"
                  />
                </div>
              </template>
              <template v-else-if="phase === 'ready'">
                <EgRipplePulse
                  v-if="showParticipantStatusRipple"
                  :class="[styles.statusIconRipple, styles.statusIconRippleReady]"
                  active
                />
                <div :class="[styles.statusIcon, styles.statusIconReady]">
                  <EgIcon
                    name="eds-tick-fill"
                    size="md"
                  />
                </div>
              </template>
              <template v-else-if="phase === 'signing' || phase === 'sign-failed'">
                <EgRipplePulse
                  v-if="showParticipantStatusRipple"
                  :class="[
                    styles.statusIconRipple,
                    phase === 'sign-failed'
                      ? styles.statusIconRippleFailed
                      : styles.statusIconRippleReady,
                  ]"
                  active
                />
                <div
                  :class="[
                    styles.statusIcon,
                    phase === 'sign-failed'
                      ? styles.statusIconFailed
                      : styles.statusIconReady,
                  ]"
                >
                  <EgIcon
                    name="eds-signature-pen-mini-fill"
                    size="md"
                  />
                </div>
              </template>
            </div>
            <div :class="styles.statusCopy">
              <h3 :class="styles.statusTitle">{{ statusTitle }}</h3>
              <p :class="styles.statusSubtitle">
                <template v-if="statusSubtitleParts">
                  <template
                    v-for="(part, index) in statusSubtitleParts"
                    :key="index"
                  >
                    <span
                      v-if="part.kind === 'number'"
                      :class="styles.statusSubtitleNumber"
                    >{{ part.value }}</span>
                    <template v-else>{{ part.value }}</template>
                  </template>
                </template>
                <template v-else>
                  {{ ui('MPC network error') }}
                </template>
              </p>
            </div>
            <div :class="styles.statusDividerSlot">
              <EgDivider type="page" />
            </div>
          </div>

          <div :class="styles.thresholdRow">
            <p :class="styles.thresholdLabel">{{ ui('Signing threshold') }}</p>
            <div :class="styles.thresholdValues">
              <span :class="styles.thresholdBox">{{ formatGroupedNumber(model.thresholdRequired) }}</span>
              <span :class="styles.thresholdSlash" aria-hidden="true">/</span>
              <span :class="styles.thresholdBox">{{ formatGroupedNumber(model.thresholdTotal) }}</span>
            </div>
          </div>

          <div
            ref="memberListRef"
            :class="styles.memberList"
            @scroll="onMemberListScroll"
          >
            <div
              v-for="member in model.members"
              :key="member.id"
              :class="styles.memberRow"
            >
              <div :class="styles.avatarWrap">
                <div :class="[styles.avatarTone, member.muted && styles.avatarToneMuted]">
                  <EgAvatar
                    size="lg"
                    :name="member.avatarName"
                    :color-index="member.avatarColorIndex"
                  />
                </div>
                <span
                  :class="[
                    styles.avatarStatus,
                    member.muted && styles.avatarStatusMuted,
                  ]"
                  aria-hidden="true"
                />
              </div>

              <div :class="[styles.memberBody, member.muted && styles.memberBodyMuted]">
                <div :class="styles.memberTitleRow">
                  <EgTag
                    v-if="member.isCurrentUser"
                    size="sm"
                    system-type="stroke-solid"
                  >
                    {{ ui('Me') }}
                  </EgTag>
                  <span :class="styles.memberName">{{ member.name }}</span>
                  <EgTag
                    v-if="member.isInitiator"
                    size="sm"
                    system-type="stroke-solid"
                  >
                    {{ ui('Initiator') }}
                  </EgTag>
                  <EgTag
                    v-if="member.joined && member.deviceLabel"
                    size="sm"
                    system-type="stroke-subtle"
                  >
                    {{ member.deviceLabel }}
                  </EgTag>
                </div>
                <span :class="styles.memberEmail">{{ member.emailMasked }}</span>
              </div>

              <EgTag
                :class="styles.memberStatusTag"
                family="status"
                size="lg"
                status="success"
              >
                {{ ui('Joined') }}
              </EgTag>
            </div>
          </div>

          <SigningFooterLatencyToolbar
            :scroll-overflows="scrollOverflows"
            network-picker
            :show-actions="showSignActions"
            :mpc-network-guide-active="showMpcNetworkGuide"
          >
            <template #actions>
              <slot name="actions" />
            </template>
          </SigningFooterLatencyToolbar>
        </section>
      </div>
    </div>
  </div>
</template>
