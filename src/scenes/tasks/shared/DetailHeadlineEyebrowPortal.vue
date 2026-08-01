<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import DetailHeadlineEyebrow from './DetailHeadlineEyebrow.vue';

const props = defineProps<{
  hostRef: HTMLElement | null | undefined;
  businessTypeKey: string;
  pageKey?: string;
}>();

const anchor = ref<HTMLElement | null>(null);

function unmountAnchor() {
  anchor.value?.remove();
  anchor.value = null;
}

function mountAnchor() {
  unmountAnchor();
  const host = props.hostRef;
  if (!host) return;

  const headline = host.querySelector('header[class*="headline"]');
  const headlineRow = headline?.querySelector('[class*="headlineRow"]');
  if (!headline || !headlineRow) return;

  const el = document.createElement('div');
  el.setAttribute('data-detail-headline-eyebrow', '');
  headline.insertBefore(el, headlineRow);
  anchor.value = el;
}

watch(
  () => [props.hostRef, props.pageKey, props.businessTypeKey] as const,
  () => {
    void nextTick(mountAnchor);
  },
);

onMounted(() => {
  void nextTick(mountAnchor);
});

onBeforeUnmount(unmountAnchor);
</script>

<template>
  <Teleport v-if="anchor" :to="anchor">
    <DetailHeadlineEyebrow :business-type-key="businessTypeKey" />
  </Teleport>
</template>
