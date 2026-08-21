import type { InspectPropertyItem } from './buildElementInspectInfo';
import {
  buildAvatarCodeSections,
  buildAvatarPropertyItems,
  buildAvatarUsageSnippet,
  isAvatarGraphicAssetName,
  resolveAvatarHostElement,
} from './buildAvatarInspect';
import {
  buildDividerCodeSections,
  buildDividerPropertyItems,
  buildDividerUsageSnippet,
  resolveDividerHostElement,
} from './buildDividerInspect';
import {
  buildCryptoCodeSections,
  buildCryptoPropertyItems,
  resolveCryptoHostElement,
  resolveCryptoName,
} from './buildCryptoInspect';
import {
  buildIconCodeSections,
  buildIconPropertyItems,
  resolveIconHostElement,
  resolveIconName,
  type InspectCodeSection,
} from './buildIconInspect';
import { canInspectAsText, formatDomTagInspectLabel, resolveTextInspect } from './buildTextInspect';
import {
  formatIconName,
  lookupEdsCatalogByDomClass,
  lookupEdsCatalogByVueName,
  type EdsInspectCatalogEntry,
  type EdsPropExtractContext,
  type EdsPropSpec,
} from './edsInspectCatalog';
import { resolveInspectPropLabel } from './inspectPropLabels';
import {
  findComponentRootOwner,
  findDirectDomCatalogEntry,
  findDsComponentRootInstance,
} from './inspectIdentity';
import {
  resolveEdsComponentRegion,
  type EdsComponentRegionMatch,
} from './edsInspectComponentRegions';
import { findAtomicGraphicHost } from './inspectNamingRules';
import { resolveInspectScopeRoot } from './inspectFloatLayerScope';
import { isInspectLayoutStylePropKey } from './inspectLayoutStyleProps';

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
  genericInspect?: EdsComponentInspect;
};

/** 统一规则的判定结果（顺序见 `inspectNamingRules.ts`）。 */
type InspectLayerIdentity =
  | { rule: 'atomic-graphic' | 'component-root'; candidate: ResolvedCandidate }
  | { rule: 'text-leaf' }
  | { rule: 'named-region'; region: EdsComponentRegionMatch }
  | { rule: 'dom-tag' };

export type InspectTargetResolution = {
  /** UI 只展示这一层名字。 */
  primaryLabel: string;
  /** 自内向外的组件链路（内部识别，不拼进标题）。 */
  componentChain: string[];
  edsComponent: EdsComponentInspect | null;
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

  return {};
}

function resolveCatalogForVueName(vueName: string | null | undefined): EdsInspectCatalogEntry | null {
  if (!vueName) return null;
  return lookupEdsCatalogByVueName(vueName) ?? lookupEdsCatalogByVueName(`Eg${vueName}`) ?? null;
}

