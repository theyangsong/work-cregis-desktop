<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { EgStreamer } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { buildWithdrawalQuotaNoticeText } from '../signing/buildWithdrawalQuotaNoticeText';
import DetailHeadlineEyebrow from './DetailHeadlineEyebrow.vue';
import styles from './detailPopupChrome.module.css';

const props = withDefaults(
  defineProps<{
    hostRef: HTMLElement | null | undefined;
    businessTypeKey: string;
    pageKey?: string;
    showQuotaStreamer?: boolean;
  }>(),
  {
    showQuotaStreamer: false,
  },
);

const { ui } = useAppI18n();
const eyebrowAnchor = ref<HTMLElement | null>(null);
const streamerAnchor = ref<HTMLElement | null>(null);
const groupAnchor = ref<HTMLElement | null>(null);

const quotaNoticeText = computed(() => buildWithdrawalQuotaNoticeText(ui));

function unmountStructure() {
  const group = groupAnchor.value;
  const headlineRow = group?.querySelector('[class*="headlineRow"]');
  const headline = group?.closest('header[class*="headline"]');

  if (group instanceof HTMLElement && headline instanceof HTMLElement && headlineRow instanceof HTMLElement) {
    headline.insertBefore(headlineRow, group);
    group.remove();
  }

  eyebrowAnchor.value = null;
  streamerAnchor.value = null;
  groupAnchor.value = null;
}

function mountStructure() {
  unmountStructure();

  const host = props.hostRef;
  if (!host) return;

  const headline = host.querySelector('header[class*="headline"]');
  const headlineRow = headline?.querySelector('[class*="headlineRow"]');
  if (!(headline instanceof HTMLElement) || !(headlineRow instanceof HTMLElement)) return;

  const group = document.createElement('div');
  group.setAttribute('data-detail-headline-group', '');
  group.className = styles.detailHeadlineGroup;

  const titleGroup = document.createElement('div');
  titleGroup.setAttribute('data-detail-headline-title-group', '');
  titleGroup.className = styles.detailHeadlineTitleGroup;

  const eyebrowEl = document.createElement('div');
  eyebrowEl.setAttribute('data-detail-headline-eyebrow', '');

  const streamerEl = document.createElement('div');
  streamerEl.setAttribute('data-detail-headline-quota-streamer', '');

  headline.insertBefore(group, headlineRow);
  group.appendChild(titleGroup);
  titleGroup.appendChild(eyebrowEl);
  titleGroup.appendChild(headlineRow);
  if (props.showQuotaStreamer) {
    group.appendChild(streamerEl);
    streamerAnchor.value = streamerEl;
  }

  groupAnchor.value = group;
  eyebrowAnchor.value = eyebrowEl;
}

watch(
  () => [props.hostRef, props.pageKey, props.businessTypeKey, props.showQuotaStreamer] as const,
  () => {
    void nextTick(mountStructure);
  },
);

onMounted(() => {
  void nextTick(mountStructure);
});

onBeforeUnmount(unmountStructure);
</script>

<template>
  <Teleport v-if="eyebrowAnchor" :to="eyebrowAnchor">
    <DetailHeadlineEyebrow :business-type-key="businessTypeKey" />
  </Teleport>
  <Teleport v-if="streamerAnchor && showQuotaStreamer" :to="streamerAnchor">
    <EgStreamer
      :class="styles.detailHeadlineQuotaStreamer"
      visual="moderate"
      :text="quotaNoticeText"
      show-button
      :button-label="ui('Increase quota')"
      button-tone="decor"
      button-size="sm"
    />
  </Teleport>
</template>
