import { iconNames } from '@eds/desktop-components';
import type { InspectPropertyItem } from './buildElementInspectInfo';
import type { EdsPropExtractContext } from './edsInspectCatalog';
import { formatTokenVar, resolveTokenNameForValue } from './resolveDesignToken';

function formatIconName(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  return raw.startsWith('eds-') ? raw : `eds-${raw}`;
}

export type InspectCodeSection = {
  title: string;
  content: string;
};

const ICON_SIZE_VAR: Record<string, string> = {
  sm: 'var(--icon-md)',
  md: 'var(--icon-lg)',
  lg: 'var(--icon-xl)',
};

type VueInternal = {
  type?: { name?: string; __name?: string };
  parent?: VueInternal;
  props?: Record<string, unknown>;
  vnode?: { props?: Record<string, unknown> };
};

export function resolveIconHostElement(element: Element): HTMLElement | null {
  const dataIcon = element.closest('[data-icon]');
  if (dataIcon instanceof HTMLElement) return dataIcon;
  const roleImg = element.closest('[role="img"]');
  if (roleImg instanceof HTMLElement) return roleImg;
  const edsIcon = element.closest('.eds-icon');
  const parent = edsIcon?.parentElement;
  if (parent instanceof HTMLElement) return parent;
  return element instanceof HTMLElement ? element : null;
}

function resolvePreviewRoot(element: Element): Element {
  return element.closest('.app-preview') ?? element.closest('.desktopTokens') ?? document.documentElement;
}

function readIconVueInstance(element: Element): VueInternal | null {
  const host = resolveIconHostElement(element);
  if (!host) return null;
  const probe = host as HTMLElement & { __vueParentComponent?: VueInternal };
  let current = probe.__vueParentComponent;
  while (current) {
    const vueName = current.type?.name || current.type?.__name;
    if (vueName === 'Icon' || vueName === 'EgIcon') return current;
    current = current.parent;
  }
  return null;
}

function readIconVueProps(element: Element): Record<string, unknown> {
  const instance = readIconVueInstance(element);
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

function resolveIconNameFromDataAttr(element: Element): string | null {
  const host = element.closest('[data-icon]');
  if (!(host instanceof HTMLElement)) return null;
  const name = host.getAttribute('data-icon')?.trim();
  return name || null;
}

function resolveIconNameFromIds(host: Element): string | null {
  const sorted = [...iconNames].sort((left, right) => right.length - left.length);
  const idNodes = host.querySelectorAll('[id]');
  for (const node of idNodes) {
    const id = node.id.trim();
    if (!id) continue;
    for (const candidate of sorted) {
      if (id === candidate || id.startsWith(`${candidate}-`)) {
        return candidate;
      }
    }
  }
  return null;
}

export function resolveIconName(element: Element, vueProps: Record<string, unknown> = {}): string | null {
  const fromDataAttr = resolveIconNameFromDataAttr(element);
  if (fromDataAttr) return fromDataAttr;

  const mergedProps = { ...readIconVueProps(element), ...vueProps };
  const fromProps = mergedProps.name;
  if (typeof fromProps === 'string' && fromProps.trim()) {
    return fromProps.trim();
  }

  const host = resolveIconHostElement(element);
  if (host) {
    const fromIds = resolveIconNameFromIds(host);
    if (fromIds) return fromIds;
  }

  return null;
}

export function deriveIconName(ctx: EdsPropExtractContext): unknown {
  return resolveIconName(ctx.element, ctx.props);
}

export function deriveIconSize(ctx: EdsPropExtractContext): unknown {
  const props = { ...readIconVueProps(ctx.element), ...ctx.props };
  if (props.fit === true) return 'fit';
  const size = String(props.size ?? 'md').trim();
  return size || 'md';
}

export function formatIconSizeToken(value: unknown): string {
  if (value === 'fit') return '100%';
  const size = String(value ?? 'md');
  return ICON_SIZE_VAR[size] ?? ICON_SIZE_VAR.md;
}

function resolveDimensionToken(preview: Element, raw: string): string {
  const normalized = raw.trim();
  if (!normalized) return '—';
  const token = resolveTokenNameForValue(preview, normalized, (name) => name.startsWith('--icon-') || name.startsWith('--scale-'));
  if (token) return formatTokenVar(token);
  const rounded = `${Math.round(Number.parseFloat(normalized) * 10) / 10}px`;
  return Number.isFinite(Number.parseFloat(normalized)) ? rounded : normalized;
}

export function deriveIconColorToken(ctx: EdsPropExtractContext): string {
  const preview = resolvePreviewRoot(ctx.element);
  const host = resolveIconHostElement(ctx.element);
  if (!host) return 'var(--stroke-base-secondary)';

  const style = getComputedStyle(host);
  const fillTone =
    (ctx.props.fillTone as string | undefined)
    ?? (readIconVueProps(ctx.element).fillTone as string | undefined)
    ?? 'primary';

  const colorCandidates = [style.color, style.stroke, style.fill].filter(Boolean);
  for (const candidate of colorCandidates) {
    const token = resolveTokenNameForValue(
      preview,
      candidate,
      (name) => name.startsWith('--stroke-') || name.startsWith('--text-'),
    );
    if (token) return formatTokenVar(token);
  }

  if (fillTone === 'brand') return 'var(--text-brand-primary)';
  return 'var(--stroke-base-secondary)';
}

export function buildIconPropertyItems(
  element: Element,
  vueProps: Record<string, unknown>,
  rootElement: Element | null,
): InspectPropertyItem[] {
  const ctx: EdsPropExtractContext = { props: vueProps, element, rootElement };
  const nameRaw = deriveIconName(ctx);
  const name = formatIconName(nameRaw);
  const sizeRaw = deriveIconSize(ctx);
  const size = formatIconSizeToken(sizeRaw);
  const color = deriveIconColorToken(ctx);

  const items: InspectPropertyItem[] = [
    {
      label: '名称',
      value: name,
      token: null,
      copyLine: name === '—' ? '' : `name="${name}"`,
    },
    {
      label: '尺寸',
      value: size,
      token: null,
      copyLine: sizeRaw === 'fit' ? 'width: 100%; height: 100%;' : `width: ${size}; height: ${size};`,
    },
    {
      label: '颜色',
      value: color,
      token: null,
      copyLine: `color: ${color};`,
    },
  ];

  return items.filter((item) => item.value !== '—');
}

function formatCssLine(property: string, value: string): string {
  return `${property}: ${value};`;
}

function formatSvgMultiline(svg: string): string {
  return svg
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

export function buildIconCodeSections(element: Element): InspectCodeSection[] {
  const preview = resolvePreviewRoot(element);
  const host = resolveIconHostElement(element);
  const svg = host?.querySelector('.eds-icon svg') ?? host?.querySelector('svg');
  const style = host ? getComputedStyle(host) : null;

  const width = style ? resolveDimensionToken(preview, style.width) : '—';
  const height = style ? resolveDimensionToken(preview, style.height) : '—';
  const layoutContent = [formatCssLine('width', width), formatCssLine('height', height)].join('\n');

  const svgContent = svg?.outerHTML?.trim() ?? '';

  const sections: InspectCodeSection[] = [
    { title: '布局', content: layoutContent },
  ];

  if (svgContent) {
    sections.push({ title: 'SVG', content: formatSvgMultiline(svgContent) });
  }

  return sections;
}
