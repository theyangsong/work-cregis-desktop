<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { EgAnchoredTooltip, EgTooltip } from '@eds/desktop-components';
import type { ElementInspectInfo, InspectPropertyItem } from './buildElementInspectInfo';
import { copyDevInspectText } from './copyDevInspectText';
import { DEV_INSPECT_COPY_FEEDBACK } from './devInspectCopyFeedback';
import {
  buildEffectSemanticCssBlock,
  parseEffectSemanticClassFromStyleLine,
} from './effectSemanticSpec';
import {
  resolveCodeLineMode,
  resolveInspectPropertyValueTone,
  splitInspectCodeLines,
  inspectCodeTokenClass,
  tokenizeCodeLine,
  tokenizeInspectPropertyCodeValue,
  tokenizeInspectPropertyTokenValue,
  tokenizeInspectValue,
} from './inspectCodeHighlight';
import './shellDebugInspectCodeTokens.css';

import { markShellDebugUiInteraction } from '../installShellDebugFloatLayerGuard';

const EFFECT_SPEC_TOOLTIP_WIDTH = 320;

const props = defineProps<{
  info: ElementInspectInfo | null;
  embedded?: boolean;
}>();

const copiedLineKey = ref<string | null>(null);
const effectSpecTooltipRef = ref<{ close?: () => void } | null>(null);
let copiedLineTimer: ReturnType<typeof setTimeout> | undefined;

const hasSelection = computed(() => props.info != null);

const HIDDEN_INSPECT_PROPERTY_LABELS = new Set(['标签', 'EDS 类名']);

function filterInspectPropertyPanelItems(items: InspectPropertyItem[]): InspectPropertyItem[] {
  return items.filter((item) => !HIDDEN_INSPECT_PROPERTY_LABELS.has(item.label));
}

const propertyItems = computed(() => {
  if (!props.info) return [];
  if (props.info.edsComponent?.props.length) {
    return filterInspectPropertyPanelItems(props.info.edsComponent.props);
  }
  return filterInspectPropertyPanelItems(props.info.elementAttributes);
});

const adaptiveItems = computed(() => props.info?.adaptiveItems ?? []);

const showUsageSnippet = computed(() => {
  const snippet = props.info?.edsComponent?.usageSnippet?.trim();
  if (!snippet) return false;
  return !/^<Eg[A-Za-z]+\s*\/>$/.test(snippet);
});

const codeSections = computed(() => props.info?.codeSections ?? []);

function propertyValueTone(item: InspectPropertyItem) {
  return resolveInspectPropertyValueTone(item.value, item);
}

function usageSnippetLines(snippet: string) {
  return splitInspectCodeLines(snippet).map((line, index) => ({
    number: index + 1,
    line,
    tokens: tokenizeInspectValue(line),
  }));
}

function sectionLines(title: string, content: string) {
  const mode = resolveCodeLineMode(title);
  return splitInspectCodeLines(content).map((line, index) => ({
    number: index + 1,
    line,
    tokens: tokenizeCodeLine(line, mode),
  }));
}

function effectClassFromLine(line: string): string | null {
  return parseEffectSemanticClassFromStyleLine(line);
}

function effectCssBlockLines(className: string) {
  const block = buildEffectSemanticCssBlock(className);
  if (!block) return [];
  return splitInspectCodeLines(block).map((line, index) => ({
    number: index + 1,
    line,
    tokens: tokenizeCodeLine(line, 'css'),
  }));
}

function onEffectClassPointerDown(event: PointerEvent) {
  event.stopPropagation();
  markShellDebugUiInteraction();
}

function onInspectPanelPointerDown(event: PointerEvent) {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('[data-effect-spec-trigger]')) return;
  if (event.target.closest('.shell-debug-effect-spec-tooltip')) return;
  if (event.target.closest('[class*="floating"]')?.querySelector('.shell-debug-effect-spec-tooltip')) {
    return;
  }
  if (!event.target.closest('.shell-debug-dev-inspect-popover')) return;
  effectSpecTooltipRef.value?.close?.();
}

function onEffectSpecTooltipPointerDown(event: PointerEvent) {
  event.stopPropagation();
  markShellDebugUiInteraction();
}

function effectSpecLineKey(className: string, lineNumber: number) {
  return `effect-spec-${className}-${lineNumber}`;
}

async function onCopyLine(line: string, lineKey: string) {
  if (!line.trim()) return;
  const ok = await copyDevInspectText(line);
  if (!ok) return;

  if (copiedLineTimer !== undefined) {
    window.clearTimeout(copiedLineTimer);
  }
  copiedLineKey.value = lineKey;
  copiedLineTimer = window.setTimeout(() => {
    copiedLineKey.value = null;
    copiedLineTimer = undefined;
  }, 1000);
}

