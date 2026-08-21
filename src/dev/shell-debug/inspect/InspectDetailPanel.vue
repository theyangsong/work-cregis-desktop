<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import type { ElementInspectInfo, InspectPropertyItem } from './buildElementInspectInfo';
import { copyDevInspectText } from './copyDevInspectText';
import { DEV_INSPECT_COPY_FEEDBACK } from './devInspectCopyFeedback';
import {
  resolveCodeLineMode,
  resolveInspectPropertyValueTone,
  splitInspectCodeLines,
  tokenizeCodeLine,
  tokenizeInspectPropertyCodeValue,
  tokenizeInspectPropertyTokenValue,
  tokenizeInspectValue,
  type InspectCodeToken,
} from './inspectCodeHighlight';

const props = defineProps<{
  info: ElementInspectInfo | null;
  embedded?: boolean;
}>();

const copiedLineKey = ref<string | null>(null);
let copiedLineTimer: ReturnType<typeof setTimeout> | undefined;

const hasSelection = computed(() => props.info != null);

const propertyItems = computed(() => {
  if (!props.info) return [];
  if (props.info.edsComponent?.props.length) {
    return props.info.edsComponent.props;
  }
  return props.info.elementAttributes;
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

function tokenClass(kind: InspectCodeToken['kind']): string {
  switch (kind) {
    case 'prop':
      return 'tokenProp';
    case 'keyword':
      return 'tokenKeyword';
    case 'function':
      return 'tokenFunction';
    case 'variable':
      return 'tokenVariable';
    case 'value':
      return 'tokenValue';
    case 'tag':
      return 'tokenTag';
    case 'attr':
      return 'tokenAttr';
    case 'string':
      return 'tokenString';
    case 'punct':
      return 'tokenPunct';
    case 'comment':
      return 'tokenComment';
    default:
      return 'tokenPlain';
  }
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
                    :class="$style[tokenClass(token.kind)]"
                  >{{ token.text }}</span>
                </template>
                <template v-else-if="propertyValueTone(item) === 'token'">
                  <span
                    v-for="(token, tokenIndex) in tokenizeInspectPropertyTokenValue(item.value)"
                    :key="`property-value-${item.label}-${tokenIndex}`"
                    :class="$style[tokenClass(token.kind)]"
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
                    :class="$style[tokenClass(token.kind)]"
                  >{{ token.text }}</span>
                </template>
                <template v-else-if="propertyValueTone(item) === 'token'">
                  <span
                    v-for="(token, tokenIndex) in tokenizeInspectPropertyTokenValue(item.value)"
                    :key="`adaptive-value-${item.label}-${tokenIndex}`"
                    :class="$style[tokenClass(token.kind)]"
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
              title="点击复制"
              @click="onCopyLine(row.line, `usage-${row.number}`)"
            >
              <span :class="$style.lineNumber">{{ row.number }}</span>
              <span :class="$style.lineContent">
                <span
                  v-for="(token, tokenIndex) in row.tokens"
                  :key="`usage-${row.number}-${tokenIndex}`"
                  :class="$style[tokenClass(token.kind)]"
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
            :class="$style.codeLineRow"
          >
            <button
              type="button"
              :class="$style.codeLineButton"
              title="点击复制"
              @click="onCopyLine(row.line, `${section.title}-${row.number}`)"
            >
              <span :class="$style.lineNumber">{{ row.number }}</span>
              <span :class="$style.lineContent">
                <span
                  v-for="(token, tokenIndex) in row.tokens"
                  :key="`${section.title}-${row.number}-${tokenIndex}`"
                  :class="$style[tokenClass(token.kind)]"
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
  composes: motion-ease is-hover from global;
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

.tokenProp,
.tokenPunct,
.tokenPlain,
.tokenVariable {
  color: var(--text-base-primary);
}

.tokenKeyword,
.tokenValue {
  color: #ec008c;
  color: color(display-p3 0.9255 0 0.549);
}

.tokenFunction,
.tokenString {
  color: #b45309;
  color: color(display-p3 0.7059 0.3255 0.0353);
}

.codeBlockFrame .tokenComment {
  color: var(--text-base-tertiary);
}

.codeBlockFrame .tokenAttr {
  color: #006d42;
}

.codeBlockFrame .tokenTag {
  color: #6d28d9;
}

:global([data-theme='dark']) .tokenKeyword,
:global([data-theme='dark']) .tokenValue {
  color: #ff77b9;
  color: color(display-p3 1 0.4667 0.7255);
}

:global([data-theme='dark']) .tokenFunction,
:global([data-theme='dark']) .tokenString {
  color: #e8a749;
  color: color(display-p3 0.9098 0.6549 0.2863);
}

:global([data-theme='dark']) .codeBlockFrame .tokenKeyword,
:global([data-theme='dark']) .codeBlockFrame .tokenValue,
:global([data-theme='dark']) .codeBlockFrame .tokenTag {
  color: #af7dff;
  color: color(display-p3 0.6863 0.4902 1);
}

:global([data-theme='dark']) .codeBlockFrame .tokenFunction,
:global([data-theme='dark']) .codeBlockFrame .tokenString,
:global([data-theme='dark']) .codeBlockFrame .tokenAttr {
  color: #54e8ae;
  color: color(display-p3 0.3294 0.9098 0.6824);
}

.copyFeedback {
  grid-column: 3;
  align-self: center;
  padding-right: var(--spacing-1);
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
  white-space: nowrap;
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
