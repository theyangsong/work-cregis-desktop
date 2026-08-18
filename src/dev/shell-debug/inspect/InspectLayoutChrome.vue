<script setup lang="ts">
import { computed } from 'vue';
import { buildLayoutChromeModel, boxRectStyle } from './buildLayoutMeasurement';
import { DEV_INSPECT_PINNED_ACCENT } from './devInspectTheme';

const props = defineProps<{
  preview: Element;
  componentLabel: string;
  pinnedElement: Element;
  pinnedRect: DOMRect;
  accent?: string;
}>();

const layoutModel = computed(() => {
  void props.pinnedRect;
  return buildLayoutChromeModel(props.pinnedElement, props.preview);
});

const accentStyle = computed(
  () =>
    ({
      '--dev-inspect-accent': props.accent ?? DEV_INSPECT_PINNED_ACCENT,
    }) as const,
);
</script>

<template>
  <div :class="$style.root" :style="accentStyle">
    <div :class="$style.selectionShell" :style="boxRectStyle(layoutModel.selectionRect)">
      <span :class="$style.componentLabel">{{ componentLabel }}</span>
    </div>

    <div
      v-for="zone in layoutModel.paddingZones"
      :key="`padding-${zone.side}`"
      :class="[$style.paddingZone, $style[`paddingZone${zone.side}`]]"
      :style="boxRectStyle(zone.rect)"
    >
      <span :class="$style.spacingLabel">{{ zone.displayLabel }}</span>
    </div>

    <div
      v-for="(child, index) in layoutModel.childOutlines"
      :key="`child-${index}`"
      :class="$style.childOutline"
      :style="boxRectStyle(child.rect)"
    />

    <div
      v-for="(gap, index) in layoutModel.childGaps"
      :key="`gap-${index}`"
      :class="$style.childGap"
      :style="boxRectStyle(gap.rect)"
    >
      <span :class="$style.spacingLabel">{{ gap.displayLabel }}</span>
    </div>
  </div>
</template>

<style module>
.root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9996;
}

.selectionShell {
  position: fixed;
  box-sizing: border-box;
  border: 2px solid var(--dev-inspect-accent, #ff308d);
  pointer-events: none;
}

.componentLabel {
  position: absolute;
  top: calc(-1 * var(--spacing-4));
  left: 0;
  padding: var(--spacing-025) var(--spacing-1);
  border-radius: var(--radius-xs);
  background: var(--dev-inspect-accent, #ff308d);
  font-size: var(--eds-caption-size, var(--eds-footnote-size));
  line-height: var(--eds-footnote-line-height);
  color: #ffffff;
  white-space: nowrap;
}

.paddingZone {
  position: fixed;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed color-mix(in srgb, var(--dev-inspect-accent, #ff308d) 55%, transparent);
  background: repeating-linear-gradient(
    135deg,
    color-mix(in srgb, var(--dev-inspect-accent, #ff308d) 16%, transparent) 0,
    color-mix(in srgb, var(--dev-inspect-accent, #ff308d) 16%, transparent) 6px,
    transparent 6px,
    transparent 12px
  );
  pointer-events: none;
}

.childOutline {
  position: fixed;
  box-sizing: border-box;
  border: 1px dashed color-mix(in srgb, var(--dev-inspect-accent, #ff308d) 80%, transparent);
  pointer-events: none;
}

.childGap {
  position: fixed;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed color-mix(in srgb, var(--dev-inspect-accent, #ff308d) 45%, transparent);
  background: color-mix(in srgb, var(--dev-inspect-accent, #ff308d) 8%, transparent);
  pointer-events: none;
}

.spacingLabel {
  position: fixed;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-025) var(--spacing-1);
  border-radius: var(--radius-full);
  background: var(--dev-inspect-accent, #ff308d);
  font-family: var(--eds-family-mono, ui-monospace, monospace);
  font-size: var(--eds-caption-size, var(--eds-footnote-size));
  line-height: var(--eds-footnote-line-height);
  color: #ffffff;
  white-space: nowrap;
  pointer-events: none;
}
</style>
