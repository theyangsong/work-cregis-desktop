import { ref, shallowRef, type ShallowRef } from 'vue';
import type { ElementInspectInfo } from './buildElementInspectInfo';

/** Dev Popover 打开态（仅 Dev launcher，不含 QA）。 */
export const devInspectPopoverOpen = ref(false);

/** 开发者点选模式：开启时拦截 .app-preview 内业务交互。 */
export const developerInspectActive = ref(false);

export const inspectHoverInfo = shallowRef<ElementInspectInfo | null>(null);
export const inspectHoverRect = shallowRef<DOMRect | null>(null);

export const inspectPinnedInfo = shallowRef<ElementInspectInfo | null>(
  null,
) as ShallowRef<ElementInspectInfo | null>;
export const inspectPinnedRect = shallowRef<DOMRect | null>(null);

export function setDeveloperInspectActive(active: boolean) {
  developerInspectActive.value = active;
  syncPreviewInspectAttribute(active);
  if (!active) {
    inspectHoverInfo.value = null;
    inspectHoverRect.value = null;
  }
}

export function setDevInspectPopoverOpen(open: boolean) {
  devInspectPopoverOpen.value = open;
  if (open) {
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
