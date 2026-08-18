import type { InspectCodeSection } from './buildIconInspect';
import { formatTokenVar, formatValueWithToken, resolveTokenNameForValue } from './resolveDesignToken';
import { resolveEdsComponentInspect } from './resolveEdsComponentInspect';

export type InspectPropertyItem = {
  label: string;
  value: string;
  token: string | null;
  copyLine: string;
};

export type InspectPropertyGroup = {
  id: string;
  label: string;
  items: InspectPropertyItem[];
};

export type ElementInspectInfo = {
  element: Element;
  label: string;
  tagName: string;
  domPath: string;
  classList: string[];
  edsComponentHints: string[];
  vueComponentName: string | null;
  edsComponent: ReturnType<typeof resolveEdsComponentInspect>;
  /** 非 DS 组件时展示的元素本身属性。 */
  elementAttributes: InspectPropertyItem[];
  rect: { width: number; height: number };
  code: {
    layout: InspectPropertyItem[];
    style: InspectPropertyItem[];
  };
  /** Icon 等组件专用：分块代码（布局 / SVG），不走 Tab。 */
  codeSections?: InspectCodeSection[];
  /** @deprecated Legacy grouped dump — prefer edsComponent + code */
  groups: InspectPropertyGroup[];
  copyBundle: string;
};

function roundPx(value: number): string {
  return `${Math.round(value * 10) / 10}px`;
}

function buildElementAttributes(
  element: Element,
  preview: Element,
  style: CSSStyleDeclaration,
  rect: DOMRect,
): InspectPropertyItem[] {
  const items: InspectPropertyItem[] = [];

  items.push({
    label: '尺寸',
    value: `${roundPx(rect.width)} × ${roundPx(rect.height)}`,
    token: null,
    copyLine: `size: ${roundPx(rect.width)} × ${roundPx(rect.height)}`,
  });

  items.push({
    label: '标签',
    value: element.tagName.toLowerCase(),
    token: null,
    copyLine: `tag: ${element.tagName.toLowerCase()}`,
  });

  if (element.id) {
    items.push({
      label: 'ID',
      value: element.id,
      token: null,
      copyLine: `#${element.id}`,
    });
  }

  const role = element.getAttribute('role');
  if (role) {
    items.push({
      label: 'Role',
      value: role,
      token: null,
      copyLine: `role="${role}"`,
    });
  }

  const edsClasses = [...element.classList].filter((name) => name.startsWith('eds-'));
  if (edsClasses.length > 0) {
    items.push({
      label: 'EDS 类名',
      value: edsClasses.join(' '),
      token: null,
      copyLine: edsClasses.map((name) => `.${name}`).join(' '),
    });
  }

  const textContent = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (textContent && textContent.length <= 80) {
    items.push({
      label: '文本',
      value: textContent,
      token: null,
      copyLine: `text: "${textContent}"`,
    });
  }

  const { display, token: displayToken } = formatValueWithToken(preview, style.display);
  if (display && display !== 'inline') {
    items.push({
      label: 'Display',
      value: displayToken ? formatTokenVar(displayToken) : display,
      token: displayToken,
      copyLine: `display: ${display};`,
    });
  }

  const fontSize = formatValueWithToken(preview, style.fontSize, (name) => name.startsWith('--eds-'));
  if (fontSize.token) {
    items.push({
      label: '字号',
      value: formatTokenVar(fontSize.token),
      token: fontSize.token,
      copyLine: `font-size: ${formatTokenVar(fontSize.token)};`,
    });
  }

  const color = formatValueWithToken(preview, style.color, (name) => name.startsWith('--text-'));
  if (color.token) {
    items.push({
      label: '颜色',
      value: formatTokenVar(color.token),
      token: color.token,
      copyLine: `color: ${formatTokenVar(color.token)};`,
    });
  }

  return items;
}

