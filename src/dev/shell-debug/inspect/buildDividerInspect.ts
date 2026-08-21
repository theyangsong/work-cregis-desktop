import type { InspectPropertyItem } from './buildElementInspectInfo';
import type { EdsPropExtractContext } from './edsInspectCatalog';
import type { InspectCodeSection } from './buildIconInspect';
import {
  formatTokenVar,
  inspectTokenFilters,
  requireInspectCssLine,
  resolveTokenNameForValue,
} from './resolveDesignToken';

export type DividerType = 'module' | 'page' | 'navigator';
export type DividerDirection = 'horizontal' | 'vertical';

type VueInternal = {
  type?: { name?: string; __name?: string };
  parent?: VueInternal;
  props?: Record<string, unknown>;
  vnode?: { props?: Record<string, unknown> };
};

const DIVIDER_TYPE_BACKGROUND: Record<DividerType, string> = {
  module: '--stroke-divider-module',
  page: '--stroke-divider-page',
  navigator: '--stroke-base-quaternary',
};

export function resolveDividerHostElement(element: Element): HTMLElement | null {
  const host = element.closest('.eds-divider');
  return host instanceof HTMLElement ? host : null;
}

function resolvePreviewRoot(element: Element): Element {
  return element.closest('.app-preview') ?? element.closest('.desktopTokens') ?? document.documentElement;
}

function readDividerVueInstance(element: Element): VueInternal | null {
  const host = resolveDividerHostElement(element);
  if (!host) return null;
  const probe = host as HTMLElement & { __vueParentComponent?: VueInternal };
  let current = probe.__vueParentComponent;
  while (current) {
    const vueName = current.type?.name || current.type?.__name;
    if (vueName === 'Divider' || vueName === 'EgDivider') return current;
    current = current.parent;
  }
  return null;
}

function readDividerVueProps(element: Element): Record<string, unknown> {
  const instance = readDividerVueInstance(element);
  if (!instance) return {};

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

  return {};
}

function mergeDividerProps(element: Element, vueProps: Record<string, unknown>): Record<string, unknown> {
  return { ...readDividerVueProps(element), ...vueProps };
}

function resolveDividerTypeFromStyle(preview: Element, host: HTMLElement): DividerType | null {
  const style = getComputedStyle(host);
  const token = resolveTokenNameForValue(preview, style.backgroundColor, inspectTokenFilters.stroke, 'backgroundColor');
  if (!token) return null;

  for (const [type, strokeToken] of Object.entries(DIVIDER_TYPE_BACKGROUND) as Array<[DividerType, string]>) {
    if (token === strokeToken) return type;
  }

  return null;
}

export function resolveDividerType(element: Element, vueProps: Record<string, unknown> = {}): DividerType {
  const props = mergeDividerProps(element, vueProps);
  const fromProps = String(props.type ?? '').trim();
  if (fromProps === 'module' || fromProps === 'page' || fromProps === 'navigator') {
    return fromProps;
  }

  const host = resolveDividerHostElement(element);
  if (host) {
    const fromStyle = resolveDividerTypeFromStyle(resolvePreviewRoot(element), host);
    if (fromStyle) return fromStyle;
  }

  return 'module';
}

export function resolveDividerDirection(element: Element, vueProps: Record<string, unknown> = {}): DividerDirection {
  const props = mergeDividerProps(element, vueProps);
  const fromProps = String(props.direction ?? '').trim();
  if (fromProps === 'horizontal' || fromProps === 'vertical') {
    return fromProps;
  }

  const host = resolveDividerHostElement(element);
  if (host) {
    const ariaOrientation = host.getAttribute('aria-orientation');
    if (ariaOrientation === 'vertical' || ariaOrientation === 'horizontal') {
      return ariaOrientation;
    }

    const rect = host.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return rect.width <= rect.height ? 'vertical' : 'horizontal';
    }
  }

  return 'horizontal';
}

export function deriveDividerType(ctx: EdsPropExtractContext): DividerType {
  return resolveDividerType(ctx.element, ctx.props);
}

export function deriveDividerDirection(ctx: EdsPropExtractContext): DividerDirection {
  return resolveDividerDirection(ctx.element, ctx.props);
}

