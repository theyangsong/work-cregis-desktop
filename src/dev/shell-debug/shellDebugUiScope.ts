/**
 * 壳外 Shell Debug 全部 UI 边界（含 teleport 到 body 的 Popover 整颗）。
 * Dev Inspect 不得点选、不得 buildElementInspectInfo 输出开发参数。
 */

export const SHELL_DEBUG_UI_ROOT_SELECTOR =
  '[data-shell-debug-ui], [data-dev-inspect-overlay], [data-dev-inspect-panel], [data-dev-inspect-hover-popover]';

/** 与 installShellDebugFloatLayerGuard / ShellDebugPlatform.module.css 对齐。 */
export const SHELL_DEBUG_FLOAT_CONTENT_MARKERS =
  '.shell-debug-popover-content, .shell-debug-dev-inspect-hint, .shell-debug-dev-inspect-popover, .shell-debug-model-popover-content, .shell-debug-wnd-popover-content, .shell-debug-qa-popover';

function floatingHostContainsShellDebugContent(element: Element): boolean {
  const popover = element.closest('.eds-popover');
  if (popover instanceof Element && popover.querySelector(SHELL_DEBUG_FLOAT_CONTENT_MARKERS)) {
    return true;
  }

  const tooltipHost = element.closest('[id^="eds-tooltip-v-"]');
  if (tooltipHost instanceof Element && tooltipHost.querySelector(SHELL_DEBUG_FLOAT_CONTENT_MARKERS)) {
    return true;
  }

  const floating = element.closest('[class*="floating"]');
  if (floating instanceof Element && floating.querySelector(SHELL_DEBUG_FLOAT_CONTENT_MARKERS)) {
    return true;
  }

  return false;
}

export function isShellDebugUiElement(element: Element): boolean {
  if (element.closest(SHELL_DEBUG_UI_ROOT_SELECTOR)) return true;
  if (element.closest(SHELL_DEBUG_FLOAT_CONTENT_MARKERS)) return true;
  return floatingHostContainsShellDebugContent(element);
}
