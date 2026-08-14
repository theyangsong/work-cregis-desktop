import { formatValueWithToken, listDesignTokenNames } from './resolveDesignToken';

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
  rect: { width: number; height: number };
  groups: InspectPropertyGroup[];
  copyBundle: string;
};

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

function px(value: string): string {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return value;
  return `${Math.round(parsed * 10) / 10}px`;
}

function addItem(
  preview: Element,
  items: InspectPropertyItem[],
  label: string,
  rawValue: string,
  filter?: (name: string) => boolean,
) {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === 'none' || trimmed === 'auto' || trimmed === 'normal') {
    return;
  }
  const { display, token } = formatValueWithToken(preview, trimmed, filter);
  items.push({
    label,
    value: display,
    token,
    copyLine: token ? `${label}: ${token}` : `${label}: ${trimmed}`,
  });
}

function readBoxSide(
  preview: Element,
  style: CSSStyleDeclaration,
  prefix: 'padding' | 'margin',
): InspectPropertyItem[] {
  const top = style.getPropertyValue(`${prefix}-top`);
  const right = style.getPropertyValue(`${prefix}-right`);
  const bottom = style.getPropertyValue(`${prefix}-bottom`);
  const left = style.getPropertyValue(`${prefix}-left`);
  const same = top === right && right === bottom && bottom === left;

  const spacingFilter = (name: string) => name.startsWith('--spacing-');

  if (same) {
    const items: InspectPropertyItem[] = [];
    addItem(preview, items, prefix, top, spacingFilter);
    return items;
  }

  const items: InspectPropertyItem[] = [];
  addItem(preview, items, `${prefix}-top`, top, spacingFilter);
  addItem(preview, items, `${prefix}-right`, right, spacingFilter);
  addItem(preview, items, `${prefix}-bottom`, bottom, spacingFilter);
  addItem(preview, items, `${prefix}-left`, left, spacingFilter);
  return items;
}

function collectCssVariableItems(
  element: Element,
  preview: Element,
): InspectPropertyItem[] {
  const entries: InspectPropertyItem[] = [];
  const seen = new Set<string>();
  let node: Element | null = element;

  while (node && preview.contains(node)) {
    const style = getComputedStyle(node);
    for (let index = 0; index < style.length; index += 1) {
      const name = style[index];
      if (!name.startsWith('--') || seen.has(name)) continue;
      const value = style.getPropertyValue(name).trim();
      if (!value) continue;
      seen.add(name);
      entries.push({
        label: name,
        value,
        token: name,
        copyLine: `${name}: ${value}`,
      });
    }
    if (node === preview) break;
    node = node.parentElement;
  }

  return entries.sort((left, right) => left.label.localeCompare(right.label));
}

function buildLabel(info: {
  vueComponentName: string | null;
  edsComponentHints: string[];
  tagName: string;
}): string {
  if (info.vueComponentName) return info.vueComponentName;
  if (info.edsComponentHints[0]) return info.edsComponentHints[0];
  return info.tagName;
}

function buildCopyBundle(groups: InspectPropertyGroup[], meta: InspectPropertyItem[]): string {
  const lines = meta.map((item) => item.copyLine);
  for (const group of groups) {
    lines.push('');
    lines.push(`/* ${group.label} */`);
    for (const item of group.items) {
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
  const tagName = element.tagName.toLowerCase();
  const domPath = buildDomPath(element, preview);
  const label = buildLabel({ vueComponentName, edsComponentHints, tagName });

  const metaItems: InspectPropertyItem[] = [
    {
      label: 'Layer',
      value: label,
      token: null,
      copyLine: `layer: ${label}`,
    },
    {
      label: 'DOM',
      value: domPath,
      token: null,
      copyLine: `dom: ${domPath}`,
    },
  ];
  if (vueComponentName) {
    metaItems.push({
      label: 'Vue',
      value: vueComponentName,
      token: null,
      copyLine: `component: ${vueComponentName}`,
    });
  }

  const layoutItems: InspectPropertyItem[] = [
    {
      label: 'width',
      value: px(`${rect.width}px`),
      token: null,
      copyLine: `width: ${px(`${rect.width}px`)}`,
    },
    {
      label: 'height',
      value: px(`${rect.height}px`),
      token: null,
      copyLine: `height: ${px(`${rect.height}px`)}`,
    },
  ];
  addItem(preview, layoutItems, 'display', style.display);
  addItem(preview, layoutItems, 'gap', style.gap, (name) => name.startsWith('--spacing-'));
  addItem(preview, layoutItems, 'row-gap', style.rowGap, (name) => name.startsWith('--spacing-'));
  addItem(preview, layoutItems, 'column-gap', style.columnGap, (name) =>
    name.startsWith('--spacing-'),
  );
  layoutItems.push(...readBoxSide(preview, style, 'padding'));
  layoutItems.push(...readBoxSide(preview, style, 'margin'));

  const typographyItems: InspectPropertyItem[] = [];
  addItem(preview, typographyItems, 'font-size', style.fontSize, (name) =>
    name.startsWith('--eds-'),
  );
  addItem(preview, typographyItems, 'font-weight', style.fontWeight, (name) =>
    name.startsWith('--weight-') || name.startsWith('--eds-'),
  );
  addItem(preview, typographyItems, 'line-height', style.lineHeight, (name) =>
    name.startsWith('--eds-'),
  );
  addItem(preview, typographyItems, 'font-family', style.fontFamily);
  addItem(preview, typographyItems, 'color', style.color, (name) => name.startsWith('--text-'));

  const textContent = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (textContent && textContent.length <= 120) {
    typographyItems.unshift({
      label: 'text',
      value: textContent,
      token: null,
      copyLine: `text: "${textContent}"`,
    });
  }

  const fillItems: InspectPropertyItem[] = [];
  addItem(preview, fillItems, 'background', style.backgroundColor, (name) =>
    name.startsWith('--material-') || name.startsWith('--box-') || name.startsWith('--event-'),
  );
  addItem(preview, fillItems, 'border-radius', style.borderRadius, (name) =>
    name.startsWith('--radius-'),
  );
  addItem(preview, fillItems, 'border-width', style.borderTopWidth);
  addItem(preview, fillItems, 'border-color', style.borderTopColor, (name) =>
    name.startsWith('--text-') || name.startsWith('--material-'),
  );
  addItem(preview, fillItems, 'opacity', style.opacity);

  const cssVarItems = collectCssVariableItems(element, preview);

  const groups: InspectPropertyGroup[] = [
    { id: 'layout', label: 'Layout · Spacing', items: layoutItems },
    { id: 'typography', label: 'Typography · Text', items: typographyItems },
    { id: 'fill', label: 'Fill · Stroke', items: fillItems },
    {
      id: 'tokens',
      label: `CSS Variables (${listDesignTokenNames(preview).length} in scope)`,
      items: cssVarItems.slice(0, 24),
    },
  ].filter((group) => group.items.length > 0);

  return {
    element,
    label,
    tagName,
    domPath,
    classList: [...element.classList],
    edsComponentHints,
    vueComponentName,
    rect: {
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
    },
    groups,
    copyBundle: buildCopyBundle(groups, metaItems),
  };
}
