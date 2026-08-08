<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
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
import SigningFooterLatencyToolbar from './SigningFooterLatencyToolbar.vue';
import { useMultiSignWaitingPopupHost } from './useMultiSignWaitingPopupHost';
import styles from './MultiSignWaitingPanel.module.css';

const props = defineProps<{
  model: MultiSignWaitingPanelModel;
  phase: 'waiting' | 'ready';
}>();

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

const statusTitle = computed(() =>
  props.phase === 'ready' ? ui('Ready to sign') : ui('Waiting'),
);

const statusSubtitle = computed(() => {
  const template = ui('Need {required} members to participate, {joined} joined');
  return template
    .replace('{required}', formatGroupedNumber(props.model.thresholdRequired))
    .replace('{joined}', formatGroupedNumber(props.model.joinedCount));
});

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
              <EgRipplePulse
                :class="styles.statusIconRipple"
                :active="phase === 'ready'"
              />
              <div :class="styles.statusIcon">
                <EgIcon name="eds-tick-fill" size="md" />
              </div>
            </div>
            <div :class="styles.statusCopy">
              <h3 :class="styles.statusTitle">{{ statusTitle }}</h3>
              <p :class="styles.statusSubtitle">{{ statusSubtitle }}</p>
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
                  <span :class="styles.memberName">{{ member.name }}</span>
                  <EgTag
                    v-if="member.isInitiator"
                    size="sm"
                    system-type="stroke-solid"
                  >
                    {{ ui('Initiator') }}
                  </EgTag>
                  <EgTag
                    v-if="member.deviceLabel"
                    size="sm"
                    system-type="stroke-subtle"
                  >
                    {{ member.deviceLabel }}
                  </EgTag>
                </div>
                <span :class="styles.memberEmail">{{ member.emailMasked }}</span>
              </div>

              <EgTag
                v-if="member.joined"
                :class="styles.memberJoined"
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
            :show-actions="phase === 'ready'"
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
