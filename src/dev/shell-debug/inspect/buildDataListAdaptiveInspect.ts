import { Fragment, type VNode } from 'vue';
import {
  getVisibleColumnSlotIndices,
  resolveColumnMinWidthPx,
} from '@eds/desktop-components/organisms/data-list/useResponsiveColumns';
import { lookupEdsCatalogByVueName } from './edsInspectCatalog';
import type { InspectPropertyItem } from './buildElementInspectInfo';
import { resolveComponentRootElement, walkVueChain, type VueComponentInternal } from './inspectIdentity';

const DATA_LIST_ROOT_SELECTOR = '.eds-data-list';
const SELECT_COLUMN_WIDTH_PX = 40;
const DATA_LIST_INSPECT_EXCLUDE_SELECTORS = '.eds-popup, .eds-detail';

type VueInternal = VueComponentInternal & {
  props?: Record<string, unknown>;
  setupState?: Record<string, unknown>;
  slots?: Record<string, (...args: unknown[]) => VNode[]>;
  ctx?: { slots?: Record<string, (...args: unknown[]) => VNode[]> };
};

export type DataListColumnAdaptiveConfig = {
  minWidth?: string;
  width?: string;
  flexGrow?: boolean;
};

function readSetupRef<T>(setupState: Record<string, unknown>, key: string): T | undefined {
  const raw = setupState[key];
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return (raw as { value: T }).value;
  }
  return raw as T | undefined;
}

function readProp(
  propsBag: Record<string, unknown> | null | undefined,
  key: string,
  fallback?: unknown,
): unknown {
  if (!propsBag) return fallback;
  if (Object.prototype.hasOwnProperty.call(propsBag, key)) return propsBag[key];
  const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
  if (Object.prototype.hasOwnProperty.call(propsBag, kebab)) return propsBag[kebab];
  return fallback;
}

function isPresentAttr(value: unknown): boolean {
  return value === true || value === '';
}

function resolveVueComponentName(instance: VueInternal): string | null {
  return instance.type?.name || instance.type?.__name || null;
}

function isDataListInstance(instance: VueInternal): boolean {
  const vueName = resolveVueComponentName(instance);
  if (!vueName) return false;
  if (vueName === 'DataList' || vueName === 'EgDataList') return true;
  return lookupEdsCatalogByVueName(vueName)?.displayName === 'DataList';
}

function instanceOwnsDataListRoot(instance: VueInternal, dataListRoot: HTMLElement): boolean {
  const root = resolveComponentRootElement(instance);
  if (!(root instanceof Element)) return false;
  return root === dataListRoot || root.contains(dataListRoot);
}

function resolveDataListVueInstance(probe: Element, dataListRoot: HTMLElement): VueInternal | null {
  const starts = new Set<Element>([probe, dataListRoot]);
  let el: Element | null = dataListRoot.parentElement;
  while (el) {
    starts.add(el);
    el = el.parentElement;
  }

  for (const start of starts) {
    for (const instance of walkVueChain(start)) {
      if (!isDataListInstance(instance)) continue;
      if (instanceOwnsDataListRoot(instance, dataListRoot)) {
        return instance;
      }
    }
  }

  return null;
}

function columnTypeName(node: VNode): string | undefined {
  const type = node.type as { name?: string; __name?: string } | string | null | undefined;
  if (type == null || typeof type === 'string') return undefined;
  return type.name || type.__name;
}

function isDataListColumnVNode(node: VNode): boolean {
  const name = columnTypeName(node);
  return name === 'EgDataListColumn' || name === 'TableListColumn';
}

function flattenSlotVNodes(nodes: VNode[] | undefined): VNode[] {
  if (!nodes?.length) return [];
  const out: VNode[] = [];
  for (const node of nodes) {
    if (node.type === Fragment && Array.isArray(node.children)) {
      out.push(...flattenSlotVNodes(node.children as VNode[]));
      continue;
    }
    out.push(node);
  }
  return out;
}

function readDefaultSlotVNodes(instance: VueInternal): VNode[] {
  const slots = instance.slots ?? instance.ctx?.slots;
  const render = slots?.default;
  if (typeof render !== 'function') return [];
  try {
    return flattenSlotVNodes(render());
  } catch {
    return [];
  }
}

function columnIsAction(
  propsBag: Record<string, unknown>,
  isLast: boolean,
  hasPrimaryAction: boolean,
): boolean {
  if (isPresentAttr(readProp(propsBag, 'isAction'))) return true;
  return isLast && hasPrimaryAction;
}

function mapVNodeColumnConfig(node: VNode): DataListColumnAdaptiveConfig {
  const propsBag = (node.props || {}) as Record<string, unknown>;
  return {
    minWidth: readProp(propsBag, 'minWidth') as string | undefined,
    width: readProp(propsBag, 'width') as string | undefined,
    flexGrow: Boolean(readProp(propsBag, 'flexGrow')),
  };
}

