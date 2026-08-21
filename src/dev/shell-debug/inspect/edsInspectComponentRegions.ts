/**
 * R4 具名区域表 —— DS 组件内部**确实是 Figma 组件**、但渲染成无 `eds-*` 类的普通容器。
 *
 * 收录门槛（四条全中才可加）：
 * 1. Figma 组件库里确实存在同名组件；
 * 2. DS 未给它独立 Vue 组件（否则 R2 的 Vue DOM 根已能命中，如 `ModuleMenuTitle`）；
 * 3. DS 未给它 `eds-*` 根类（否则 R2 的 catalog 已能命中）；
 * 4. 名字不与 catalog 里任何组件重名 —— 否则同一条 DOM 链上会出现两层同名
 *    （曾因 `raw` → `Paginer` 导致 footer 与内层 div 都叫 Paginer）。
 *
 * **【禁止】** 为普通 auto-layout 容器编造名字（`ToolBarFunctional`、`SkidPanel` 之类）——
 * 它们在 DS 里只是 `<div>`，应按 R5 显示 `Div`。
 *
 * 真源：`../eds-desktop/packages/components/src/**\/*.module.css`
 * 校验：`node scripts/verify-shell-debug-inspect-naming.mjs`
 */
import type { InspectPropertyItem } from './buildElementInspectInfo';
import { buildDetailApplyItemProps } from './buildDetailApplyItemInspect';
import { classListHasModuleFragment } from './inspectNamingRules';

export type EdsComponentRegionSpec = {
  /** 所属 DS 组件的根 `eds-*` 类 */
  parentDomClass: string;
  /** 该组件 `*.module.css` 里的容器名（编译后类名仍含此片段） */
  cssModuleFragment: string;
  /** Figma 组件名 */
  displayName: string;
  /** 节点自身还须带该 global eds 类（区分同名 fragment 的多态） */
  requiredEdsClass?: string;
  /** 该区域自己的语义属性；缺省则只展示布局 / 样式 */
  buildProps?: (regionElement: Element) => InspectPropertyItem[];
};

/** 更具体的 fragment 必须靠前（`paginationRaw` 先于 `raw`）。 */
export const EDS_COMPONENT_REGIONS: readonly EdsComponentRegionSpec[] = [
  {
    parentDomClass: 'eds-paginer',
    cssModuleFragment: 'paginationRaw',
    displayName: 'Pagination',
  },
  {
    parentDomClass: 'eds-detail',
    cssModuleFragment: 'itemRow',
    displayName: 'Apply_Item',
    buildProps: buildDetailApplyItemProps,
  },
];

export type EdsComponentRegionMatch = {
  spec: EdsComponentRegionSpec;
  parentRoot: Element;
};

export function resolveEdsComponentRegion(element: Element): EdsComponentRegionMatch | null {
  for (const spec of EDS_COMPONENT_REGIONS) {
    if (!classListHasModuleFragment(element, spec.cssModuleFragment)) continue;
    if (spec.requiredEdsClass && !element.classList.contains(spec.requiredEdsClass)) continue;

    const parentRoot = element.closest(`.${spec.parentDomClass}`);
    if (!(parentRoot instanceof Element)) continue;

    return { spec, parentRoot };
  }

  return null;
}
