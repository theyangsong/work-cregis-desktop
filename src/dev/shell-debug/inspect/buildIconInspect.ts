import { getProcessedIcon, iconNames, type IconName } from '@eds/desktop-components';
import type { InspectPropertyItem } from './buildElementInspectInfo';
import type { EdsPropExtractContext } from './edsInspectCatalog';
import { formatTokenVar, inspectTokenFilters, requireInspectCssLine, resolveTokenNameForValue } from './resolveDesignToken';

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
  return null;
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

function resolveIconRegistryName(element: Element, vueProps: Record<string, unknown>): IconName | null {
  const name = resolveIconName(element, vueProps);
  if (!name) return null;
  const normalized = formatIconName(name);
  if (normalized === '—') return null;
  if (!iconNames.includes(normalized as IconName)) return null;
  return normalized as IconName;
}

export function isBorderStrokeIcon(ctx: EdsPropExtractContext): boolean {
  const iconName = resolveIconRegistryName(ctx.element, ctx.props);
  if (iconName) {
    const processed = getProcessedIcon(iconName);
    if (processed) {
      if (processed.colorMode !== 'token') return false;
      return processed.kind === 'stroke' || processed.kind === 'mixed';
    }
  }

  const host = resolveIconHostElement(ctx.element);
  if (!host) return false;
  return Boolean(host.querySelector('.eds-i-s'));
}

function resolveStrokeWidthToken(preview: Element, rawValue: string): string | null {
  const normalized = rawValue.trim();
  if (!normalized) return null;

  const varMatch = normalized.match(/var\((--[\w-]+)\)/);
  if (varMatch?.[1]?.startsWith('--stroke-')) {
    return varMatch[1];
  }

  return resolveTokenNameForValue(
    preview,
    normalized,
    inspectTokenFilters.stroke,
  );
}

