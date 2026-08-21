import { resolveAvatarAssetName } from '@eds/desktop-components';
import type { InspectPropertyItem } from './buildElementInspectInfo';
import type { EdsPropExtractContext } from './edsInspectCatalog';
import {
  resolveIconHostElement,
  resolveIconName,
  type InspectCodeSection,
} from './buildIconInspect';

const AVATAR_GRAPHIC_ICON_NAME_RE = /^(eds-application-\d+|eds-business-\d+)$/i;

const AVATAR_SIZE_ORDER = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
type AvatarSizeName = (typeof AVATAR_SIZE_ORDER)[number];

const AVATAR_SIZE_TOKEN: Record<AvatarSizeName, string> = {
  xs: '--avatar-xs',
  sm: '--avatar-sm',
  md: '--avatar-md',
  lg: '--avatar-lg',
  xl: '--avatar-xl',
};

export function isAvatarGraphicAssetName(name: string | null | undefined): boolean {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return false;
  return AVATAR_GRAPHIC_ICON_NAME_RE.test(trimmed);
}

export function resolveAvatarGraphicIconName(
  element: Element,
  vueProps: Record<string, unknown> = {},
): string | null {
  const iconName = resolveIconName(element, vueProps);
  return isAvatarGraphicAssetName(iconName) ? iconName : null;
}

type VueInternal = {
  type?: { name?: string; __name?: string };
  parent?: VueInternal;
  props?: Record<string, unknown>;
  vnode?: { props?: Record<string, unknown> };
};

export function resolveAvatarHostElement(element: Element): HTMLElement | null {
  const host = element.closest('[data-avatar]') ?? element.closest('.eds-avatar');
  return host instanceof HTMLElement ? host : null;
}

function readAvatarVueInstance(element: Element): VueInternal | null {
  const host = resolveAvatarHostElement(element);
  if (!host) return null;
  const probe = host as HTMLElement & { __vueParentComponent?: VueInternal };
  let current = probe.__vueParentComponent;
  while (current) {
    const vueName = current.type?.name || current.type?.__name;
    if (vueName === 'Avatar' || vueName === 'EgAvatar') return current;
    current = current.parent;
  }
  return null;
}

