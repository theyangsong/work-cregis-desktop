#!/usr/bin/env node
/**
 * Dev Inspect Effect 语义类 —— 不变量校验。
 *
 * E1 effectSemanticSpec 含 primaryToken + layoutSnippet
 * E2 样式一行 class · token；布局仅关键片段
 * E3 buildTooltipUsageSnippet 始终含 panelKind
 * E4 buildInspectCodeSections effect 区块优先于 declared
 * E5 catalog panelKind=flotation → FlotationBox
 * E6 语法色单一真源：shellDebugInspectCodeTokens.css 的全局类，无容器分支 / inline style
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const inspectDir = join(repoRoot, 'src/dev/shell-debug/inspect');
const read = (name) => readFileSync(join(inspectDir, name), 'utf8');

const errors = [];
const fail = (id, msg) => errors.push(`${id} ${msg}`);

const specSource = read('effectSemanticSpec.ts');
const effectSource = read('buildEffectSemanticInspect.ts');
const sectionsSource = read('buildInspectCodeSections.ts');
const catalogSource = read('edsInspectCatalog.ts');

if (!specSource.includes('primaryToken')) {
  fail('E1', 'effectSemanticSpec 须含 primaryToken');
}
if (!specSource.includes('layoutSnippet')) {
  fail('E1', 'effectSemanticSpec 须含 layoutSnippet');
}
if (!specSource.includes('formatEffectSemanticStyleLine')) {
  fail('E2', '须导出 formatEffectSemanticStyleLine');
}
if (!specSource.includes('formatEffectSemanticLayoutLines')) {
  fail('E2', '须导出 formatEffectSemanticLayoutLines');
}
if (effectSource.includes('/* 覆盖 */')) {
  fail('E2', '样式区不应再输出 /* 覆盖 */ 块');
}
if (!effectSource.includes('formatEffectSemanticStyleLine')) {
  fail('E2', 'buildEffectSemanticInspect 须用一行样式');
}
if (!specSource.includes('formatEffectSemanticCssBlock')) {
  fail('E2', '须导出 formatEffectSemanticCssBlock');
}
if (!specSource.includes('parseEffectSemanticClassFromStyleLine')) {
  fail('E2', '须导出 parseEffectSemanticClassFromStyleLine');
}

const panelSource = readFileSync(join(inspectDir, 'InspectDetailPanel.vue'), 'utf8');
if (!panelSource.includes('EgAnchoredTooltip')) {
  fail('E2', 'InspectDetailPanel 须用 Tooltip 展示 Effect 参数');
}

const highlightSource = readFileSync(join(inspectDir, 'inspectCodeHighlight.ts'), 'utf8');
if (!highlightSource.includes("'effectClass'")) {
  fail('E2', 'Effect class 须用 effectClass token + 虚线下划线');
}
if (!specSource.includes('class=".${spec.className}"')) {
  fail('E2', '样式区须输出 class=".effect-*"');
}

// E6 语法色单一真源：Popover 代码块与 teleport 出去的 tooltip 共用同一条 CSS 声明。
const tokenCssPath = join(inspectDir, 'shellDebugInspectCodeTokens.css');
/** 注释里会写「禁止 …」的反例，只校验真实声明。 */
const tokenCss = readFileSync(tokenCssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

for (const banned of [
  'inspectCodeTokenStyle',
  'inspectEffectSpecTokenStyle',
  'inspectCodeSyntaxLiteralColor',
  'INSPECT_CODE_SYNTAX_LITERAL',
]) {
  if (highlightSource.includes(banned)) {
    fail('E6', `按容器取色的旁路残留：${banned}（色值只许留在 shellDebugInspectCodeTokens.css）`);
  }
}
if (!highlightSource.includes('inspectCodeTokenClass')) {
  fail('E6', 'inspectCodeTokenClass 是语法色唯一入口，不得移除');
}
if (/:style="(?:effectSpec|inspectCode)/.test(panelSource)) {
  fail('E6', 'InspectDetailPanel 不得用 inline style 给 code token 上色');
}
if (/--dev-inspect-syntax-/.test(tokenCss)) {
  fail('E6', '禁止用只在容器上声明的 --dev-inspect-syntax-* 中间变量（teleport 后变量链断裂）');
}
if (/!important/.test(tokenCss)) {
  fail('E6', '语法色规则不得用 !important 给单个容器补色');
}
if (/(?:\[data-effect-spec-panel\]|\.shell-debug-effect-spec-tooltip)[^\n{]*\.dev-inspect-code-token/.test(tokenCss)) {
  fail('E6', '语法色规则不得带容器前缀，否则 tooltip 与 Popover 会分叉');
}
if (!panelSource.includes('shellDebugInspectCodeTokens.css')) {
  fail('E6', 'InspectDetailPanel 须直接 import 语法色真源 CSS');
}
if (/\.token(?:Keyword|Value|Function|String|Attr|Tag|Comment|Prop)\s*[,{]/.test(panelSource)) {
  fail('E6', 'InspectDetailPanel <style module> 不得再声明 token 颜色');
}

if (!effectSource.includes('panelKind=')) {
  fail('E3', 'buildTooltipUsageSnippet 须含 panelKind');
}

if (!sectionsSource.includes('buildEffectSemanticCodeSections')) {
  fail('E4', 'buildInspectCodeSections 须消费 effect 语义区块');
}

if (!catalogSource.includes("flotation: 'FlotationBox'")) {
  fail('E5', 'Tooltip panelKind=flotation 须映射 FlotationBox');
}

if (errors.length > 0) {
  console.error('verify-shell-debug-inspect-effect: FAILED');
  for (const line of errors) console.error(`  ${line}`);
  process.exit(1);
}

console.log('verify-shell-debug-inspect-effect: OK — 6 项 Effect 不变量');
