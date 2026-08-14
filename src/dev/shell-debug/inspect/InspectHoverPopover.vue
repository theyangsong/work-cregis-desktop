<script setup lang="ts">
import { computed } from 'vue';
import type { ElementInspectInfo } from './buildElementInspectInfo';

const props = defineProps<{
  info: ElementInspectInfo;
  anchorRect: DOMRect;
}>();

const style = computed(() => {
  const rect = props.anchorRect;
  const width = 280;
  const margin = 8;
  let left = rect.left;
  let top = rect.bottom + margin;

  if (left + width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - width - margin);
  }
  if (top + 160 > window.innerHeight - margin) {
    top = Math.max(margin, rect.top - 160 - margin);
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
  };
});

const previewLines = computed(() => {
  const lines: string[] = [
    `${Math.round(props.info.rect.width)} × ${Math.round(props.info.rect.height)}`,
  ];

  for (const group of props.info.groups.slice(0, 2)) {
    for (const item of group.items.slice(0, 2)) {
      lines.push(`${item.label}: ${item.value}`);
    }
  }

  return lines.slice(0, 5);
});
</script>

<template>
  <div :class="$style.root" :style="style" data-dev-inspect-overlay>
    <p :class="$style.title">{{ info.label }}</p>
    <p :class="$style.subtitle">{{ info.tagName }}</p>
    <ul :class="$style.lines">
      <li v-for="line in previewLines" :key="line">{{ line }}</li>
    </ul>
    <p :class="$style.hint">Click to pin in Dev panel</p>
  </div>
</template>

<style module>
.root {
  position: fixed;
  z-index: 10001;
  box-sizing: border-box;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  background: var(--box-page);
  border: 1px solid color-mix(in srgb, var(--material-brand-primary) 35%, transparent);
  box-shadow: var(--effect-subtle-card-shadow, 0 8px 24px rgb(0 0 0 / 16%));
  pointer-events: none;
  font-family: var(--eds-family-sans);
}

.title {
  margin: 0;
  font-size: var(--eds-body-medium-strong-size);
  font-weight: var(--eds-body-medium-strong-weight);
  line-height: var(--eds-body-medium-strong-line-height);
  color: var(--text-base-primary);
}

.subtitle {
  margin: var(--spacing-025) 0 0;
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
}

.lines {
  margin: var(--spacing-2) 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-025);
}

.lines li {
  font-family: var(--eds-family-mono, ui-monospace, monospace);
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-primary);
  word-break: break-all;
}

.hint {
  margin: var(--spacing-2) 0 0;
  font-size: var(--eds-caption-size, var(--eds-footnote-size));
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-tertiary, var(--text-base-secondary));
}
</style>