function formatCssLine(property: string, value: string): string {
  return `${property}: ${value};`;
}

function buildDividerLayoutLines(preview: Element, host: HTMLElement, direction: DividerDirection): string[] {
  const style = getComputedStyle(host);
  const lines: string[] = [];
  const strokeFilter = (name: string) => inspectTokenFilters.stroke(name) || inspectTokenFilters.scale(name);

  if (direction === 'vertical') {
    const widthLine = requireInspectCssLine(preview, 'width', style.width, strokeFilter, 'width');
    if (widthLine) lines.push(widthLine);

    if (style.height.trim() === '100%' || style.height.trim().endsWith('%')) {
      lines.push(formatCssLine('height', '100%'));
    } else {
      const heightLine = requireInspectCssLine(preview, 'height', style.height, inspectTokenFilters.scale, 'height');
      if (heightLine) lines.push(heightLine);
    }

    if (style.alignSelf.trim() && style.alignSelf.trim() !== 'auto') {
      lines.push(formatCssLine('align-self', style.alignSelf.trim()));
    }
  } else {
    if (style.width.trim() === '100%' || style.width.trim().endsWith('%')) {
      lines.push(formatCssLine('width', '100%'));
    } else {
      const widthLine = requireInspectCssLine(preview, 'width', style.width, inspectTokenFilters.scale, 'width');
      if (widthLine) lines.push(widthLine);
    }

    const heightLine = requireInspectCssLine(preview, 'height', style.height, strokeFilter, 'height');
    if (heightLine) lines.push(heightLine);
  }

  return lines;
}

function buildDividerStyleLines(preview: Element, host: HTMLElement, type: DividerType): string[] {
  const style = getComputedStyle(host);
  const lines: string[] = [];
  const backgroundLine = requireInspectCssLine(
    preview,
    'background',
    style.backgroundColor,
    inspectTokenFilters.stroke,
    'backgroundColor',
  );
  if (backgroundLine) {
    lines.push(backgroundLine);
  } else {
    lines.push(formatCssLine('background', formatTokenVar(DIVIDER_TYPE_BACKGROUND[type])));
  }

  return lines;
}

export function buildDividerPropertyItems(
  element: Element,
  vueProps: Record<string, unknown>,
  rootElement: Element | null,
): InspectPropertyItem[] {
  const ctx: EdsPropExtractContext = { props: vueProps, element, rootElement };
  const type = deriveDividerType(ctx);
  const direction = deriveDividerDirection(ctx);

  return [
    {
      label: '类型',
      value: type,
      token: null,
      copyLine: type === 'module' ? '' : `type="${type}"`,
    },
    {
      label: '方向',
      value: direction,
      token: null,
      copyLine: direction === 'horizontal' ? '' : `direction="${direction}"`,
    },
  ];
}

export function buildDividerUsageSnippet(element: Element, vueProps: Record<string, unknown>): string {
  const props = mergeDividerProps(element, vueProps);
  const type = resolveDividerType(element, vueProps);
  const direction = resolveDividerDirection(element, vueProps);
  const attrs: string[] = [];

  if (type !== 'module') attrs.push(`type="${type}"`);
  if (direction !== 'horizontal') attrs.push(`direction="${direction}"`);
  if (props.hide === true) attrs.push('hide');

  return attrs.length > 0 ? `<EgDivider ${attrs.join(' ')} />` : '<EgDivider />';
}

export function buildDividerCodeSections(element: Element): InspectCodeSection[] {
  const host = resolveDividerHostElement(element);
  if (!host) return [];

  const preview = resolvePreviewRoot(element);
  const type = resolveDividerType(element);
  const direction = resolveDividerDirection(element);
  const layoutLines = buildDividerLayoutLines(preview, host, direction);
  const styleLines = buildDividerStyleLines(preview, host, type);
  const sections: InspectCodeSection[] = [];

  if (layoutLines.length > 0) {
    sections.push({ title: '布局', content: layoutLines.join('\n') });
  }

  if (styleLines.length > 0) {
    sections.push({ title: '样式', content: styleLines.join('\n') });
  }

  return sections;
}