onBeforeUnmount(() => {
  if (copiedLineTimer !== undefined) {
    window.clearTimeout(copiedLineTimer);
  }
});
</script>

<template>
  <div
    v-if="hasSelection && info"
    :class="[$style.root, embedded && $style.rootEmbedded]"
    data-dev-inspect-copy
    @pointerdown="onInspectPanelPointerDown"
  >
    <div v-if="propertyItems.length > 0" :class="$style.inspectGroup">
      <p :class="$style.sectionTitle">属性</p>
      <ul :class="[$style.propRows, $style.inspectCardFrame]">
        <li
          v-for="item in propertyItems"
          :key="`property-${item.label}`"
          :class="$style.propRow"
        >
          <button
            type="button"
            :class="$style.propButton"
            :disabled="!item.copyLine"
            @click="onCopyLine(item.copyLine, `property-${item.label}`)"
          >
            <span :class="$style.propLabel">{{ item.label }}</span>
            <span :class="$style.propValueCell">
              <span :class="$style.propValue">
                <template v-if="propertyValueTone(item) === 'code'">
                  <span
                    v-for="(token, tokenIndex) in tokenizeInspectPropertyCodeValue(item.value)"
                    :key="`property-value-${item.label}-${tokenIndex}`"
                    :class="inspectCodeTokenClass(token.kind)"
                  >{{ token.text }}</span>
                </template>
                <template v-else-if="propertyValueTone(item) === 'token'">
                  <span
                    v-for="(token, tokenIndex) in tokenizeInspectPropertyTokenValue(item.value)"
                    :key="`property-value-${item.label}-${tokenIndex}`"
                    :class="inspectCodeTokenClass(token.kind)"
                  >{{ token.text }}</span>
                </template>
                <template v-else>{{ item.value }}</template>
              </span>
              <span
                v-if="copiedLineKey === `property-${item.label}`"
                :class="$style.copyFeedback"
              >{{ DEV_INSPECT_COPY_FEEDBACK }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>

    <div v-if="adaptiveItems.length > 0" :class="$style.inspectGroup">
      <p :class="$style.sectionTitle">DataList 适配</p>
      <ul :class="[$style.propRows, $style.inspectCardFrame]">
        <li
          v-for="item in adaptiveItems"
          :key="`adaptive-${item.label}`"
          :class="$style.propRow"
        >
          <button
            type="button"
            :class="$style.propButton"
            :disabled="!item.copyLine"
            @click="onCopyLine(item.copyLine, `adaptive-${item.label}`)"
          >
            <span :class="$style.propLabel">{{ item.label }}</span>
            <span :class="$style.propValueCell">
              <span :class="$style.propValue">
                <template v-if="propertyValueTone(item) === 'code'">
                  <span
                    v-for="(token, tokenIndex) in tokenizeInspectPropertyCodeValue(item.value)"
                    :key="`adaptive-value-${item.label}-${tokenIndex}`"
                    :class="inspectCodeTokenClass(token.kind)"
                  >{{ token.text }}</span>
                </template>
                <template v-else-if="propertyValueTone(item) === 'token'">
                  <span
                    v-for="(token, tokenIndex) in tokenizeInspectPropertyTokenValue(item.value)"
                    :key="`adaptive-value-${item.label}-${tokenIndex}`"
                    :class="inspectCodeTokenClass(token.kind)"
                  >{{ token.text }}</span>
                </template>
                <template v-else>{{ item.value }}</template>
              </span>
              <span
                v-if="copiedLineKey === `adaptive-${item.label}`"
                :class="$style.copyFeedback"
              >{{ DEV_INSPECT_COPY_FEEDBACK }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>

    <div v-if="showUsageSnippet && info.edsComponent" :class="$style.inspectGroup">
      <p :class="$style.sectionTitle">用法</p>
      <div :class="$style.codeBlockFrame">
        <ul :class="$style.codeLineRows">
          <li
            v-for="row in usageSnippetLines(info.edsComponent!.usageSnippet)"
            :key="`usage-${row.number}`"
            :class="$style.codeLineRow"
          >
            <button
              type="button"
              :class="$style.codeLineButton"
              @click="onCopyLine(row.line, `usage-${row.number}`)"
            >
              <span :class="$style.lineNumber">{{ row.number }}</span>
              <span :class="$style.lineContent">
                <span
                  v-for="(token, tokenIndex) in row.tokens"
                  :key="`usage-${row.number}-${tokenIndex}`"
                  :class="inspectCodeTokenClass(token.kind)"
                >{{ token.text }}</span>
              </span>
              <span
                v-if="copiedLineKey === `usage-${row.number}`"
                :class="$style.copyFeedback"
              >{{ DEV_INSPECT_COPY_FEEDBACK }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div
      v-for="section in codeSections"
      :key="`code-section-${section.title}`"
      :class="$style.inspectGroup"
    >
      <p :class="$style.sectionTitle">{{ section.title }}</p>
      <div :class="$style.codeBlockFrame">
        <ul :class="$style.codeLineRows">
          <li
            v-for="row in sectionLines(section.title, section.content)"
            :key="`${section.title}-${row.number}`"
            :class="[
              $style.codeLineRow,
              effectClassFromLine(row.line) && $style.codeLineRowExpand,
            ]"
          >
            <div
              v-if="effectClassFromLine(row.line)"
              class="effect-class-trigger-host"
              :class="$style.effectClassTooltipHost"
            >
              <EgAnchoredTooltip
                ref="effectSpecTooltipRef"
                placement="left"
                align="end"
                trigger="click"
                :click-toggle="true"
                :wrap-tooltip="false"
                :close-on-scroll="false"
                teleport-to="body"
                boundary-selector="body"
              >
                <button
                  type="button"
                  :class="$style.codeLineButton"
                  data-effect-spec-trigger
                  title="点击查看 Effect 参数"
                  @pointerdown="onEffectClassPointerDown"
                >
                  <span :class="$style.lineNumber">{{ row.number }}</span>
                  <span :class="$style.lineContent">
                    <span
                      v-for="(token, tokenIndex) in row.tokens"
                      :key="`${section.title}-${row.number}-${tokenIndex}`"
                      :class="inspectCodeTokenClass(token.kind)"
                    >{{ token.text }}</span>
                  </span>
                </button>
                <template #content>
                  <EgTooltip
                    panel-kind="flotation"
                    panel-radius="radius-md"
                    panel-layout-motion
                    panel-micro-float
                    width-mode="fixed"
                    :width="EFFECT_SPEC_TOOLTIP_WIDTH"
                    height-mode="adaptive"
                    :max-height="360"
                    :scrollable="true"
                  >
                    <div
                      class="shell-debug-effect-spec-tooltip"
                      :class="$style.effectSpecCodeBlock"
                      @pointerdown="onEffectSpecTooltipPointerDown"
                    >
                      <ul :class="$style.codeLineRows">
                        <li
                          v-for="detailRow in effectCssBlockLines(effectClassFromLine(row.line)!)"
                          :key="`${section.title}-effect-${detailRow.number}`"
                          :class="$style.codeLineRow"
                        >
                          <div
                            role="button"
                            tabindex="0"
                            :class="$style.effectSpecLineButton"
                            @click="onCopyLine(
                              detailRow.line,
                              effectSpecLineKey(effectClassFromLine(row.line)!, detailRow.number),
                            )"
                            @keydown.enter.prevent="onCopyLine(
                              detailRow.line,
                              effectSpecLineKey(effectClassFromLine(row.line)!, detailRow.number),
                            )"
                          >
                            <span :class="$style.lineNumber">{{ detailRow.number }}</span>
                            <span :class="$style.effectSpecLineContent">
                              <span
                                v-for="(token, tokenIndex) in detailRow.tokens"
                                :key="`${section.title}-effect-${detailRow.number}-${tokenIndex}`"
                                :class="inspectCodeTokenClass(token.kind)"
                              >{{ token.text }}</span>
                            </span>
                            <span
                              v-if="copiedLineKey === effectSpecLineKey(
                                effectClassFromLine(row.line)!,
                                detailRow.number,
                              )"
                              :class="$style.copyFeedback"
                            >{{ DEV_INSPECT_COPY_FEEDBACK }}</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </EgTooltip>
                </template>
              </EgAnchoredTooltip>
            </div>
            <button
              v-else
              type="button"
              :class="$style.codeLineButton"
              @click="onCopyLine(row.line, `${section.title}-${row.number}`)"
            >
              <span :class="$style.lineNumber">{{ row.number }}</span>
              <span :class="$style.lineContent">
                <span
                  v-for="(token, tokenIndex) in row.tokens"
                  :key="`${section.title}-${row.number}-${tokenIndex}`"
                  :class="inspectCodeTokenClass(token.kind)"
                >{{ token.text }}</span>
              </span>
              <span
                v-if="copiedLineKey === `${section.title}-${row.number}`"
                :class="$style.copyFeedback"
              >{{ DEV_INSPECT_COPY_FEEDBACK }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <ul v-else :class="[$style.hint, embedded && $style.hintEntry]">
    <li :class="$style.hintEntryLine">点击元素查看 Dev 信息</li>
    <li :class="$style.hintEntryLine">再次点击退出 Dev 模式</li>
  </ul>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  user-select: text;
}

