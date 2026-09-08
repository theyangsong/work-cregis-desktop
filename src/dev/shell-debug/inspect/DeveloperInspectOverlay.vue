<script setup lang="ts">
import { computed } from 'vue';
import {
  developerInspectActive,
  inspectHoverInfo,
  inspectHoverRect,
  inspectPinnedInfo,
  inspectPinnedRect,
} from './developerInspectSession';
import InspectLayoutChrome from './InspectLayoutChrome.vue';
import InspectEdgeMeasureChrome from './InspectEdgeMeasureChrome.vue';
import { buildHoverMeasureModel } from './buildLayoutMeasurement';
import {
  DEV_INSPECT_HOVER_ACCENT,
  DEV_INSPECT_PINNED_ACCENT,
} from './devInspectTheme';
import styles from '../ShellDebugPlatform.module.css';

const PREVIEW_SELECTOR = '.app-preview';

const previewRoot = computed(() => {
  const pinned = inspectPinnedInfo.value;
  if (pinned) {
    return pinned.element.closest(PREVIEW_SELECTOR);
  }
  const hover = inspectHoverInfo.value;
  if (hover) {
    return hover.element.closest(PREVIEW_SELECTOR);
  }
  return document.querySelector(PREVIEW_SELECTOR);
});

const showPinnedChrome = computed(
  () =>
    developerInspectActive.value
    && inspectPinnedInfo.value
    && inspectPinnedRect.value
    && previewRoot.value,
);

const showHoverChrome = computed(() => {
  if (!developerInspectActive.value || !inspectHoverInfo.value || !inspectHoverRect.value || !previewRoot.value) {
    return false;
  }
  const pinned = inspectPinnedInfo.value;
  if (!pinned) return true;
  return inspectHoverInfo.value.element !== pinned.element;
});

const compareEdgeMeasures = computed(() => {
  if (
    !developerInspectActive.value
    || !inspectPinnedInfo.value
    || !inspectPinnedRect.value
    || !inspectHoverInfo.value
    || !inspectHoverRect.value
    || !previewRoot.value
  ) {
    return [];
  }
  if (inspectPinnedInfo.value.element === inspectHoverInfo.value.element) {
    return [];
  }
  void inspectPinnedRect.value;
  void inspectHoverRect.value;
  return buildHoverMeasureModel(
    inspectPinnedRect.value,
    inspectHoverRect.value,
    previewRoot.value,
  );
});
</script>

<template>
  <Teleport to="body">
    <div v-if="developerInspectActive" data-dev-inspect-overlay :class="styles.inspectOverlayRoot">
      <InspectLayoutChrome
        v-if="showPinnedChrome && inspectPinnedInfo && inspectPinnedRect && previewRoot"
        :preview="previewRoot"
        :component-label="inspectPinnedInfo.label"
        :pinned-element="inspectPinnedInfo.element"
        :pinned-rect="inspectPinnedRect"
        :accent="DEV_INSPECT_PINNED_ACCENT"
      />

      <InspectEdgeMeasureChrome
        v-if="compareEdgeMeasures.length > 0"
        :measures="compareEdgeMeasures"
      />

      <InspectLayoutChrome
        v-if="showHoverChrome && inspectHoverInfo && inspectHoverRect && previewRoot"
        variant="hover"
        :preview="previewRoot"
        :component-label="inspectHoverInfo.label"
        :pinned-element="inspectHoverInfo.element"
        :pinned-rect="inspectHoverRect"
        :accent="DEV_INSPECT_HOVER_ACCENT"
      />
    </div>
  </Teleport>
</template>
