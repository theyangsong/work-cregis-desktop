<script setup lang="ts">
import { computed, ref } from 'vue';
import { EgButton } from '@eds/desktop-components';
import type { ElementInspectInfo } from './buildElementInspectInfo';
import { copyDevInspectText } from './copyDevInspectText';

const props = defineProps<{
  info: ElementInspectInfo | null;
}>();

const copyState = ref<'idle' | 'done' | 'error'>('idle');

const hasSelection = computed(() => props.info != null);

async function onCopyAll() {
  if (!props.info) return;
  const ok = await copyDevInspectText(props.info.copyBundle);
  copyState.value = ok ? 'done' : 'error';
  window.setTimeout(() => {
    copyState.value = 'idle';
  }, 1400);
}

async function onCopyLine(line: string) {
  const ok = await copyDevInspectText(line);
  copyState.value = ok ? 'done' : 'error';
  window.setTimeout(() => {
    copyState.value = 'idle';
  }, 1400);
}
</script>

<template>
  <div v-if="hasSelection && info" :class="$style.root" data-dev-inspect-copy>
    <div :class="$style.header">
      <div :class="$style.headerText">
        <p :class="$style.title">{{ info.label }}</p>
        <p :class="$style.meta">
          {{ info.tagName }}
          <span v-if="info.vueComponentName"> · {{ info.vueComponentName }}</span>
        </p>
      </div>
      <EgButton tone="decor" variant="outline" size="sm" @click="onCopyAll">
        {{ copyState === 'done' ? 'Copied' : copyState === 'error' ? 'Failed' : 'Copy all' }}
      </EgButton>
    </div>

    <p :class="$style.dom">{{ info.domPath }}</p>

    <section v-for="group in info.groups" :key="group.id" :class="$style.section">
      <p :class="$style.sectionTitle">{{ group.label }}</p>
      <ul :class="$style.rows">
        <li v-for="item in group.items" :key="`${group.id}-${item.label}`" :class="$style.row">
          <button type="button" :class="$style.rowButton" @click="onCopyLine(item.copyLine)">
            <span :class="$style.rowLabel">{{ item.label }}</span>
            <span :class="$style.rowValue">{{ item.value }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>

  <p v-else :class="$style.hint">
    Hover an element in the app preview to inspect. Click to pin properties here for copy.
  </p>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  user-select: text;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.headerText {
  flex: 1 1 auto;
  min-width: 0;
}

.title {
  margin: 0;
  font-size: var(--eds-body-medium-strong-size);
  font-weight: var(--eds-body-medium-strong-weight);
  line-height: var(--eds-body-medium-strong-line-height);
  color: var(--text-base-primary);
}

.meta {
  margin: var(--spacing-025) 0 0;
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
}

.dom {
  margin: 0;
  font-family: var(--eds-family-mono, ui-monospace, monospace);
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
  word-break: break-all;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.sectionTitle {
  margin: 0;
  font-size: var(--eds-footnote-size);
  font-weight: var(--eds-footnote-medium-weight);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
}

.rows {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-025);
}

.row {
  margin: 0;
}

.rowButton {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-025);
  width: 100%;
  margin: 0;
  padding: var(--spacing-1) var(--spacing-2);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  text-align: left;
  cursor: pointer;
  composes: motion-ease is-hover from global;
}

.rowButton:hover {
  background: var(--event-hover);
}

.rowLabel {
  font-size: var(--eds-caption-size, var(--eds-footnote-size));
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-tertiary, var(--text-base-secondary));
}

.rowValue {
  font-family: var(--eds-family-mono, ui-monospace, monospace);
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-primary);
  word-break: break-all;
}

.hint {
  margin: 0;
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
}
</style>