.rootEmbedded {
  padding: 0;
  min-height: 0;
}

.inspectGroup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.sectionTitle {
  margin: 0;
  font-size: var(--eds-footnote-size);
  font-weight: var(--eds-footnote-weight);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-primary);
}

.propRows,
.codeRows,
.codeLineRows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.propRows {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: var(--spacing-5);
  row-gap: var(--spacing-025);
}

.codeRows,
.codeLineRows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-025);
}

.inspectCardFrame {
  box-sizing: border-box;
  padding: var(--spacing-1);
  border: var(--stroke-xs) solid var(--stroke-outline-shallow);
  border-radius: var(--radius-xs);
  overflow: hidden;
}

.codeText {
  font-family: var(--eds-family-mono, ui-monospace, monospace);
  font-size: var(--eds-footnote-size);
  font-weight: var(--eds-footnote-weight);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-primary);
}

.propRow {
  display: contents;
  margin: 0;
}

.codeLineRowExpand {
  width: 100%;
}

.effectClassTooltipHost {
  display: block;
  width: 100%;
}

.effectClassTooltipHost :global([class*='root']) {
  display: block;
  width: 100%;
}

.effectClassTooltipHost :global([class*='trigger']) {
  display: block;
  width: 100%;
}

.codeRow,
.codeLineRow {
  margin: 0;
}

