import type { EdsComponentInspect } from './resolveEdsComponentInspect';

const FROSTED_PAGE_CHROME_CLASS = 'eds-frosted-page-chrome';

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

/**
 * ToolBar / Paginer / Skid 固定栏的 frosted 条：background / backdrop-filter 声明在此层，
 * 子节点（按钮、文案）点不到该层像素时，样式区仍须从此祖先读取这两项。
 */
export function resolveFrostedPageChromeStyleSource(element: Element): Element | null {
  let node: Element | null = element;
  while (node) {
    if (node.classList.contains(FROSTED_PAGE_CHROME_CLASS)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}
