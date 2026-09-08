<script setup lang="ts">
import {
  boxRectStyle,
  type InspectEdgeMeasure,
} from './buildLayoutMeasurement';
import './devInspectCompareMeasure.css';

defineProps<{
  measures: InspectEdgeMeasure[];
}>();

function measureGapStyle(measure: InspectEdgeMeasure) {
  const rect = measure.lineRect;
  if (measure.axis === 'vertical') {
    return boxRectStyle({
      top: rect.top,
      left: rect.left - 8,
      width: 16,
      height: rect.height,
    });
  }
  return boxRectStyle({
    top: rect.top - 8,
    left: rect.left,
    width: rect.width,
    height: 16,
  });
}

function labelStyle(measure: InspectEdgeMeasure) {
  const { top, left } = measure.labelRect;
  return {
    top: `${top}px`,
    left: `${left}px`,
  };
}
</script>

<template>
  <div v-if="measures.length > 0" :class="$style.root">
    <div
      v-for="(measure, index) in measures"
      :key="`edge-${measure.axis}-${index}`"
      :class="[$style.measureGap, 'dev-inspect-compare-measure__gap']"
      :style="measureGapStyle(measure)"
    />
    <span
      v-for="(measure, index) in measures"
      :key="`edge-label-${measure.axis}-${index}`"
      :class="[$style.spacingLabel, 'dev-inspect-compare-measure__label']"
      :style="labelStyle(measure)"
    >
      {{ measure.displayLabel }}
    </span>
  </div>
</template>

<style module>
.root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
}

.measureGap {
  position: fixed;
  box-sizing: border-box;
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
  font-family: var(--eds-family-mono, ui-monospace, monospace);
  font-size: var(--eds-caption-size, var(--eds-footnote-size));
  line-height: var(--eds-footnote-line-height);
  white-space: nowrap;
  pointer-events: none;
  transform: translate(-50%, -50%);
}
</style>
