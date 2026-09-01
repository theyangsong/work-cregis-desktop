import type { InspectPropertyItem } from './buildElementInspectInfo';
import type { InspectCodeSection } from './buildIconInspect';
import { isShellDebugUiElement } from '../shellDebugUiScope';
import {
  collectDeclaredCssValues,
  formatAuthoredInspectValue,
  pickDeclaredCssValue,
} from './inspectDeclaredStyles';
import {
  formatTokenVar,
  inspectTokenFilters,
  requireInspectCssLine,
} from './resolveDesignToken';
import type { EdsComponentInspect } from './resolveEdsComponentInspect';
import {
  matchTypographyRole,
  resolveEffectiveTypographyMetrics,
  resolveTypographyMetricsForRole,
  isBarSubpixelTextHost,
  resolveTypographyLineHeightComment,
} from './typographyInspectMatch';

export function formatDomTagInspectLabel(tagName: string): string {
  const lower = tagName.toLowerCase();
  if (!lower) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** 仅 typography 叶子（span/p/label 等）；不含 td/div/button 等容器或组件根。 */
const TEXT_INSPECT_TAGS = new Set(['SPAN', 'P', 'LABEL', 'EM', 'STRONG', 'SMALL', 'TIME', 'A']);

export function isNativeTextInspectTag(tagName: string): boolean {
  return TEXT_INSPECT_TAGS.has(tagName.toUpperCase());
}

type VueComponentInternal = {
  parent?: VueComponentInternal;
  props?: Record<string, unknown>;
  vnode?: { props?: Record<string, unknown> };
  setupState?: Record<string, unknown>;
};

const FULL_TEXT_PROP_KEYS = ['text', 'tooltipText'] as const;

const NON_TEXT_TAGS = new Set(['SVG', 'IMG', 'INPUT', 'TEXTAREA', 'SELECT', 'VIDEO', 'CANVAS']);

const TEXT_INSPECT_BLOCKED_ROOT_CLASSES = [
  'eds-button',
  'eds-link',
  'eds-tag',
  'eds-module-menu-item',
  'eds-tab',
  'eds-icon-button',
  'eds-icon-button-pro',
] as const;

function hasBlockedTextInspectRootClass(element: Element): boolean {
  return TEXT_INSPECT_BLOCKED_ROOT_CLASSES.some((blocked) => element.classList.contains(blocked));
}

const TEXT_INSPECT_BLOCKED_ANCESTOR_SELECTORS =
  '.eds-button, .eds-link, .eds-tag, .eds-module-menu-item, .eds-tab, .eds-icon-button, .eds-icon-button-pro';

function hasTypographyClassHint(element: Element): boolean {
  return [...element.classList].some((name) =>
    /(?:^|_)text(?:Primary|Secondary|Small|Tabular)?(?:_|$)/.test(name)
    || name.includes('aliasLine')
    || name.includes('walletMetaAddress')
    || name.includes('metaSecondaryText'),
  );
}

function hasInteractiveLabelClassHint(element: Element): boolean {
  return [...element.classList].some((name) =>
    name.includes('itemLabel')
    || name.includes('moduleLabel')
    || name.includes('labelWrap')
    || name.includes('itemTitleText')
    || name.includes('itemValueText'),
  );
}

function isTypographyTextLeaf(element: Element, preview: Element): boolean {
  if (!isNativeTextInspectTag(element.tagName)) return false;
  if (hasBlockedTextInspectRootClass(element)) return false;
  if (isHiddenOverflowMeasureElement(element)) return false;
  if (!readDomTextContent(element)) return false;

  const style = getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (isBarSubpixelTextHost(element)) return true;
  if (matchTypographyRole(preview, element, style) != null) return true;
  return hasTypographyClassHint(element) || hasInteractiveLabelClassHint(element);
}

/** 交互组件内部的排版叶子仍判 Text；其余内层节点交给组件 inspect。 */
function isInsideBlockedTextInspectAncestor(element: Element, preview: Element): boolean {
  const host = element.closest(TEXT_INSPECT_BLOCKED_ANCESTOR_SELECTORS);
  if (!host || host === element) return false;
  if (isTypographyTextLeaf(element, preview)) return false;
  return true;
}

function isInsideTeleportedTooltipPanel(element: Element): boolean {
  return Boolean(element.closest('.eds-tooltip-panel, .eds-flotation-menu'));
}

function isHiddenOverflowMeasureElement(element: Element): boolean {
  if (element.getAttribute('aria-hidden') === 'true') return true;
  const style = getComputedStyle(element);
  return style.visibility === 'hidden' || style.opacity === '0';
}

/** Overflow / Tooltip 触发器上的可见排版文案（非 teleport 面板）。 */
function isOverflowTooltipTriggerTextLeaf(element: Element, preview: Element): boolean {
  if (isInsideTeleportedTooltipPanel(element)) return false;
  if (hasBlockedTextInspectRootClass(element)) return false;
  if (!isNativeTextInspectTag(element.tagName)) return false;
  if (isHiddenOverflowMeasureElement(element)) return false;
  if (!element.closest('.eds-hover-tooltip-trigger__target, .eds-hover-tooltip-trigger')) return false;
  if (!readDomTextContent(element)) return false;

  return isTypographyTextLeaf(element, preview);
}

function isTextInspectTarget(element: Element): boolean {
  if (!TEXT_INSPECT_TAGS.has(element.tagName)) return false;
  if (isBarSubpixelTextHost(element)) return true;
  if (hasBlockedTextInspectRootClass(element)) return false;
  return Boolean(readDomTextContent(element));
}

function isGraphicHostElement(element: Element): boolean {
  return (
    element.classList.contains('eds-icon')
    || element.classList.contains('eds-crypto')
    || element.classList.contains('eds-avatar')
    || element.classList.contains('eds-divider')
  );
}

function readVueProps(instance: VueComponentInternal): Record<string, unknown> {
  if (instance.props && typeof instance.props === 'object') {
    const keys = Object.keys(instance.props).filter((key) => !key.startsWith('_') && !key.startsWith('$'));
    if (keys.length > 0) {
      return Object.fromEntries(keys.map((key) => [key, instance.props![key]]));
    }
  }

  const vnodeProps = instance.vnode?.props;
  if (vnodeProps && typeof vnodeProps === 'object') {
    const raw: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(vnodeProps)) {
      if (key.startsWith('on') || key === 'key' || key === 'ref') continue;
      raw[key] = value;
    }
    if (Object.keys(raw).length > 0) return raw;
  }

  if (instance.setupState && typeof instance.setupState === 'object') {
    return { ...instance.setupState };
  }

  return {};
}

