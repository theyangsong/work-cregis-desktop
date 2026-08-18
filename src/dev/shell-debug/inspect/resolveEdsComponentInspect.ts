import type { InspectPropertyItem } from './buildElementInspectInfo';
import {
  buildIconCodeSections,
  buildIconPropertyItems,
  resolveIconHostElement,
  type InspectCodeSection,
} from './buildIconInspect';
import {
  formatIconName,
  lookupEdsCatalogByDomClass,
  lookupEdsCatalogByVueName,
  type EdsInspectCatalogEntry,
  type EdsPropExtractContext,
  type EdsPropSpec,
} from './edsInspectCatalog';

type VueComponentInternal = {
  type?: { name?: string; __name?: string };
  parent?: VueComponentInternal;
  props?: Record<string, unknown>;
  subTree?: { el?: Element | null };
  vnode?: { el?: Element | null };
};

export type EdsComponentInspect = {
  vueName: string;
  displayName: string;
  rootElement: Element | null;
  props: InspectPropertyItem[];
  usageSnippet: string;
  codeSections?: InspectCodeSection[];
};

type ResolvedCandidate = {
  entry: EdsInspectCatalogEntry;
  vueName: string;
  instance: VueComponentInternal;
  rootElement: Element | null;
};

function resolveVueComponentName(instance: VueComponentInternal): string | null {
  return instance.type?.name || instance.type?.__name || null;
}

function readVueProps(instance: VueComponentInternal): Record<string, unknown> {
  type Extended = VueComponentInternal & {
    props?: Record<string, unknown>;
    vnode?: { props?: Record<string, unknown> };
    setupState?: Record<string, unknown>;
  };
  const probe = instance as Extended;

  if (probe.props && typeof probe.props === 'object') {
    const keys = Object.keys(probe.props).filter((key) => !key.startsWith('_') && !key.startsWith('$'));
    if (keys.length > 0) {
      return Object.fromEntries(keys.map((key) => [key, probe.props![key]]));
    }
  }

  const vnodeProps = probe.vnode?.props;
  if (vnodeProps && typeof vnodeProps === 'object') {
    const raw: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(vnodeProps)) {
      if (key.startsWith('on') || key === 'key' || key === 'ref') continue;
      raw[key] = value;
    }
    if (Object.keys(raw).length > 0) return raw;
  }

  if (probe.setupState && typeof probe.setupState === 'object') {
    return { ...probe.setupState };
  }

  return {};
}

function resolveCandidateInstance(
  element: Element,
  entry: EdsInspectCatalogEntry,
  candidate: VueComponentInternal,
): VueComponentInternal {
  if (Object.keys(readVueProps(candidate)).length > 0) return candidate;

  for (const instance of walkVueChain(element)) {
    const vueName = resolveVueComponentName(instance);
    if (lookupEdsCatalogByVueName(vueName) === entry) {
      return instance;
    }
  }

  return candidate;
}

