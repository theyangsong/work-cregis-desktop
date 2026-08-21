import type { EdsComponentInspect } from './resolveEdsComponentInspect';

/**
 * Layout / Styles 代码对准 **当前点击节点**（Figma Dev Mode 层选中），
 * 不对齐外层 DS root — 避免 Paginer/Detail 内层 flex gap 被 root 的 gap:normal 覆盖。
 */
export function resolveInspectStyleTargetElement(
  element: Element,
  _edsComponent: EdsComponentInspect | null,
): Element {
  return element;
}
