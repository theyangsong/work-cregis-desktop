import { onBeforeUnmount, onMounted, watch } from 'vue';
import { buildElementInspectInfo } from './buildElementInspectInfo';
import {
  clearInspectSelection,
  devInspectPopoverOpen,
  developerInspectActive,
  inspectHoverInfo,
  inspectHoverRect,
  inspectPinnedInfo,
  inspectPinnedRect,
} from './developerInspectSession';

const PREVIEW_SELECTOR = '.app-preview';
const BLOCK_EVENT_TYPES = ['click', 'mousedown', 'dblclick'] as const;

function resolvePreview(): Element | null {
  return document.querySelector(PREVIEW_SELECTOR);
}

function isInspectOverlayTarget(target: Element): boolean {
  return Boolean(
    target.closest(
      '[data-dev-inspect-overlay], [data-shell-debug-ui], [data-app-client-float-host], [data-float-interactive]',
    ),
  );
}

function elementFromPreviewPoint(x: number, y: number, preview: Element): Element | null {
  const stack = document.elementsFromPoint(x, y);
  for (const node of stack) {
    if (!(node instanceof Element)) continue;
    if (!preview.contains(node)) continue;
    if (node.closest('[data-shell-debug-ui], [data-dev-inspect-overlay], [data-app-client-float-host]')) continue;
    return node;
  }
  return null;
}

function blockPreviewInteraction(event: Event) {
  if (!devInspectPopoverOpen.value) return;

  const preview = resolvePreview();
  if (!preview) return;

  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!preview.contains(target)) return;
  if (isInspectOverlayTarget(target)) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function blockPreviewKeyboard(event: KeyboardEvent) {
  if (!devInspectPopoverOpen.value) return;

  const preview = resolvePreview();
  if (!preview) return;

  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!preview.contains(target)) return;
  if (isInspectOverlayTarget(target)) return;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
}

function syncPinnedRect() {
  const pinned = inspectPinnedInfo.value;
  if (!pinned) {
    inspectPinnedRect.value = null;
    return;
  }
  if (!pinned.element.isConnected) {
    clearInspectSelection();
    return;
  }
  inspectPinnedRect.value = pinned.element.getBoundingClientRect();
}

function onPointerMove(event: PointerEvent) {
  if (!developerInspectActive.value) return;

  const preview = resolvePreview();
  if (!preview) return;

  const target = elementFromPreviewPoint(event.clientX, event.clientY, preview);
  if (!target) {
    inspectHoverInfo.value = null;
    inspectHoverRect.value = null;
    return;
  }

  inspectHoverRect.value = target.getBoundingClientRect();
  inspectHoverInfo.value = buildElementInspectInfo(target, preview);
}

function onPointerDown(event: PointerEvent) {
  if (!developerInspectActive.value) return;

  const preview = resolvePreview();
  if (!preview) return;

  const target = elementFromPreviewPoint(event.clientX, event.clientY, preview);
  if (!target) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const info = buildElementInspectInfo(target, preview);
  if (!info) return;

  inspectPinnedInfo.value = info;
  inspectPinnedRect.value = target.getBoundingClientRect();
  inspectHoverInfo.value = info;
  inspectHoverRect.value = inspectPinnedRect.value;
}

function onScrollOrResize() {
  if (!developerInspectActive.value) return;

  const preview = resolvePreview();
  if (!preview) return;

  const hover = inspectHoverInfo.value;
  if (hover?.element.isConnected) {
    inspectHoverRect.value = hover.element.getBoundingClientRect();
  }

  syncPinnedRect();
}

export function useDeveloperInspectPicker() {
  onMounted(() => {
    for (const type of BLOCK_EVENT_TYPES) {
      window.addEventListener(type, blockPreviewInteraction, true);
    }
    window.addEventListener('keydown', blockPreviewKeyboard, true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, true);
  });

  onBeforeUnmount(() => {
    for (const type of BLOCK_EVENT_TYPES) {
      window.removeEventListener(type, blockPreviewInteraction, true);
    }
    window.removeEventListener('keydown', blockPreviewKeyboard, true);
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize, true);
  });

  watch(developerInspectActive, (active) => {
    if (active) return;
    inspectHoverInfo.value = null;
    inspectHoverRect.value = null;
  });
}

/** @deprecated Use buildElementInspectInfo + developerInspectSession. */
export type PickedElementInfo = never;

/** @deprecated Use useDeveloperInspectPicker. */
export function useElementPicker() {
  throw new Error('useElementPicker is deprecated. Use useDeveloperInspectPicker.');
}
