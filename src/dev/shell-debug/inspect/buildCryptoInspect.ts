import {
  formatCryptoDisplayName,
  resolveCryptoAssetKind,
  resolveCryptoFileName,
  type CryptoAssetKind,
  type CryptoName,
} from '@eds/desktop-components';
import type { InspectPropertyItem } from './buildElementInspectInfo';
import type { EdsPropExtractContext } from './edsInspectCatalog';
import type { InspectCodeSection } from './buildIconInspect';
import { inspectTokenFilters, requireInspectCssLine } from './resolveDesignToken';

type VueInternal = {
  type?: { name?: string; __name?: string };
  parent?: VueInternal;
  props?: Record<string, unknown>;
  vnode?: { props?: Record<string, unknown> };
};

export function resolveCryptoHostElement(element: Element): HTMLElement | null {
  const dataCrypto = element.closest('[data-crypto]');
  if (dataCrypto instanceof HTMLElement) return dataCrypto;
  const edsCrypto = element.closest('.eds-crypto');
  const parent = edsCrypto?.parentElement;
  if (parent instanceof HTMLElement) return parent;
  return element instanceof HTMLElement ? element : null;
}

function resolvePreviewRoot(element: Element): Element {
  return element.closest('.app-preview') ?? element.closest('.desktopTokens') ?? document.documentElement;
}

function readCryptoVueInstance(element: Element): VueInternal | null {
  const host = resolveCryptoHostElement(element);
  if (!host) return null;
  const probe = host as HTMLElement & { __vueParentComponent?: VueInternal };
  let current = probe.__vueParentComponent;
  while (current) {
    const vueName = current.type?.name || current.type?.__name;
    if (vueName === 'Crypto' || vueName === 'EgCrypto') return current;
    current = current.parent;
  }
  return null;
}

function readCryptoVueProps(element: Element): Record<string, unknown> {
  const instance = readCryptoVueInstance(element);
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

function resolveCryptoNameFromDataAttr(element: Element): string | null {
  const host = element.closest('[data-crypto]');
  if (!(host instanceof HTMLElement)) return null;
  const name = host.getAttribute('data-crypto')?.trim();
  return name || null;
}

export function resolveCryptoName(element: Element, vueProps: Record<string, unknown> = {}): string | null {
  const fromDataAttr = resolveCryptoNameFromDataAttr(element);
  if (fromDataAttr) return fromDataAttr;

  const mergedProps = { ...readCryptoVueProps(element), ...vueProps };
  const fromProps = mergedProps.name;
  if (typeof fromProps === 'string' && fromProps.trim()) {
    return fromProps.trim();
  }

  return null;
}

export function deriveCryptoType(ctx: EdsPropExtractContext): CryptoAssetKind {
  const name = resolveCryptoName(ctx.element, ctx.props);
  if (!name) return 'Crypto';
  return resolveCryptoAssetKind(name);
}

export function deriveCryptoDisplayName(ctx: EdsPropExtractContext): string {
  const name = resolveCryptoName(ctx.element, ctx.props);
  if (!name) return '—';
  return formatCryptoDisplayName(name);
}

function resolveCryptoRegistryName(element: Element, vueProps: Record<string, unknown>): CryptoName | null {
  const name = resolveCryptoName(element, vueProps);
  if (!name) return null;
  const fileName = resolveCryptoFileName(name);
  if (!fileName) return null;
  return fileName as CryptoName;
}

function resolveDimensionCssLine(preview: Element, property: string, raw: string): string | null {
  return requireInspectCssLine(preview, property, raw, inspectTokenFilters.graphic, 'width');
}

export function buildCryptoPropertyItems(
  element: Element,
  vueProps: Record<string, unknown>,
  rootElement: Element | null,
): InspectPropertyItem[] {
  const ctx: EdsPropExtractContext = { props: vueProps, element, rootElement };
  const registryName = resolveCryptoRegistryName(element, vueProps);
  const type = deriveCryptoType(ctx);
  const displayName = deriveCryptoDisplayName(ctx);

  const items: InspectPropertyItem[] = [
    {
      label: '类型',
      value: type,
      token: null,
      copyLine: '',
    },
    {
      label: '名称',
      value: displayName,
      token: null,
      copyLine: registryName ? `name="${displayName}"` : '',
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

export function buildCryptoCodeSections(element: Element): InspectCodeSection[] {
  const preview = resolvePreviewRoot(element);
  const host = resolveCryptoHostElement(element);
  const svg = host?.querySelector('.eds-crypto svg') ?? host?.querySelector('svg');
  const style = host ? getComputedStyle(host) : null;

  const width = style ? resolveDimensionCssLine(preview, 'width', style.width) : null;
  const height = style ? resolveDimensionCssLine(preview, 'height', style.height) : null;
  const layoutLines = [width, height].filter((line): line is string => Boolean(line));
  const layoutContent = layoutLines.join('\n');
  const svgContent = svg?.outerHTML?.trim() ?? '';

  const sections: InspectCodeSection[] = [];
  if (layoutContent) {
    sections.push({ title: '布局', content: layoutContent });
  }

  if (svgContent) {
    sections.push({ title: 'SVG', content: formatSvgMultiline(svgContent) });
  }

  return sections;
}