function resolveComponentRootElement(instance: VueComponentInternal): Element | null {
  const subTreeEl = instance.subTree?.el;
  if (subTreeEl instanceof Element) return subTreeEl;
  const vnodeEl = instance.vnode?.el;
  if (vnodeEl instanceof Element) return vnodeEl;
  return null;
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

function findDomCatalogEntry(element: Element): { entry: EdsInspectCatalogEntry; root: Element } | null {
  let node: Element | null = element;
  while (node) {
    for (const className of node.classList) {
      if (!className.startsWith('eds-')) continue;
      const entry = lookupEdsCatalogByDomClass(className);
      if (entry) {
        return { entry, root: node };
      }
    }
    node = node.parentElement;
  }
  return null;
}

function collectCandidates(element: Element): ResolvedCandidate[] {
  const candidates: ResolvedCandidate[] = [];
  const seen = new Set<EdsInspectCatalogEntry>();

  for (const instance of walkVueChain(element)) {
    const vueName = resolveVueComponentName(instance);
    const entry = lookupEdsCatalogByVueName(vueName);
    if (!entry || seen.has(entry)) continue;
    seen.add(entry);
    candidates.push({
      entry,
      vueName: vueName ?? entry.displayName,
      instance,
      rootElement: resolveComponentRootElement(instance),
    });
  }

  const domMatch = findDomCatalogEntry(element);
  if (domMatch && !seen.has(domMatch.entry)) {
    const rootElement =
      domMatch.entry.displayName === 'Icon'
        ? resolveIconHostElement(element) ?? domMatch.root.parentElement ?? domMatch.root
        : domMatch.root;
    candidates.push({
      entry: domMatch.entry,
      vueName: domMatch.entry.displayName,
      instance: {},
      rootElement,
    });
  }

  return candidates.sort((left, right) => right.entry.priority - left.entry.priority);
}

function formatPropValue(spec: EdsPropSpec, raw: unknown, props: Record<string, unknown>): string {
  if (spec.format) return spec.format(raw, props);
  if (raw === true) return '是';
  if (raw === false) return '否';
  if (raw == null || raw === '') return '—';
  return String(raw);
}

function isDefaultPropValue(spec: EdsPropSpec, raw: unknown): boolean {
  if (spec.defaultValue === undefined) return false;
  return raw === spec.defaultValue;
}

function readRawPropValue(
  spec: EdsPropSpec,
  vueProps: Record<string, unknown>,
  ctx: EdsPropExtractContext,
): unknown {
  const raw = spec.derive ? spec.derive(ctx) : vueProps[spec.key];
  if (raw !== undefined && raw !== null && raw !== '') return raw;
  if (spec.defaultValue !== undefined) return spec.defaultValue;
  return raw;
}

function extractPropItems(
  entry: EdsInspectCatalogEntry,
  vueProps: Record<string, unknown>,
  element: Element,
  rootElement: Element | null,
): InspectPropertyItem[] {
  const ctx: EdsPropExtractContext = { props: vueProps, element, rootElement };
  const items: InspectPropertyItem[] = [];

  for (const spec of entry.props) {
    if (spec.when && !spec.when(vueProps)) continue;

    const raw = readRawPropValue(spec, vueProps, ctx);
    const value = formatPropValue(spec, raw, vueProps);
    if (value === '—' && spec.defaultValue === undefined && !spec.derive) continue;

    items.push({
      label: spec.label,
      value,
      token: null,
      copyLine:
        spec.key === 'name' && entry.displayName === 'Icon'
          ? `name="${formatIconName(raw)}"`
          : `${spec.key}="${value === '是' ? 'true' : value === '否' ? 'false' : value}"`,
    });
  }

  return items;
}

const DERIVED_USAGE_LABELS = new Set(['文本', '显示图标']);

function buildUsageSnippet(
  entry: EdsInspectCatalogEntry,
  vueName: string,
  vueProps: Record<string, unknown>,
  element: Element,
  rootElement: Element | null,
): string {
  const componentTag = vueName.startsWith('Eg') ? vueName : `Eg${entry.displayName}`;
  const ctx: EdsPropExtractContext = { props: vueProps, element, rootElement };
  const attrs: string[] = [];

  for (const spec of entry.props) {
    if (spec.when && !spec.when(vueProps)) continue;
    if (DERIVED_USAGE_LABELS.has(spec.label)) continue;

    const raw = readRawPropValue(spec, vueProps, ctx);
    if (isDefaultPropValue(spec, raw)) continue;
    if (raw === false || raw == null || raw === '') continue;

    if (raw === true) {
      attrs.push(spec.key);
      continue;
    }

    const formatted = formatPropValue(spec, raw, vueProps);
    if (formatted === '—') continue;
    attrs.push(`${spec.key}="${formatted}"`);
  }

  const attrText = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
  return `<${componentTag}${attrText} />`;
}

function formatGenericPropValue(value: unknown): string {
  if (value === true) return '是';
  if (value === false) return '否';
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function buildGenericEdsInspect(
  vueName: string,
  instance: VueComponentInternal,
): EdsComponentInspect | null {
  const vueProps = readVueProps(instance);
  const keys = Object.keys(vueProps).filter((key) => !key.startsWith('_') && !key.startsWith('$'));
  if (keys.length === 0) return null;

  const displayName = vueName.startsWith('Eg') ? vueName.slice(2) : vueName;
  const propItems: InspectPropertyItem[] = keys.sort().map((key) => {
    const value = formatGenericPropValue(vueProps[key]);
    return {
      label: key,
      value,
      token: null,
      copyLine:
        value === '是'
          ? `${key}`
          : value === '否'
            ? ''
            : `${key}="${value}"`,
    };
  }).filter((item) => item.copyLine);

  if (propItems.length === 0) return null;

  const attrs = propItems
    .map((item) => item.copyLine)
    .filter(Boolean)
    .join(' ');

  return {
    vueName,
    displayName,
    rootElement: resolveComponentRootElement(instance),
    props: propItems,
    usageSnippet: attrs ? `<${vueName} ${attrs} />` : `<${vueName} />`,
  };
}

function buildFromCandidate(candidate: ResolvedCandidate, element: Element): EdsComponentInspect {
  const instance = resolveCandidateInstance(element, candidate.entry, candidate.instance);
  const vueProps = readVueProps(instance);
  const rootElement =
    candidate.entry.displayName === 'Icon'
      ? resolveIconHostElement(element) ?? candidate.rootElement
      : candidate.rootElement;

  if (candidate.entry.displayName === 'Icon') {
    const nameRaw = buildIconPropertyItems(element, vueProps, rootElement);
    const usageName = nameRaw.find((item) => item.label === '名称')?.value;
    const usageSize = vueProps.size ?? 'md';
    const usageAttrs = [
      usageName && usageName !== '—' ? `name="${usageName}"` : '',
      usageSize !== 'md' ? `size="${String(usageSize)}"` : '',
      vueProps.fit === true ? 'fit' : '',
    ].filter(Boolean);

    return {
      vueName: candidate.vueName,
      displayName: candidate.entry.displayName,
      rootElement,
      props: nameRaw,
      codeSections: buildIconCodeSections(element),
      usageSnippet:
        usageAttrs.length > 0
          ? `<EgIcon ${usageAttrs.join(' ')} />`
          : '<EgIcon />',
    };
  }

  const propItems = extractPropItems(
    candidate.entry,
    vueProps,
    element,
    rootElement,
  );

  return {
    vueName: candidate.vueName,
    displayName: candidate.entry.displayName,
    rootElement,
    props: propItems,
    usageSnippet: buildUsageSnippet(
      candidate.entry,
      candidate.vueName,
      vueProps,
      element,
      rootElement,
    ),
  };
}

export function resolveEdsComponentInspect(element: Element): EdsComponentInspect | null {
  const candidates = collectCandidates(element);
  if (candidates.length > 0) {
    const primary = buildFromCandidate(candidates[0], element);
    if (primary.props.length > 0) return primary;
  }

  for (const instance of walkVueChain(element)) {
    const vueName = resolveVueComponentName(instance);
    if (!vueName) continue;
    if (lookupEdsCatalogByVueName(vueName)) continue;
    if (!vueName.startsWith('Eg')) continue;
    const generic = buildGenericEdsInspect(vueName, instance);
    if (generic) return generic;
  }

  return null;
}