function resolveCandidateInstance(
  element: Element,
  entry: EdsInspectCatalogEntry,
  candidate: VueComponentInternal,
  scopeRoot?: Element | null,
): VueComponentInternal {
  if (candidate && Object.keys(readVueProps(candidate)).length > 0) return candidate;

  for (const instance of walkVueChain(element)) {
    const vueName = resolveVueComponentName(instance);
    if (resolveCatalogForVueName(vueName) !== entry) continue;

    const root = resolveComponentRootElement(instance);
    if (scopeRoot instanceof Element) {
      if (root !== scopeRoot && !(root instanceof Element && scopeRoot.contains(root))) continue;
      if (!(root instanceof Element && (root === element || root.contains(element)))) continue;
    } else if (root instanceof Element) {
      if (root !== element && !root.contains(element)) continue;
    }
    return instance;
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

/** DS 组件 Vue 名 → 展示名（`EgFoo` / `Foo` 统一去前缀）。 */
function formatDsComponentDisplayName(vueName: string): string {
  return vueName.startsWith('Eg') ? vueName.slice(2) : vueName;
}

/**
 * 展示名唯一出口：catalog 的 `resolveDisplayName` hook 优先（同组件多 Figma 角色，
 * 如 Tooltip 的 `panelKind` → PopupBox / ContainerBox），否则用 `displayName`。
 */
function resolveEntryDisplayName(
  entry: EdsInspectCatalogEntry,
  props: Record<string, unknown>,
): string {
  return entry.resolveDisplayName?.(props) ?? entry.displayName;
}

function buildCatalogCandidate(
  entry: EdsInspectCatalogEntry,
  root: Element,
  element: Element,
): ResolvedCandidate {
  return {
    entry,
    vueName: entry.vueNames[0] ?? entry.displayName,
    instance: resolveCandidateInstance(element, entry, {}, root),
    rootElement: resolveInspectRootElement(entry, element, root),
  };
}

/** R1 原子图形宿主：`.eds-icon` / `.eds-crypto` / `.eds-avatar` 内一律归宿主组件。 */
function resolveAtomicGraphicCandidate(element: Element): ResolvedCandidate | null {
  const host = findAtomicGraphicHost(element);
  if (!host) return null;

  for (const className of host.classList) {
    const entry = lookupEdsCatalogByDomClass(className);
    if (entry) return buildCatalogCandidate(entry, host, element);
  }

  return null;
}

/**
 * R2 组件根，三级：
 * 1. 节点自身带 catalog `eds-*` 根类 → catalog 组件 + 精选 props
 * 2. 节点就是已入 catalog 的 DS 组件的 Vue DOM 根 → 同上
 * 3. 节点就是**任意** DS 包组件的 Vue DOM 根 → 组件自己的名字 + 通用 props
 *
 * 第 3 级保证「未入 catalog 的 DS 组件」也有自己的名字，不会退化成继承祖先名。
 */
function resolveComponentRootCandidate(element: Element): ResolvedCandidate | null {
  const domMatch = findDirectDomCatalogEntry(element);
  if (domMatch) {
    return buildCatalogCandidate(domMatch.entry, domMatch.root, element);
  }

  const owner = findComponentRootOwner(element);
  if (owner) {
    return {
      entry: owner.entry,
      vueName: resolveVueComponentName(owner.instance)
        ?? owner.entry.vueNames[0]
        ?? owner.entry.displayName,
      instance: owner.instance,
      rootElement: resolveInspectRootElement(owner.entry, element, owner.root),
    };
  }

  const dsRoot = findDsComponentRootInstance(element);
  if (dsRoot) {
    const inspect = buildGenericEdsInspect(dsRoot.vueName, dsRoot.instance)
      ?? buildNamedLayerInspect(formatDsComponentDisplayName(dsRoot.vueName), element);
    return {
      entry: {
        displayName: inspect.displayName,
        priority: 2,
        vueNames: [dsRoot.vueName],
        props: [],
      },
      vueName: dsRoot.vueName,
      instance: dsRoot.instance,
      rootElement: element,
      genericInspect: inspect,
    };
  }

  return null;
}

/**
 * 全站唯一命名入口 —— 规则按序判定，无逐组件特判。
 *
 * **一层一名**：每条分支只看 `element` **自己**是什么。
 * **【禁止】** 引入任何沿 `parentElement` / `closest` 取祖先名的分支 —— 那会让
 * 父级与子级同名（如 ToolBar 根与内部 `_functional_` 容器），属性与代码片段随之取错。
 * 点不到的父层由属性面板首行「祖先」交代（`resolveInspectAncestorName.ts`），不进名字。
 * 规则表与禁止事项见 `inspectNamingRules.ts`。
 */
function resolveInspectLayerIdentity(element: Element): InspectLayerIdentity {
  const graphic = resolveAtomicGraphicCandidate(element);
  if (graphic) return { rule: 'atomic-graphic', candidate: graphic };

  const componentRoot = resolveComponentRootCandidate(element);
  if (componentRoot) return { rule: 'component-root', candidate: componentRoot };

  if (canInspectAsText(element)) return { rule: 'text-leaf' };

  const region = resolveEdsComponentRegion(element);
  if (region) return { rule: 'named-region', region };

  return { rule: 'dom-tag' };
}

/**
 * 非组件根的具名层（R4 区域 / R5 继承）：只给名字与区域自有属性，
 * **不**复制所属组件的 Vue props —— props 只属于 R2 组件根。
 * 无属性时 `<EgX />` 用法块由面板自动隐藏。
 */
function buildNamedLayerInspect(
  displayName: string,
  element: Element,
  props: InspectPropertyItem[] = [],
): EdsComponentInspect {
  return {
    vueName: displayName,
    displayName,
    rootElement: element,
    props,
    usageSnippet: `<Eg${displayName} />`,
  };
}

function resolveInspectRootElement(
  entry: EdsInspectCatalogEntry,
  element: Element,
  domRoot: Element,
): Element | null {
  if (entry.displayName === 'Icon') {
    return resolveIconHostElement(element) ?? domRoot.parentElement ?? domRoot;
  }
  if (entry.displayName === 'Crypto') {
    return resolveCryptoHostElement(element) ?? domRoot.parentElement ?? domRoot;
  }
  if (entry.displayName === 'Avatar') {
    return resolveAvatarHostElement(element) ?? domRoot;
  }
  if (entry.displayName === 'Divider') {
    return resolveDividerHostElement(element) ?? domRoot;
  }
  return domRoot;
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
    if (isInspectLayoutStylePropKey(spec.key)) continue;
    if (DERIVED_PROPERTY_KEYS.has(spec.key)) continue;
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
const DERIVED_PROPERTY_KEYS = new Set(['text', 'displayText', 'tooltipText', 'content']);

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

  const catalogEntry = resolveCatalogForVueName(vueName);
  const displayName = catalogEntry
    ? resolveEntryDisplayName(catalogEntry, vueProps)
    : formatDsComponentDisplayName(vueName);
  const propItems: InspectPropertyItem[] = keys
    .filter((key) => !isInspectLayoutStylePropKey(key) && !DERIVED_PROPERTY_KEYS.has(key))
    .sort()
    .map((key) => {
    const value = formatGenericPropValue(vueProps[key]);
    return {
      label: resolveInspectPropLabel(key),
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
  if (candidate.genericInspect) {
    return candidate.genericInspect;
  }

  const scopeRoot = candidate.rootElement;
  const instance = resolveCandidateInstance(
    element,
    candidate.entry,
    candidate.instance,
    scopeRoot,
  );
  const vueProps = readVueProps(instance);
  const rootElement =
    candidate.entry.displayName === 'Icon'
      ? resolveIconHostElement(element) ?? candidate.rootElement
      : candidate.entry.displayName === 'Crypto'
        ? resolveCryptoHostElement(element) ?? candidate.rootElement
        : candidate.entry.displayName === 'Avatar'
          ? resolveAvatarHostElement(element) ?? candidate.rootElement
          : candidate.entry.displayName === 'Divider'
            ? resolveDividerHostElement(element) ?? candidate.rootElement
            : candidate.rootElement;

  if (candidate.entry.displayName === 'Icon') {
    const iconName = resolveIconName(element, vueProps);
    if (isAvatarGraphicAssetName(iconName)) {
      const iconRoot = resolveIconHostElement(element) ?? rootElement;
      return {
        vueName: candidate.vueName,
        displayName: 'Avatar',
        rootElement: iconRoot,
        props: buildAvatarPropertyItems(element, vueProps, iconRoot),
        codeSections: buildAvatarCodeSections(element),
        usageSnippet: buildAvatarUsageSnippet(element, vueProps),
      };
    }

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
      displayName: resolveEntryDisplayName(candidate.entry, vueProps),
      rootElement,
      props: nameRaw,
      codeSections: buildIconCodeSections(element),
      usageSnippet:
        usageAttrs.length > 0
          ? `<EgIcon ${usageAttrs.join(' ')} />`
          : '<EgIcon />',
    };
  }

  if (candidate.entry.displayName === 'Crypto') {
    const propItems = buildCryptoPropertyItems(element, vueProps, rootElement);
    const usageName = propItems.find((item) => item.label === '名称')?.value;
    const usageSize = vueProps.size ?? 'md';
    const usageAttrs = [
      usageName && usageName !== '—' ? `name="${usageName}"` : '',
      usageSize !== 'md' ? `size="${String(usageSize)}"` : '',
      vueProps.fit === true ? 'fit' : '',
    ].filter(Boolean);

    return {
      vueName: candidate.vueName,
      displayName: resolveEntryDisplayName(candidate.entry, vueProps),
      rootElement,
      props: propItems,
      codeSections: buildCryptoCodeSections(element),
      usageSnippet:
        usageAttrs.length > 0
          ? `<EgCrypto ${usageAttrs.join(' ')} />`
          : '<EgCrypto />',
    };
  }

  if (candidate.entry.displayName === 'Avatar') {
    const propItems = buildAvatarPropertyItems(element, vueProps, rootElement);

    return {
      vueName: candidate.vueName,
      displayName: resolveEntryDisplayName(candidate.entry, vueProps),
      rootElement,
      props: propItems,
      codeSections: buildAvatarCodeSections(element),
      usageSnippet: buildAvatarUsageSnippet(element, vueProps),
    };
  }

  if (candidate.entry.displayName === 'Divider') {
    const propItems = buildDividerPropertyItems(element, vueProps, rootElement);

    return {
      vueName: candidate.vueName,
      displayName: resolveEntryDisplayName(candidate.entry, vueProps),
      rootElement,
      props: propItems,
      codeSections: buildDividerCodeSections(element),
      usageSnippet: buildDividerUsageSnippet(element, vueProps),
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
    displayName: resolveEntryDisplayName(candidate.entry, vueProps),
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

function resolveLabelForIdentity(
  identity: InspectLayerIdentity,
  element: Element,
  preview: Element,
): Pick<InspectTargetResolution, 'primaryLabel' | 'edsComponent'> {
  switch (identity.rule) {
    case 'atomic-graphic':
    case 'component-root': {
      const edsComponent = buildFromCandidate(identity.candidate, element);
      return { primaryLabel: edsComponent.displayName, edsComponent };
    }
    case 'text-leaf':
      return { primaryLabel: 'Text', edsComponent: resolveTextInspect(element, preview) };
    case 'named-region': {
      const { spec } = identity.region;
      const edsComponent = buildNamedLayerInspect(
        spec.displayName,
        element,
        spec.buildProps?.(element),
      );
      return { primaryLabel: edsComponent.displayName, edsComponent };
    }
    case 'dom-tag':
      return {
        primaryLabel: formatDomTagInspectLabel(element.tagName),
        edsComponent: null,
      };
  }
}

function resolveInspectPrimaryLabelAndComponent(
  element: Element,
  preview: Element,
): Pick<InspectTargetResolution, 'primaryLabel' | 'edsComponent'> {
  return resolveLabelForIdentity(resolveInspectLayerIdentity(element), element, preview);
}

/**
 * **具名**层的名字（R1–R4）；纯 HTML 标签层（R5）返回 `null`。
 *
 * 只供属性面板首行「祖先」逐层向上找最近具名层用（`resolveInspectAncestorName.ts`）。
 * **【禁止】** 用它给被点击节点取名 —— 命名恒「点谁是谁」，祖先信息只作展示。
 */
export function resolveInspectNamedLayerLabel(element: Element, preview: Element): string | null {
  const identity = resolveInspectLayerIdentity(element);
  if (identity.rule === 'dom-tag') return null;
  return resolveLabelForIdentity(identity, element, preview).primaryLabel;
}

function resolveInspectLayerLabel(element: Element, preview: Element): string {
  return resolveInspectPrimaryLabelAndComponent(element, preview).primaryLabel;
}

function buildInspectComponentChain(element: Element, preview: Element): string[] {
  const scope = resolveInspectScopeRoot(element, preview);
  const chain: string[] = [];
  const seen = new Set<string>();
  let node: Element | null = element;

  while (node && scope.contains(node)) {
    const label = resolveInspectLayerLabel(node, preview);
    if (!seen.has(label)) {
      seen.add(label);
      chain.push(label);
    }
    node = node.parentElement;
  }

  return chain;
}

/** 点谁是谁：五条统一规则 + 单名展示；componentChain 沿 DOM 祖先逐层套用同一规则。 */
export function resolveInspectTarget(element: Element, preview: Element): InspectTargetResolution {
  const { primaryLabel, edsComponent } = resolveInspectPrimaryLabelAndComponent(element, preview);
  const componentChain = buildInspectComponentChain(element, preview);
  return { primaryLabel, componentChain, edsComponent };
}