.propButton,
.codeLineButton {
  margin: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  composes: motion-ease is-paint from global;
}

.propButton {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: baseline;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-xs);
}

.codeLineButton {
  display: grid;
  width: 100%;
  grid-template-columns: var(--spacing-6) minmax(0, 1fr) auto;
  gap: 0;
  padding: 0;
  border-radius: var(--radius-xs);
  align-items: stretch;
}

.propButton:disabled {
  cursor: default;
}

.propButton:hover,
.codeLineButton:hover {
  background: var(--event-hover);
}

.propLabel {
  white-space: nowrap;
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
}

.propValueCell {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  min-width: 0;
}

.propValueCell .copyFeedback {
  grid-column: auto;
  align-self: auto;
  padding-right: 0;
}

.propValue {
  flex: 1 1 auto;
  min-width: 0;
  font-family: var(--eds-family-mono, ui-monospace, monospace);
  font-size: var(--eds-footnote-size);
  font-weight: var(--eds-footnote-weight);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-primary);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.codeBlockFrame {
  composes: inspectCardFrame;
}

.lineNumber {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  box-sizing: border-box;
  min-width: var(--spacing-6);
  padding: var(--spacing-05) var(--spacing-2);
  border-right: var(--stroke-xs) solid var(--stroke-outline-shallow);
  font-family: var(--eds-family-mono, ui-monospace, monospace);
  font-size: var(--eds-footnote-size);
  font-weight: var(--eds-footnote-weight);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-tertiary, var(--text-base-secondary));
  text-align: right;
  user-select: none;
}

.lineContent {
  composes: codeText;
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--spacing-05) var(--spacing-3);
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
}

/* 语法色真源在 shellDebugInspectCodeTokens.css；此处不得再声明 token 颜色。 */

.copyFeedback {
  grid-column: 3;
  align-self: center;
  padding-right: var(--spacing-1);
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
  white-space: nowrap;
}

.effectSpecCodeBlock {
  border: none;
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-sizing: border-box;
  min-width: 0;
  user-select: text;
}

.effectSpecLineButton {
  display: grid;
  width: 100%;
  grid-template-columns: var(--spacing-6) minmax(0, 1fr) auto;
  gap: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-xs);
  color: unset;
  composes: motion-ease is-paint from global;
}

.effectSpecLineButton:hover {
  background: var(--event-hover);
}

.effectSpecLineContent {
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--spacing-05) var(--spacing-3);
  font-family: var(--eds-family-mono, ui-monospace, monospace);
  font-size: var(--eds-footnote-size);
  font-weight: var(--eds-footnote-weight);
  line-height: var(--eds-footnote-line-height);
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
}

.hint {
  margin: 0;
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
}

.hintEntry {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-05);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--eds-body-medium-size);
  font-weight: var(--eds-body-medium-weight);
  line-height: var(--eds-body-medium-line-height);
  color: var(--text-base-primary);
}

.hintEntryLine {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-1);
  margin: 0;
  padding: 0;
  white-space: nowrap;
}

.hintEntryLine::before {
  content: '○';
  flex: 0 0 auto;
  color: var(--text-base-secondary);
}
</style>