function readAvatarVueProps(element: Element): Record<string, unknown> {
  const instance = readAvatarVueInstance(element);
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

function mergeAvatarProps(element: Element, vueProps: Record<string, unknown>): Record<string, unknown> {
  return { ...readAvatarVueProps(element), ...vueProps };
}

function resolveAvatarNameFromDataAttr(element: Element): string | null {
  const host = resolveAvatarHostElement(element);
  const name = host?.getAttribute('data-avatar')?.trim();
  return name || null;
}

export function resolveAvatarVariant(element: Element, vueProps: Record<string, unknown> = {}): string {
  const props = mergeAvatarProps(element, vueProps);
  return String(props.variant ?? 'initials');
}

export function resolveAvatarName(element: Element, vueProps: Record<string, unknown> = {}): string {
  const fromDataAttr = resolveAvatarNameFromDataAttr(element);
  if (fromDataAttr) return fromDataAttr;

  const iconAssetName = resolveAvatarGraphicIconName(element, vueProps);
  if (iconAssetName) return iconAssetName;

  const props = mergeAvatarProps(element, vueProps);
  return resolveAvatarAssetName({
    variant: props.variant === 'robot' ? 'robot' : 'initials',
    name: typeof props.name === 'string' ? props.name : undefined,
    colorSeed: typeof props.colorSeed === 'string' ? props.colorSeed : undefined,
    colorIndex: typeof props.colorIndex === 'number' ? props.colorIndex : undefined,
    randomColor: props.randomColor === true,
  });
}

export function deriveAvatarName(ctx: EdsPropExtractContext): string {
  const name = resolveAvatarName(ctx.element, ctx.props);
  return name || '—';
}

function isAvatarSizeName(value: string): value is AvatarSizeName {
  return (AVATAR_SIZE_ORDER as readonly string[]).includes(value);
}

export function resolveAvatarSize(element: Element, vueProps: Record<string, unknown> = {}): AvatarSizeName {
  const props = mergeAvatarProps(element, vueProps);
  const fromProps = String(props.size ?? '').trim();
  if (isAvatarSizeName(fromProps)) return fromProps;

  const host = resolveAvatarHostElement(element);
  if (host) {
    const width = getComputedStyle(host).width;
    const preview = host.closest('.app-preview') ?? host.closest('.desktopTokens') ?? document.documentElement;
    for (const size of AVATAR_SIZE_ORDER) {
      const token = AVATAR_SIZE_TOKEN[size];
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.width = `var(${token})`;
      preview.appendChild(probe);
      const computed = getComputedStyle(probe).width;
      preview.removeChild(probe);
      if (computed && computed === width) return size;
    }
  }

  return 'lg';
}

export function deriveAvatarSize(ctx: EdsPropExtractContext): string {
  return resolveAvatarSize(ctx.element, ctx.props);
}

function buildAvatarSizeCopyLine(size: AvatarSizeName): string {
  if (size === 'lg') return '';
  return `size="${size}"`;
}

function buildAvatarNameCopyLine(element: Element, vueProps: Record<string, unknown>, displayName: string): string {
  if (isAvatarGraphicAssetName(displayName)) {
    return `name="${displayName}"`;
  }
  const variant = resolveAvatarVariant(element, vueProps);
  if (variant === 'robot') return 'variant="robot"';
  if (displayName === '—') return '';
  return `name="${displayName}"`;
}

export function buildAvatarPropertyItems(
  element: Element,
  vueProps: Record<string, unknown>,
  rootElement: Element | null,
): InspectPropertyItem[] {
  const ctx: EdsPropExtractContext = { props: vueProps, element, rootElement };
  const displayName = deriveAvatarName(ctx);
  const size = resolveAvatarSize(element, vueProps);

  const items: InspectPropertyItem[] = [
    {
      label: '名称',
      value: displayName,
      token: null,
      copyLine: buildAvatarNameCopyLine(element, vueProps, displayName),
    },
    {
      label: '尺寸',
      value: size,
      token: AVATAR_SIZE_TOKEN[size],
      copyLine: buildAvatarSizeCopyLine(size),
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

export function buildAvatarCodeSections(element: Element): InspectCodeSection[] {
  const avatarHost = resolveAvatarHostElement(element);
  const iconHost = resolveAvatarGraphicIconName(element) ? resolveIconHostElement(element) : null;
  const host = avatarHost ?? iconHost;
  if (!host) return [];

  const svg =
    avatarHost?.querySelector('.eds-avatar-robot svg')
    ?? avatarHost?.querySelector('svg')
    ?? iconHost?.querySelector('.eds-icon svg')
    ?? iconHost?.querySelector('svg');

  const sections: InspectCodeSection[] = [];
  const svgContent = svg?.outerHTML?.trim() ?? '';
  if (svgContent) {
    sections.push({ title: 'SVG', content: formatSvgMultiline(svgContent) });
  }

  return sections;
}

export function buildAvatarUsageSnippet(element: Element, vueProps: Record<string, unknown>): string {
  const iconAssetName = resolveAvatarGraphicIconName(element, vueProps);
  if (iconAssetName) {
    const size = String(vueProps.size ?? 'md');
    const attrs = [`name="${iconAssetName}"`];
    if (size !== 'md') attrs.push(`size="${size}"`);
    if (vueProps.fit === true) attrs.push('fit');
    return `<EgIcon ${attrs.join(' ')} />`;
  }

  const displayName = resolveAvatarName(element, vueProps);
  const variant = resolveAvatarVariant(element, vueProps);
  const size = String(vueProps.size ?? 'lg');
  const attrs: string[] = [];

  if (variant === 'robot') {
    attrs.push('variant="robot"');
  } else if (displayName && displayName !== '—') {
    attrs.push(`name="${displayName}"`);
  }

  if (size !== 'lg') {
    attrs.push(`size="${size}"`);
  }

  return attrs.length > 0 ? `<EgAvatar ${attrs.join(' ')} />` : '<EgAvatar />';
}
