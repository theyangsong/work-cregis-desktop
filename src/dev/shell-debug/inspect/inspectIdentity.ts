/**
 * R2 组件根判定 —— 见 `inspectNamingRules.ts` 的五条统一规则。
 *
 * **【禁止】** 子树借名：DS 组件只在「节点自身带 catalog `eds-*` 根类」或
 * 「节点就是该组件的 Vue DOM 根」时才算 owner。内层普通容器走 R4 / R5。
 */
import {
  lookupEdsCatalogByDomClass,
  lookupEdsCatalogByVueName,
  type EdsInspectCatalogEntry,
} from './edsInspectCatalog';
import { isStructuralEdsDomClass } from './edsInspectStructuralDom';

export type VueComponentInternal = {
  type?: { name?: string; __name?: string };
  parent?: VueComponentInternal;
  props?: Record<string, unknown>;
  subTree?: { el?: Element | null };
  vnode?: { el?: Element | null };
};

export type VueCatalogOwnerMatch = {
  entry: EdsInspectCatalogEntry;
  instance: VueComponentInternal;
  root: Element;
  depth: number;
};

function resolveVueComponentName(instance: VueComponentInternal): string | null {
  return instance.type?.name || instance.type?.__name || null;
}

export function resolveComponentRootElement(instance: VueComponentInternal): Element | null {
  const subTreeEl = instance.subTree?.el;
  if (subTreeEl instanceof Element) return subTreeEl;
  const vnodeEl = instance.vnode?.el;
  if (vnodeEl instanceof Element) return vnodeEl;
  return null;
}

export function walkVueChain(element: Element): VueComponentInternal[] {
  const chain: VueComponentInternal[] = [];
  const probe = element as Element & { __vueParentComponent?: VueComponentInternal };
  let current = probe.__vueParentComponent;
  while (current) {
    chain.push(current);
    current = current.parent;
  }
  return chain;
}

function resolveCatalogForVueName(vueName: string | null | undefined): EdsInspectCatalogEntry | null {
  if (!vueName) return null;
  return lookupEdsCatalogByVueName(vueName) ?? lookupEdsCatalogByVueName(`Eg${vueName}`) ?? null;
}

export function measureInspectOwnerDepth(from: Element, root: Element): number {
  let depth = 0;
  let node: Element | null = from;
  while (node) {
    if (node === root) return depth;
    node = node.parentElement;
    depth += 1;
  }
  return Number.POSITIVE_INFINITY;
}

/** 节点**自身**的 catalog `eds-*` 根类（不向上冒泡）。 */
export function findDirectDomCatalogEntry(
  element: Element,
): { entry: EdsInspectCatalogEntry; root: Element } | null {
  let best: { entry: EdsInspectCatalogEntry; root: Element } | null = null;

  for (const className of element.classList) {
    if (!className.startsWith('eds-')) continue;
    if (isStructuralEdsDomClass(className)) continue;
    const entry = lookupEdsCatalogByDomClass(className);
    if (!entry || entry.domClass !== className) continue;
    if (!best || entry.priority > best.entry.priority) {
      best = { entry, root: element };
    }
  }

  return best;
}

/**
 * 节点**就是**某已入 catalog 的 DS 组件的 Vue DOM 根时返回该组件。
 * 子树内节点一律不匹配 —— 这是全站统一「点谁是谁」的关键约束。
 */
export function findComponentRootOwner(element: Element): VueCatalogOwnerMatch | null {
  for (const instance of walkVueChain(element)) {
    const root = resolveComponentRootElement(instance);
    if (root !== element) continue;

    const entry = resolveCatalogForVueName(resolveVueComponentName(instance));
    if (entry) return { entry, instance, root, depth: 0 };
  }

  return null;
}

/** DS 组件源码位置标记（dev 下 plugin-vue 注入 `__file`）。 */
const DS_COMPONENT_FILE_MARKER = 'eds-desktop/packages/components/';

/** 该实例是否为 DS 包组件（build 下 `__file` 缺失时回退 catalog 名）。 */
function isDsPackageInstance(instance: VueComponentInternal): boolean {
  const file = (instance.type as { __file?: unknown } | undefined)?.__file;
  if (typeof file === 'string') return file.includes(DS_COMPONENT_FILE_MARKER);
  return Boolean(resolveCatalogForVueName(resolveVueComponentName(instance)));
}

/**
 * 节点是否为**任意** DS 包组件的 Vue DOM 根（含未入 catalog 的 33 个内部组件）。
 * 未入 catalog 只意味着「没有精选 props」，**不应**让它退化成继承祖先名 —— 那会
 * 让 `CryptoAddress` / `Verify` / `MinerFee*Panel` 等与外层弹窗重名。
 */
export function findDsComponentRootInstance(
  element: Element,
): { vueName: string; instance: VueComponentInternal } | null {
  for (const instance of walkVueChain(element)) {
    const root = resolveComponentRootElement(instance);
    if (root !== element) continue;

    const vueName = resolveVueComponentName(instance);
    if (!vueName) continue;
    if (!isDsPackageInstance(instance) && !vueName.startsWith('Eg')) continue;

    return { vueName, instance };
  }
  return null;
}