function walkVueChain(element: Element): VueComponentInternal[] {
  const chain: VueComponentInternal[] = [];
  const probe = element as Element & { __vueParentComponent?: VueComponentInternal };
  let current = probe.__vueParentComponent;
  while (current) {
    chain.push(current);
    current = current.parent;
  }
  return chain;
}

function normalizeInspectText(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function readDomTextContent(element: Element): string | null {
  const directText = [...element.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => normalizeInspectText(node.textContent ?? ''))
    .filter(Boolean)
    .join(' ');

  if (directText) return directText;

  const text = normalizeInspectText(element.textContent ?? '');
  return text || null;
}

/** 优先从 Vue props 取完整文案（如 OverflowText / AddressLine 的 text）。 */
function resolveFullInspectTextContent(element: Element): string | null {
  for (const instance of walkVueChain(element)) {
    const props = readVueProps(instance);
    for (const key of FULL_TEXT_PROP_KEYS) {
      const value = props[key];
      if (typeof value === 'string' && value.trim()) {
        return normalizeInspectText(value);
      }
    }
  }

  return readDomTextContent(element);
}

/** 选中 typography 叶子时返回 Text；td/div/button 等容器走 DS 组件或元素属性。 */
export function canInspectAsText(element: Element): boolean {
  if (isShellDebugUiElement(element)) {
    return false;
  }
  if (element.closest('.eds-avatar')) {
    return false;
  }
  if (NON_TEXT_TAGS.has(element.tagName) || isGraphicHostElement(element)) {
    return false;
  }
  if (hasBlockedTextInspectRootClass(element)) return false;
  if (isHiddenOverflowMeasureElement(element)) return false;

  const preview = element.closest('.app-preview') ?? element.closest('.desktopTokens') ?? document.documentElement;

  if (isOverflowTooltipTriggerTextLeaf(element, preview)) return true;
  if (!isNativeTextInspectTag(element.tagName)) return false;
  if (isInsideBlockedTextInspectAncestor(element, preview)) return false;
  if (!isTextInspectTarget(element)) return false;

  return isTypographyTextLeaf(element, preview);
}

export function resolveTextStyleLabel(
  preview: Element,
  element: Element,
  style: CSSStyleDeclaration,
): string {
  return matchTypographyRole(preview, element, style)?.label ?? '—';
}

function formatCssLine(property: string, value: string, comment?: string | null): string {
  if (comment) return `${property}: ${value}; /* ${comment} */`;
  return `${property}: ${value};`;
}

const TYPOGRAPHY_DECLARED_PROPS = [
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'font-style',
  'letter-spacing',
] as const;

function buildTypographyLinesFromDeclared(element: Element): string[] | null {
  const declared = collectDeclaredCssValues(element, { excludeDevInspectRules: true });
  const lines: string[] = [];

  for (const property of TYPOGRAPHY_DECLARED_PROPS) {
    const authored = pickDeclaredCssValue(declared, [property]);
    if (!authored) continue;
    const { display } = formatAuthoredInspectValue(authored);
    if (!display || display === 'normal') continue;
    lines.push(formatCssLine(property, display));
  }

  return lines.length > 0 ? lines : null;
}

function buildTextLayoutLines(preview: Element, element: Element, style: CSSStyleDeclaration): string[] {
  const lines: string[] = [];
  const display = style.display.trim();
  if (display && display !== 'inline' && display !== 'contents') {
    lines.push(formatCssLine('display', display));
  }

  if (isBarSubpixelTextHost(element)) {
    return lines;
  }

  const widthLine = requireInspectCssLine(
    preview,
    'width',
    style.width,
    (name) => inspectTokenFilters.spacing(name) || inspectTokenFilters.scale(name),
    'width',
  );
  if (widthLine && !widthLine.includes('auto') && !widthLine.includes('%')) {
    lines.push(widthLine);
  }

  return lines;
}

function buildTypographyLines(preview: Element, element: Element, style: CSSStyleDeclaration): string[] {
  const declaredLines = buildTypographyLinesFromDeclared(element);
  if (declaredLines) return declaredLines;

  const lines: string[] = [];
  const matchedRole = matchTypographyRole(preview, element, style);
  const effectiveMetrics = matchedRole
    ? resolveTypographyMetricsForRole(preview, matchedRole, style)
    : resolveEffectiveTypographyMetrics(style);

  const colorLine = requireInspectCssLine(
    preview,
    'color',
    style.color,
    inspectTokenFilters.textColor,
    'color',
  );
  if (colorLine) lines.push(colorLine);

  const fontFamilyLine = requireInspectCssLine(
    preview,
    'font-family',
    style.fontFamily,
    inspectTokenFilters.fontFamily,
    'fontFamily',
  );
  if (fontFamilyLine) lines.push(fontFamilyLine);

  if (matchedRole) {
    lines.push(formatCssLine('font-size', formatTokenVar(matchedRole.sizeToken)));
    lines.push(formatCssLine('font-weight', formatTokenVar(matchedRole.weightToken)));
    lines.push(
      formatCssLine(
        'line-height',
        formatTokenVar(matchedRole.lineHeightToken),
        resolveTypographyLineHeightComment(effectiveMetrics),
      ),
    );
    return lines;
  }

  const sizeLine = requireInspectCssLine(
    preview,
    'font-size',
    Number.isFinite(effectiveMetrics.fontSizePx) ? `${effectiveMetrics.fontSizePx}px` : style.fontSize,
    inspectTokenFilters.typographySize,
    'fontSize',
  );
  if (sizeLine) lines.push(sizeLine);

  const fontStyle = style.fontStyle.trim();
  if (fontStyle && fontStyle !== 'normal') {
    lines.push(formatCssLine('font-style', fontStyle));
  }

  const weightLine = requireInspectCssLine(
    preview,
    'font-weight',
    style.fontWeight,
    inspectTokenFilters.typographyWeight,
    'fontWeight',
  );
  if (weightLine) lines.push(weightLine);

  const lineHeightLine = requireInspectCssLine(
    preview,
    'line-height',
    Number.isFinite(effectiveMetrics.lineHeightPx)
      ? `${effectiveMetrics.lineHeightPx}px`
      : style.lineHeight,
    inspectTokenFilters.typographyLineHeight,
    'lineHeight',
  );
  if (lineHeightLine) lines.push(lineHeightLine);

  return lines;
}

export function buildTextPropertyItems(element: Element, preview: Element): InspectPropertyItem[] {
  const style = getComputedStyle(element);
  const text = resolveFullInspectTextContent(element) ?? '—';
  const styleLabel = resolveTextStyleLabel(preview, element, style);

  return [
    {
      label: '样式',
      value: styleLabel,
      token: null,
      copyLine: styleLabel === '—' ? '' : styleLabel,
    },
    {
      label: '文本',
      value: text,
      token: null,
      copyLine: text === '—' ? '' : text,
    },
  ].filter((item) => item.value !== '—');
}

export function buildTextCodeSections(element: Element, preview: Element): InspectCodeSection[] {
  const style = getComputedStyle(element);
  const sections: InspectCodeSection[] = [];

  const layoutLines = buildTextLayoutLines(preview, element, style);
  if (layoutLines.length > 0) {
    sections.push({ title: '布局', content: layoutLines.join('\n') });
  }

  const typographyLines = buildTypographyLines(preview, element, style);
  if (typographyLines.length > 0) {
    sections.push({ title: '字体排版', content: typographyLines.join('\n') });
  }

  return sections;
}

export function resolveTextInspect(element: Element, preview: Element): EdsComponentInspect | null {
  if (!canInspectAsText(element)) return null;

  return {
    vueName: 'Text',
    displayName: 'Text',
    rootElement: element,
    props: buildTextPropertyItems(element, preview),
    usageSnippet: '',
    codeSections: buildTextCodeSections(element, preview),
  };
}
