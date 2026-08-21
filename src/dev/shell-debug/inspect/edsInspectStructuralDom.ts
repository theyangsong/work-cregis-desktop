/**
 * DS 外壳 internal structural `eds-*` 类：仅 chrome / scroll / glass。
 * 全局外壳借名 **只认节点自身** 命中此表；禁止 CSS Module 类名片段匹配。
 */
const SHELL_STRUCTURAL_EDS_DOM_CLASSES = new Set([
  'eds-batch-bar-glass',
  'eds-frosted-menu-chrome',
  'eds-frosted-page-chrome',
  'eds-nav-bar-shell',
  'eds-popover-content',
  'eds-popup-box-content',
  'eds-popup-inner-backdrop',
  'eds-scroll-area-hidden-scrollbar',
]);

export function isStructuralEdsDomClass(className: string | undefined | null): boolean {
  if (!className) return false;
  return SHELL_STRUCTURAL_EDS_DOM_CLASSES.has(className);
}

/** 当前节点自身是否带 structural eds 类（不向上冒泡）。 */
export function elementHasStructuralEdsClass(element: Element): boolean {
  return [...element.classList].some((className) => isStructuralEdsDomClass(className));
}
