import { isShellDebugUiElement } from '../shellDebugUiScope';

/** Teleport 到 preview 外的 DS 浮层 — Inspect 须能点选，且不得继承 preview 内触发器身份。 */
const INSPECT_FLOAT_ROOT_SELECTORS = [
  '[id^="eds-tooltip-v-"]',
  '.eds-flotation-menu',
  '.eds-popover.desktopTokens',
] as const;

export function isInspectFloatLayerElement(element: Element): boolean {
  if (isShellDebugUiElement(element)) return false;
  return INSPECT_FLOAT_ROOT_SELECTORS.some((selector) => Boolean(element.closest(selector)));
}

/** 点选 scope：preview 内用 preview；teleport 浮层用浮层根。 */
export function resolveInspectScopeRoot(element: Element, preview: Element): Element {
  if (preview.contains(element)) return preview;
  for (const selector of INSPECT_FLOAT_ROOT_SELECTORS) {
    const root = element.closest(selector);
    if (root instanceof Element) return root;
  }
  return preview;
}