function buildDomPath(element: Element, root: Element): string {
  const segments: string[] = [];
  let node: Element | null = element;

  while (node && node !== root && node !== document.body) {
    let segment = node.tagName.toLowerCase();
    if (node.id) {
      segment += `#${node.id}`;
    } else if (node.classList.length > 0) {
      const cls = [...node.classList]
        .filter((name) => !name.startsWith('_'))
        .slice(0, 2)
        .join('.');
      if (cls) segment += `.${cls}`;
    }
    segments.unshift(segment);
    node = node.parentElement;
  }

  return segments.join(' > ');
}

function resolveVueComponentName(element: Element): string | null {
  type VueInternal = {
    type?: { name?: string; __name?: string };
    parent?: VueInternal;
  };
  const probe = element as Element & { __vueParentComponent?: VueInternal };
  let current = probe.__vueParentComponent;
  while (current) {
    const name = current.type?.name || current.type?.__name;
    if (name && !name.startsWith('Base')) {
      return name;
    }
    current = current.parent;
  }
  return null;
}

function readEdsComponentHints(element: Element): string[] {
  const hints = new Set<string>();
  for (const className of element.classList) {
    if (className.startsWith('eds-')) {
      hints.add(className);
    }
  }
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-eds-')) {
      hints.add(attr.name);
    }
  }
  return [...hints].sort();
}

function addLiteralCodeItem(
  items: InspectPropertyItem[],
  label: string,
  rawValue: string,
  cssProp?: string,
) {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === 'none' || trimmed === 'auto' || trimmed === 'normal') {
    return;
  }
  const cssName = cssProp ?? label;
  items.push({
    label,
    value: trimmed,
    token: null,
    copyLine: `${cssName}: ${trimmed};`,
  });
}

function addTokenCodeItem(
  preview: Element,
  items: InspectPropertyItem[],
  label: string,
  rawValue: string,
  cssProp?: string,
  filter?: (name: string) => boolean,
) {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === 'none' || trimmed === 'auto' || trimmed === 'normal') {
    return;
  }
  const token = resolveTokenNameForValue(preview, trimmed, filter);
  if (!token) return;

  const cssName = cssProp ?? label;
  const tokenVar = formatTokenVar(token);
  items.push({
    label,
    value: tokenVar,
    token,
    copyLine: `${cssName}: ${tokenVar};`,
  });
}

function addPaddingTokenItem(
  preview: Element,
  items: InspectPropertyItem[],
  style: CSSStyleDeclaration,
) {
  const spacingFilter = (name: string) => name.startsWith('--spacing-');
  const top = resolveTokenNameForValue(preview, style.paddingTop, spacingFilter);
  const right = resolveTokenNameForValue(preview, style.paddingRight, spacingFilter);
  const bottom = resolveTokenNameForValue(preview, style.paddingBottom, spacingFilter);
  const left = resolveTokenNameForValue(preview, style.paddingLeft, spacingFilter);

  if (!top || !right || !bottom || !left) return;

  let paddingValue: string;
  if (top === right && right === bottom && bottom === left) {
    paddingValue = formatTokenVar(top);
  } else if (top === bottom && left === right) {
    paddingValue = `${formatTokenVar(top)} ${formatTokenVar(right)}`;
  } else {
    paddingValue = [top, right, bottom, left].map(formatTokenVar).join(' ');
  }

  items.push({
    label: 'padding',
    value: paddingValue,
    token: top,
    copyLine: `padding: ${paddingValue};`,
  });
}

