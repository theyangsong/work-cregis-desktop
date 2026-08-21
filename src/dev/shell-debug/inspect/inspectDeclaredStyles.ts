/** 本元素在 inline / author stylesheet 中声明过的 CSS 属性与原始值（特异性级联）。 */

import {
  inlineStyleSpecificity,
  maxMatchingSelectorSpecificity,
} from './inspectCssCascade';

export type DeclaredCssValues = Map<string, string>;

export type CollectDeclaredCssOptions = {
  /** 跳过 Dev Inspect 注入规则（如 cursor: crosshair）。 */
  excludeDevInspectRules?: boolean;
};

type CascadeEntry = {
  value: string;
  specificity: number;
  order: number;
};

const DEV_INSPECT_RULE_MARKERS = ['data-dev-inspect-active', 'data-dev-inspect-overlay'] as const;

const RUNTIME_INLINE_SKIP = new Set([
  'clip-path',
  '-webkit-clip-path',
]);

const SHORTHAND_EXPANSIONS: Record<string, readonly string[]> = {
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  border: [
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-width',
    'border-style',
    'border-color',
  ],
  background: ['background-color', 'background-image', 'background-size', 'background-position'],
  overflow: ['overflow-x', 'overflow-y'],
  'border-radius': [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
  ],
  'border-bottom': ['border-bottom-width', 'border-bottom-style', 'border-bottom-color'],
  font: ['font-size', 'font-weight', 'font-style', 'line-height', 'font-family'],
};

let cascadeOrderCounter = 0;

function isDevInspectRuleSelector(selector: string): boolean {
  return DEV_INSPECT_RULE_MARKERS.some((marker) => selector.includes(marker));
}

function shouldApplyCascadeEntry(property: string, next: CascadeEntry, current: CascadeEntry | undefined): boolean {
  if (!current) return true;
  if (next.specificity > current.specificity) return true;
  if (next.specificity < current.specificity) return false;
  return next.order > current.order;
}

function applyDeclaration(
  cascade: Map<string, CascadeEntry>,
  property: string,
  value: string,
  specificity: number,
) {
  const normalizedProp = property.trim().toLowerCase();
  const normalizedValue = value.trim();
  if (!normalizedProp || !normalizedValue) return;

  const entry: CascadeEntry = {
    value: normalizedValue,
    specificity,
    order: cascadeOrderCounter++,
  };

  const existing = cascade.get(normalizedProp);
  if (shouldApplyCascadeEntry(normalizedProp, entry, existing)) {
    cascade.set(normalizedProp, entry);
  }
}

function applyStyleDeclaration(
  cascade: Map<string, CascadeEntry>,
  style: CSSStyleDeclaration,
  specificity: number,
  options: { inline?: boolean },
) {
  for (let i = 0; i < style.length; i += 1) {
    const property = style[i];
    if (options.inline && RUNTIME_INLINE_SKIP.has(property.trim().toLowerCase())) continue;
    applyDeclaration(cascade, property, style.getPropertyValue(property), specificity);
  }
}

function isAuthorStylesheet(sheet: CSSStyleSheet): boolean {
  if (sheet.ownerNode instanceof Element) return true;
  return Boolean(sheet.href);
}

function collectFromRuleList(
  rules: CSSRuleList,
  element: Element,
  cascade: Map<string, CascadeEntry>,
  options: CollectDeclaredCssOptions,
) {
  for (const rule of rules) {
    if (rule instanceof CSSStyleRule) {
      if (options.excludeDevInspectRules && isDevInspectRuleSelector(rule.selectorText)) {
        continue;
      }

      const specificity = maxMatchingSelectorSpecificity(rule.selectorText, element);
      if (specificity === null) continue;

      applyStyleDeclaration(cascade, rule.style, specificity, {});
      continue;
    }

    if (rule instanceof CSSMediaRule) {
      if (typeof window !== 'undefined' && window.matchMedia(rule.conditionText).matches) {
        collectFromRuleList(rule.cssRules, element, cascade, options);
      }
      continue;
    }

    if (rule instanceof CSSSupportsRule) {
      try {
        if (CSS.supports(rule.conditionText)) {
          collectFromRuleList(rule.cssRules, element, cascade, options);
        }
      } catch {
        // ignore
      }
      continue;
    }

    if (rule instanceof CSSGroupingRule) {
      collectFromRuleList(rule.cssRules, element, cascade, options);
    }
  }
}

