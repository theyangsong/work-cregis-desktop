import { ref, shallowRef, type ShallowRef } from 'vue';
import type { ElementInspectInfo } from './buildElementInspectInfo';

/** 开发者点选模式：开启时拦截 .app-preview 内业务交互。 */
export const developerInspectActive = ref(false);

/** @deprecated 与 developerInspectActive 同步；保留供旧逻辑读取。 */
export const devInspectPopoverOpen = developerInspectActive;

export const inspectHoverPopoverHovered = ref(false);

export const inspectHoverInfo = shallowRef<ElementInspectInfo | null>(null);
export const inspectHoverRect = shallowRef<DOMRect | null>(null);

export const inspectPinnedInfo = shallowRef<ElementInspectInfo | null>(
  null,
) as ShallowRef<ElementInspectInfo | null>;
export const inspectPinnedRect = shallowRef<DOMRect | null>(null);

/** 已选中时，悬停其他元素用于间距测量。 */
export const inspectMeasureElement = shallowRef<Element | null>(null);
export const inspectMeasureRect = shallowRef<DOMRect | null>(null);

export function setDeveloperInspectActive(active: boolean) {
  developerInspectActive.value = active;
  syncPreviewInspectAttribute(active);
  if (!active) {
    inspectHoverPopoverHovered.value = false;
    inspectHoverInfo.value = null;
    inspectHoverRect.value = null;
  }
}

export function toggleDeveloperInspect() {
  if (developerInspectActive.value) {
    setDeveloperInspectActive(false);
    clearInspectSelection();
    return;
  }
  clearInspectSelection();
  setDeveloperInspectActive(true);
}

/** @deprecated Dev 不再使用 AnchoredPopover；保留 API 避免外部引用报错。 */
export function setDevInspectPopoverOpen(open: boolean) {
  if (open) {
    clearInspectSelection();
    setDeveloperInspectActive(true);
    return;
  }
  setDeveloperInspectActive(false);
  clearInspectSelection();
}

export function clearInspectSelection() {
  inspectPinnedInfo.value = null;
  inspectPinnedRect.value = null;
  inspectHoverInfo.value = null;
  inspectHoverRect.value = null;
  inspectMeasureElement.value = null;
  inspectMeasureRect.value = null;
}

function syncPreviewInspectAttribute(active: boolean) {
  const preview = document.querySelector('.app-preview');
  if (!(preview instanceof HTMLElement)) return;
  if (active) {
    preview.setAttribute('data-dev-inspect-active', '');
    return;
  }
  preview.removeAttribute('data-dev-inspect-active');
}