function buildUsefulCode(
  preview: Element,
  style: CSSStyleDeclaration,
): { layout: InspectPropertyItem[]; styleItems: InspectPropertyItem[] } {
  const layout: InspectPropertyItem[] = [];
  const styleItems: InspectPropertyItem[] = [];
  const spacingFilter = (name: string) => name.startsWith('--spacing-');

  addLiteralCodeItem(layout, 'display', style.display, 'display');
  addPaddingTokenItem(preview, layout, style);
  addTokenCodeItem(preview, layout, 'gap', style.gap, 'gap', spacingFilter);
  addLiteralCodeItem(layout, 'justify-content', style.justifyContent, 'justify-content');
  addLiteralCodeItem(layout, 'align-items', style.alignItems, 'align-items');

  addTokenCodeItem(preview, styleItems, 'border-radius', style.borderRadius, 'border-radius', (name) =>
    name.startsWith('--radius-'),
  );
  addTokenCodeItem(
    preview,
    styleItems,
    'background',
    style.backgroundColor,
    'background',
    (name) => name.startsWith('--material-') || name.startsWith('--box-') || name.startsWith('--event-'),
  );
  addTokenCodeItem(preview, styleItems, 'color', style.color, 'color', (name) => name.startsWith('--text-'));
  addTokenCodeItem(preview, styleItems, 'font-size', style.fontSize, 'font-size', (name) =>
    name.startsWith('--eds-'),
  );
  addTokenCodeItem(preview, styleItems, 'font-weight', style.fontWeight, 'font-weight', (name) =>
    name.startsWith('--weight-') || name.startsWith('--eds-'),
  );
  addTokenCodeItem(preview, styleItems, 'line-height', style.lineHeight, 'line-height', (name) =>
    name.startsWith('--eds-'),
  );

  return { layout, styleItems };
}

function buildLabel(info: {
  edsComponent: ReturnType<typeof resolveEdsComponentInspect>;
  vueComponentName: string | null;
  edsComponentHints: string[];
  tagName: string;
}): string {
  if (info.edsComponent) return info.edsComponent.displayName;
  if (info.vueComponentName) return info.vueComponentName;
  if (info.edsComponentHints[0]) return info.edsComponentHints[0];
  return info.tagName;
}

function buildCopyBundle(
  edsComponent: ReturnType<typeof resolveEdsComponentInspect>,
  elementAttributes: InspectPropertyItem[],
  code: { layout: InspectPropertyItem[]; style: InspectPropertyItem[] },
): string {
  const lines: string[] = [];
  const propertyItems = edsComponent?.props ?? elementAttributes;

  if (edsComponent) {
    lines.push(`/* ${edsComponent.displayName} */`);
    lines.push(edsComponent.usageSnippet);
    lines.push('');
  }

  if (propertyItems.length > 0) {
    for (const item of propertyItems) {
      lines.push(`${item.label}: ${item.value}`);
    }
    lines.push('');
  }

  if (code.layout.length > 0) {
    lines.push('/* 布局 */');
    for (const item of code.layout) {
      lines.push(item.copyLine);
    }
  }

  if (code.style.length > 0) {
    if (code.layout.length > 0) lines.push('');
    lines.push('/* 样式 */');
    for (const item of code.style) {
      lines.push(item.copyLine);
    }
  }

  return lines.join('\n').trim();
}

export function buildElementInspectInfo(
  element: Element,
  preview: Element,
): ElementInspectInfo | null {
  if (!preview.contains(element)) return null;
  if (element.closest('[data-shell-debug-ui]')) return null;

  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const vueComponentName = resolveVueComponentName(element);
  const edsComponentHints = readEdsComponentHints(element);
  const edsComponent = resolveEdsComponentInspect(element);
  const elementAttributes = buildElementAttributes(element, preview, style, rect);
  const tagName = element.tagName.toLowerCase();
  const domPath = buildDomPath(element, preview);
  const label = buildLabel({ edsComponent, vueComponentName, edsComponentHints, tagName });
  const usefulCode = buildUsefulCode(preview, style);

  const code = {
    layout: usefulCode.layout,
    style: usefulCode.styleItems,
  };
  const codeSections = edsComponent?.codeSections;

  return {
    element,
    label,
    tagName,
    domPath,
    classList: [...element.classList],
    edsComponentHints,
    vueComponentName,
    edsComponent,
    elementAttributes,
    rect: {
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
    },
    code,
    codeSections,
    groups: [],
    copyBundle: buildCopyBundle(edsComponent, elementAttributes, code),
  };
}
