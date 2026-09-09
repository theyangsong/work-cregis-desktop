<script setup lang="ts">
import { computed } from 'vue';
import {
  developerInspectActive,
  inspectHoverInfo,
  inspectHoverRect,
  inspectPinnedInfo,
  inspectPinnedRect,
} from './developerInspectSession';
import { resolveInspectScopeRoot } from './inspectFloatLayerScope';
import InspectLayoutChrome from './InspectLayoutChrome.vue';
import InspectEdgeMeasureChrome from './InspectEdgeMeasureChrome.vue';
import { buildHoverMeasureModel } from './buildLayoutMeasurement';
import {
  DEV_INSPECT_HOVER_ACCENT,
  DEV_INSPECT_PINNED_ACCENT,
} from './devInspectTheme';
import styles from '../ShellDebugPlatform.module.css';

const PREVIEW_SELECTOR = '.app-preview';

function resolveAppPreview(): Element | null {
  return document.querySelector(PREVIEW_SELECTOR);
}

/** 布局 chrome 的 scope：preview 内用 preview；teleport 浮层用浮层根（eds-tooltip-v-* 等）。 */
function resolveInspectChromeRoot(element: Element | null): Element | null {
  const preview = resolveAppPreview();
  if (!preview) return null;
  if (!element) return preview;
  return resolveInspectScopeRoot(element, preview);
}

const inspectChromeRoot = computed(() => {
  const pinned = inspectPinnedInfo.value;
  if (pinned) {
    return resolveInspectChromeRoot(pinned.element);
  }
  const hover = inspectHoverInfo.value;
  if (hover) {
    return resolveInspectChromeRoot(hover.element);
  }
  return resolveAppPreview();
});

const showPinnedChrome = computed(
  () =>
    developerInspectActive.value
    && inspectPinnedInfo.value
    && inspectPinnedRect.value
    && inspectChromeRoot.value,
);

const showHoverChrome = computed(() => {
  if (!developerInspectActive.value || !inspectHoverInfo.value || !inspectHoverRect.value || !inspectChromeRoot.value) {
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
    || !inspectChromeRoot.value
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
    resolveAppPreview() ?? inspectChromeRoot.value,
  );
});
</script>

<template>
  <Teleport to="body">
    <div v-if="developerInspectActive" data-dev-inspect-overlay :class="styles.inspectOverlayRoot">
      <InspectLayoutChrome
        v-if="showPinnedChrome && inspectPinnedInfo && inspectPinnedRect && inspectChromeRoot"
        :preview="inspectChromeRoot"
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
        v-if="showHoverChrome && inspectHoverInfo && inspectHoverRect && inspectChromeRoot"
        variant="hover"
        :preview="inspectChromeRoot"
        :component-label="inspectHoverInfo.label"
        :pinned-element="inspectHoverInfo.element"
        :pinned-rect="inspectHoverRect"
        :accent="DEV_INSPECT_HOVER_ACCENT"
      />
    </div>
  </Teleport>
</template>