function finalizeCascade(cascade: Map<string, CascadeEntry>): DeclaredCssValues {
  const values: DeclaredCssValues = new Map();
  for (const [property, entry] of cascade) {
    values.set(property, entry.value);
  }
  return values;
}

/**
 * 收集点击元素自身声明过的 CSS（不含继承 / 祖先规则）。
 * 按特异性 + 文档顺序级联合并；inline style 优先级最高。
 */
export function collectDeclaredCssValues(
  element: Element,
  options: CollectDeclaredCssOptions = {},
): DeclaredCssValues {
  cascadeOrderCounter = 0;
  const cascade = new Map<string, CascadeEntry>();

  const doc = element.ownerDocument;
  if (doc) {
    for (const sheet of doc.styleSheets) {
      if (!isAuthorStylesheet(sheet)) continue;
      try {
        collectFromRuleList(sheet.cssRules, element, cascade, options);
      } catch {
        // cross-origin stylesheet
      }
    }
  }

  if (element instanceof HTMLElement || element instanceof SVGElement) {
    applyStyleDeclaration(cascade, element.style, inlineStyleSpecificity(), { inline: true });
  }

  return finalizeCascade(cascade);
}

export function isCssPropertyDeclared(values: DeclaredCssValues, property: string): boolean {
  const normalized = property.trim().toLowerCase();
  if (values.has(normalized)) return true;
  for (const [shorthand, longhands] of Object.entries(SHORTHAND_EXPANSIONS)) {
    if (!longhands.includes(normalized)) continue;
    if (values.has(shorthand)) return true;
  }
  return false;
}

export function isAnyCssPropertyDeclared(
  values: DeclaredCssValues,
  properties: readonly string[],
): boolean {
  return properties.some((property) => isCssPropertyDeclared(values, property));
}

/** 取本元素声明的原始值（优先 longhand，其次 shorthand）。 */
export function pickDeclaredCssValue(
  values: DeclaredCssValues,
  properties: readonly string[],
): string | null {
  for (const property of properties) {
    const normalized = property.trim().toLowerCase();
    const direct = values.get(normalized);
    if (direct) return direct;
  }

  for (const property of properties) {
    const normalized = property.trim().toLowerCase();
    for (const [shorthand, longhands] of Object.entries(SHORTHAND_EXPANSIONS)) {
      if (!longhands.includes(normalized)) continue;
      const shorthandValue = values.get(shorthand);
      if (shorthandValue) return shorthandValue;
    }
  }

  return null;
}

export function parseVarTokenName(value: string): string | null {
  const match = value.match(/var\(\s*(--[^),\s]+)/);
  return match?.[1] ?? null;
}

/** 声明值已是 var(--*) 时直接用于展示，避免 computed 反查误配。 */
export function formatAuthoredInspectValue(value: string): {
  display: string;
  token: string | null;
} {
  const trimmed = value.trim();
  const token = parseVarTokenName(trimmed);
  if (token) {
    return { display: trimmed.includes('var(') ? trimmed : `var(${token})`, token };
  }
  return { display: trimmed, token: null };
}

/** @deprecated 使用 collectDeclaredCssValues */
export type DeclaredCssIndex = DeclaredCssValues;

/** @deprecated 使用 collectDeclaredCssValues */
export function collectDeclaredCssProperties(element: Element): DeclaredCssValues {
  return collectDeclaredCssValues(element, { excludeDevInspectRules: true });
}
