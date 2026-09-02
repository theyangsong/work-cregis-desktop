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
let headlineMainEl: HTMLElement | null = null;

const quotaNoticeText = computed(() => buildWithdrawalQuotaNoticeText(ui));

function unmountStructure() {
  eyebrowAnchor.value?.remove();
  streamerAnchor.value?.remove();
  eyebrowAnchor.value = null;
  streamerAnchor.value = null;
  headlineMainEl?.removeAttribute('data-detail-headline-with-streamer');
  headlineMainEl = null;
}

function mountStructure() {
  unmountStructure();

  const host = props.hostRef;
  if (!host) return;

  const headline = host.querySelector('header[class*="headline"]');
  const headlineMain = headline?.querySelector('[class*="headlineMain"]');
  const headlineRow = headline?.querySelector('[class*="headlineRow"]');
  if (!(headline instanceof HTMLElement) || !(headlineRow instanceof HTMLElement)) return;

  const mountParent =
    headlineMain instanceof HTMLElement ? headlineMain : headline;

  if (headlineMain instanceof HTMLElement) {
    headlineMainEl = headlineMain;
  }

  const eyebrowEl = document.createElement('div');
  eyebrowEl.setAttribute('data-detail-headline-eyebrow', '');
  eyebrowEl.className = styles.detailHeadlineEyebrowHost;
  mountParent.insertBefore(eyebrowEl, headlineRow);
  eyebrowAnchor.value = eyebrowEl;

  if (props.showQuotaStreamer) {
    const streamerEl = document.createElement('div');
    streamerEl.setAttribute('data-detail-headline-quota-streamer', '');
    streamerEl.className = styles.detailHeadlineQuotaStreamerHost;
    mountParent.appendChild(streamerEl);
    streamerAnchor.value = streamerEl;
    headlineMainEl?.setAttribute('data-detail-headline-with-streamer', '');
  }
}

function scheduleMount() {
  void nextTick(() => {
    mountStructure();
    requestAnimationFrame(mountStructure);
  });
}

watch(
  () => [props.hostRef, props.pageKey, props.businessTypeKey, props.showQuotaStreamer] as const,
  scheduleMount,
);

onMounted(scheduleMount);

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