export function deriveIconBorderToken(ctx: EdsPropExtractContext): string | null {
  if (!isBorderStrokeIcon(ctx)) return null;

  const host = resolveIconHostElement(ctx.element);
  if (!host) return null;

  const preview = resolvePreviewRoot(ctx.element);
  const strokeScreenVar = getComputedStyle(host).getPropertyValue('--eds-icon-stroke-screen').trim();
  const strokeScreenToken = resolveStrokeWidthToken(preview, strokeScreenVar);
  if (strokeScreenToken) return formatTokenVar(strokeScreenToken);

  const strokeShape = host.querySelector('.eds-i-s');
  if (strokeShape instanceof Element) {
    const strokeWidthToken = resolveStrokeWidthToken(
      preview,
      getComputedStyle(strokeShape).strokeWidth,
    );
    if (strokeWidthToken) return formatTokenVar(strokeWidthToken);
  }

  return formatTokenVar('--stroke-lg');
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

function resolveDimensionCssLine(preview: Element, property: string, raw: string): string | null {
  return requireInspectCssLine(preview, property, raw, inspectTokenFilters.graphic, 'width');
}

export function deriveIconColorToken(ctx: EdsPropExtractContext): string {
  const preview = resolvePreviewRoot(ctx.element);
  const host = resolveIconHostElement(ctx.element);
  if (!host) return '—';

  const style = getComputedStyle(host);
  const colorCandidates = [style.color, style.stroke, style.fill].filter(Boolean);
  for (const candidate of colorCandidates) {
    const line = requireInspectCssLine(
      preview,
      'color',
      candidate,
      (name) => inspectTokenFilters.stroke(name) || inspectTokenFilters.textColor(name),
      'color',
    );
    if (line?.startsWith('color: var(')) {
      return line.replace(/^color:\s*/, '').replace(/;$/, '');
    }
  }

  const first = colorCandidates[0]?.trim();
  if (!first) return '—';
  return `${first} /* 非 token */`;
}

type MotionClassRule = {
  matches: (element: Element) => boolean;
  hostClass: string;
};

/** Motion semantic class — 对齐 eds-desktop motion/semantic.json。 */
const MOTION_CLASS_RULES: MotionClassRule[] = [
  {
    matches: (element) => element.classList.contains('motion-ease') && element.classList.contains('is-asym'),
    hostClass: '.motion-ease.is-asym',
  },
  {
    matches: (element) =>
      element.classList.contains('motion-ease') && element.classList.contains('is-hover-enter-only'),
    hostClass: '.motion-ease.is-hover-enter-only',
  },
  {
    matches: (element) => element.classList.contains('motion-ease') && element.classList.contains('is-focus'),
    hostClass: '.motion-ease.is-focus',
  },
  {
    matches: (element) => element.classList.contains('motion-ease') && element.classList.contains('is-hover'),
    hostClass: '.motion-ease.is-hover',
  },
  {
    matches: (element) =>
      element.classList.contains('motion-flotation') && element.classList.contains('is-active'),
    hostClass: '.motion-flotation.is-active',
  },
  {
    matches: (element) => element.classList.contains('motion-flotation'),
    hostClass: '.motion-flotation',
  },
  {
    matches: (element) => element.classList.contains('motion-layout') && element.classList.contains('is-active'),
    hostClass: '.motion-layout.is-active',
  },
  {
    matches: (element) => element.classList.contains('motion-layout'),
    hostClass: '.motion-layout',
  },
  {
    matches: (element) => element.classList.contains('motion-deform'),
    hostClass: '.motion-deform',
  },
  {
    matches: (element) => element.classList.contains('motion-page'),
    hostClass: '.motion-page',
  },
  {
    matches: (element) => element.classList.contains('motion-layout-deform'),
    hostClass: '.motion-layout-deform',
  },
];

const MOTION_BASE_CLASS_RULES: MotionClassRule[] = [
  { matches: (element) => element.classList.contains('motion-ease'), hostClass: '.motion-ease' },
  { matches: (element) => element.classList.contains('motion-flotation'), hostClass: '.motion-flotation' },
  { matches: (element) => element.classList.contains('motion-layout'), hostClass: '.motion-layout' },
  { matches: (element) => element.classList.contains('motion-deform'), hostClass: '.motion-deform' },
  { matches: (element) => element.classList.contains('motion-page'), hostClass: '.motion-page' },
  {
    matches: (element) => element.classList.contains('motion-layout-deform'),
    hostClass: '.motion-layout-deform',
  },
];

export function resolveMotionSemanticClass(element: Element): string | null {
  if (element.classList.contains('motion-none')) return '.motion-none';

  for (const rule of MOTION_CLASS_RULES) {
    if (rule.matches(element)) return rule.hostClass;
  }

  if (element.classList.contains('motion-flotation') && element.classList.contains('is-active')) {
    return '.motion-flotation.is-active';
  }
  if (element.classList.contains('motion-layout') && element.classList.contains('is-active')) {
    return '.motion-layout.is-active';
  }

  if (element.classList.contains('motion-deform')) return '.motion-deform';
  if (element.classList.contains('motion-page')) return '.motion-page';
  if (element.classList.contains('motion-layout-deform')) return '.motion-layout-deform';
  if (element.classList.contains('motion-flotation')) return '.motion-flotation';
  if (element.classList.contains('motion-layout')) return '.motion-layout';

  return null;
}

function isMotionInteractionBlocked(element: Element): boolean {
  if (element instanceof HTMLButtonElement && element.disabled) return true;
  if (element instanceof HTMLInputElement && element.disabled) return true;
  if (element.getAttribute('aria-disabled') === 'true') return true;
  return false;
}

export function formatMotionInspectLabel(hostClass: string | null): string {
  if (!hostClass) return '无';
  return hostClass;
}

export function buildMotionPropertyItem(motion: string): InspectPropertyItem {
  return {
    label: '动效',
    value: motion,
    token: null,
    copyLine: motion === '无' ? '' : motion,
  };
}

/** 仅当前点击节点自身的 motion semantic class；不继承祖先/行级 motion。 */
export function deriveInspectMotion(element: Element, _preview?: Element): string {
  if (isMotionInteractionBlocked(element)) return '无';
  return formatMotionInspectLabel(resolveMotionSemanticClass(element));
}

/** @deprecated 与 deriveInspectMotion 相同；保留 catalog derive 签名。 */
export function deriveTextMotionToken(element: Element): string {
  return deriveInspectMotion(element);
}

export function deriveIconMotionToken(ctx: EdsPropExtractContext): string {
  return deriveInspectMotion(ctx.element);
}

export function buildIconPropertyItems(
  element: Element,
  vueProps: Record<string, unknown>,
  rootElement: Element | null,
): InspectPropertyItem[] {
  const ctx: EdsPropExtractContext = { props: vueProps, element, rootElement };
  const nameRaw = deriveIconName(ctx);
  const name = formatIconName(nameRaw);

  const items: InspectPropertyItem[] = [
    {
      label: '名称',
      value: name,
      token: null,
      copyLine: name === '—' ? '' : `name="${name}"`,
    },
  ];

  return items.filter((item) => item.value !== '—');
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
  const ctx: EdsPropExtractContext = {
    props: readIconVueProps(element),
    element,
    rootElement: host,
  };

  const width = style ? resolveDimensionCssLine(preview, 'width', style.width) : null;
  const height = style ? resolveDimensionCssLine(preview, 'height', style.height) : null;
  const layoutLines = [width, height].filter((line): line is string => Boolean(line));
  const layoutContent = layoutLines.join('\n');

  const border = deriveIconBorderToken(ctx);
  const color = deriveIconColorToken(ctx);
  const styleLines = [
    border ? `--eds-icon-stroke-screen: ${border};` : '',
    color && color !== '—' ? `color: ${color};` : '',
  ].filter(Boolean);
  const styleContent = styleLines.join('\n');

  const svgContent = svg?.outerHTML?.trim() ?? '';

  const sections: InspectCodeSection[] = [];
  if (layoutContent) {
    sections.push({ title: '布局', content: layoutContent });
  }

  if (styleContent) {
    sections.push({ title: '样式', content: styleContent });
  }

  if (svgContent) {
    sections.push({ title: 'SVG', content: formatSvgMultiline(svgContent) });
  }

  return sections;
}