/** 与 DataList.computeRestDataColumnWidthsPx 的 flex 判定一致。 */
export function isDataListColumnFlexParticipant(
  columns: DataListColumnAdaptiveConfig[],
  index: number,
): boolean {
  if (columns.length === 0) return false;
  const col = columns[index];
  if (!col || col.width) return false;

  const lastIndex = columns.length - 1;
  const trailingIsFlex = Boolean(columns[lastIndex]?.flexGrow);
  if (!trailingIsFlex && index === lastIndex) return false;

  return true;
}

function formatDeclaredMinWidth(minWidth?: string): string {
  const px = resolveColumnMinWidthPx(minWidth);
  return `${px}px`;
}

function buildAdaptiveValue(minWidth: string | undefined, flex: boolean): string {
  const base = `min-width: ${formatDeclaredMinWidth(minWidth)}`;
  return flex ? `${base}（flex）` : base;
}

function mapSetupColumns(
  columns: Array<{
    minWidth?: string;
    width?: string;
    flexGrow?: boolean;
  }>,
): DataListColumnAdaptiveConfig[] {
  return columns.map((column) => ({
    minWidth: column.minWidth,
    width: column.width,
    flexGrow: column.flexGrow,
  }));
}

function readColumnsFromSetupState(instance: VueInternal): DataListColumnAdaptiveConfig[] | null {
  const setupState = instance.setupState;
  if (!setupState) return null;

  for (const key of ['headerColumns', 'bodyColumns'] as const) {
    const columns = readSetupRef<
      Array<{
        minWidth?: string;
        width?: string;
        flexGrow?: boolean;
      }>
    >(setupState, key);
    if (columns?.length) {
      return mapSetupColumns(columns);
    }
  }

  const visibleNodes = readSetupRef<VNode[]>(setupState, 'visibleColumnNodes');
  if (visibleNodes?.length) {
    const mapped = visibleNodes
      .filter((node) => isDataListColumnVNode(node))
      .map((node) => mapVNodeColumnConfig(node));
    if (mapped.length > 0) return mapped;
  }

  return null;
}

function readColumnsFromSlotVNodes(
  instance: VueInternal,
  dataListRoot: HTMLElement,
): DataListColumnAdaptiveConfig[] {
  const hasPrimaryAction = Boolean(readProp(instance.props, 'primaryAction'));
  const slotNodes = readDefaultSlotVNodes(instance).filter(
    (node) => isDataListColumnVNode(node) && readProp(node.props as Record<string, unknown>, 'hidden') !== true,
  );

  if (slotNodes.length === 0) return [];

  const metas = slotNodes.map((node, slotIndex) => {
    const propsBag = (node.props || {}) as Record<string, unknown>;
    return {
      slotIndex,
      minWidthPx: resolveColumnMinWidthPx(readProp(propsBag, 'minWidth') as string | undefined),
      displayOrder: Number(readProp(propsBag, 'displayOrder') ?? slotIndex + 1),
      isAction: columnIsAction(propsBag, slotIndex === slotNodes.length - 1, hasPrimaryAction),
    };
  });

  const containerWidth = dataListRoot.getBoundingClientRect().width;

  const selectMode = Boolean(readProp(instance.props, 'selectMode'));
  const skidOpen = Boolean(readSetupRef<boolean>(instance.setupState ?? {}, 'effectiveSkidOpen'))
    || Boolean(readProp(instance.props, 'skidOpen'));

  const visibleIndices = getVisibleColumnSlotIndices(metas, containerWidth, {
    clientViewportWidth: window.innerWidth,
    skidOpen,
    selectOffsetPx: selectMode ? SELECT_COLUMN_WIDTH_PX : 0,
  });
  const visibleSet = new Set(visibleIndices);

  return slotNodes
    .filter((_, index) => visibleSet.has(index))
    .map((node) => mapVNodeColumnConfig(node));
}

function resolveAdaptiveColumns(
  instance: VueInternal,
  dataListRoot: HTMLElement,
): DataListColumnAdaptiveConfig[] {
  return readColumnsFromSetupState(instance) ?? readColumnsFromSlotVNodes(instance, dataListRoot);
}

export function buildDataListAdaptiveInspect(
  preview: Element,
  element: Element,
): InspectPropertyItem[] {
  if (element.closest(DATA_LIST_INSPECT_EXCLUDE_SELECTORS)) return [];

  const dataListEl = element.closest(DATA_LIST_ROOT_SELECTOR);
  if (!(dataListEl instanceof HTMLElement) || !preview.contains(dataListEl)) return [];

  const instance = resolveDataListVueInstance(element, dataListEl);
  if (!instance) return [];

  const columns = resolveAdaptiveColumns(instance, dataListEl);
  if (columns.length === 0) return [];

  return columns.map((column, index) => {
    const flex = isDataListColumnFlexParticipant(columns, index);
    const value = buildAdaptiveValue(column.minWidth, flex);
    const label = `第${index + 1}列`;
    return {
      label,
      value,
      token: null,
      copyLine: value,
    };
  });
}

export function previewHasDataList(preview: Element): boolean {
  return preview.querySelector(DATA_LIST_ROOT_SELECTOR) instanceof HTMLElement;
}
