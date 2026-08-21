import { onBeforeUnmount, onMounted, watch } from 'vue';
import { buildElementInspectInfo } from './buildElementInspectInfo';
import {
  clearInspectSelection,
  developerInspectActive,
  inspectHoverInfo,
  inspectHoverRect,
  inspectMeasureElement,
  inspectMeasureRect,
  inspectPinnedInfo,
  inspectPinnedRect,
} from './developerInspectSession';

import { isInspectFloatLayerElement } from './inspectFloatLayerScope';

const PREVIEW_SELECTOR = '.app-preview';
const BLOCK_EVENT_TYPES = ['click', 'mousedown', 'dblclick'] as const;

let lastHoverTarget: Element | null = null;

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

function isShellDebugUiTarget(target: Element): boolean {
  return Boolean(target.closest('[data-shell-debug-ui]'));
}

function isInspectPanelTarget(target: Element): boolean {
  return Boolean(target.closest('[data-dev-inspect-panel]'));
}

function isInspectableTarget(target: Element, preview: Element): boolean {
  if (preview.contains(target)) return true;
  return isInspectFloatLayerElement(target);
}

function elementFromPreviewPoint(x: number, y: number, preview: Element): Element | null {
  const stack = document.elementsFromPoint(x, y);
  for (const node of stack) {
    if (!(node instanceof Element)) continue;
    if (node.closest('[data-shell-debug-ui], [data-dev-inspect-overlay], [data-app-client-float-host]')) continue;
    if (preview.contains(node) || isInspectFloatLayerElement(node)) return node;
  }
  return null;
}

function blockPreviewInteraction(event: Event) {
  if (!developerInspectActive.value) return;

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
  if (!developerInspectActive.value) return;

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

function syncHoverRect() {
  const hover = inspectHoverInfo.value;
  if (!hover) {
    inspectHoverRect.value = null;
    return;
  }
  if (!hover.element.isConnected) {
    inspectHoverInfo.value = null;
    inspectHoverRect.value = null;
    lastHoverTarget = null;
    return;
  }
  inspectHoverRect.value = hover.element.getBoundingClientRect();
}

function syncMeasureRect() {
  const measure = inspectMeasureElement.value;
  if (!measure) {
    inspectMeasureRect.value = null;
    return;
  }
  if (!measure.isConnected) {
    inspectMeasureElement.value = null;
    inspectMeasureRect.value = null;
    return;
  }
  inspectMeasureRect.value = measure.getBoundingClientRect();
}

function clearHoverSelection() {
  lastHoverTarget = null;
  inspectHoverInfo.value = null;
  inspectHoverRect.value = null;
  inspectMeasureElement.value = null;
  inspectMeasureRect.value = null;
}

function updateHoverTarget(target: Element | null, preview: Element) {
  if (!target) {
    clearHoverSelection();
    return;
  }

  const pinned = inspectPinnedInfo.value;
  if (pinned?.element === target) {
    clearHoverSelection();
    return;
  }

  if (target === lastHoverTarget && inspectHoverInfo.value) {
    inspectHoverRect.value = target.getBoundingClientRect();
    if (pinned) {
      inspectMeasureElement.value = target;
      inspectMeasureRect.value = target.getBoundingClientRect();
    }
    return;
  }

  lastHoverTarget = target;
  const info = buildElementInspectInfo(target, preview);
  if (!info) {
    clearHoverSelection();
    return;
  }

  inspectHoverInfo.value = info;
  inspectHoverRect.value = target.getBoundingClientRect();

  if (pinned) {
    inspectMeasureElement.value = target;
    inspectMeasureRect.value = target.getBoundingClientRect();
    return;
  }

  inspectMeasureElement.value = null;
  inspectMeasureRect.value = null;
}

function onPointerMove(event: PointerEvent) {
  if (!developerInspectActive.value) return;

  const eventTarget = event.target;
  if (eventTarget instanceof Element && (isShellDebugUiTarget(eventTarget) || isInspectPanelTarget(eventTarget))) {
    clearHoverSelection();
    return;
  }

  const preview = resolvePreview();
  if (!preview) return;

  const target = elementFromPreviewPoint(event.clientX, event.clientY, preview);
  updateHoverTarget(target, preview);
}

function onPointerDown(event: PointerEvent) {
  if (!developerInspectActive.value) return;

  const eventTarget = event.target;
  if (eventTarget instanceof Element && (isShellDebugUiTarget(eventTarget) || isInspectPanelTarget(eventTarget))) {
    return;
  }

  const preview = resolvePreview();
  if (!preview) return;

  if (!(eventTarget instanceof Element) || !isInspectableTarget(eventTarget, preview)) {
    if (inspectPinnedInfo.value) {
      clearInspectSelection();
    }
    return;
  }

  const target = elementFromPreviewPoint(event.clientX, event.clientY, preview);

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (!target) {
    clearInspectSelection();
    return;
  }

  const info = buildElementInspectInfo(target, preview);
  if (!info) {
    clearInspectSelection();
    return;
  }

  inspectPinnedInfo.value = info;
  inspectPinnedRect.value = target.getBoundingClientRect();
  clearHoverSelection();
}

function onScrollOrResize() {
  if (!developerInspectActive.value) return;
  syncPinnedRect();
  syncHoverRect();
  syncMeasureRect();
}

export function useDeveloperInspectPicker() {
  onMounted(() => {
    for (const type of BLOCK_EVENT_TYPES) {
      window.addEventListener(type, blockPreviewInteraction, true);
    }
    window.addEventListener('keydown', blockPreviewKeyboard, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, true);
  });

  onBeforeUnmount(() => {
    for (const type of BLOCK_EVENT_TYPES) {
      window.removeEventListener(type, blockPreviewInteraction, true);
    }
    window.removeEventListener('keydown', blockPreviewKeyboard, true);
    window.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize, true);
  });

  watch(developerInspectActive, (active) => {
    if (active) return;
    lastHoverTarget = null;
    clearInspectSelection();
  });
}

/** @deprecated Use buildElementInspectInfo + developerInspectSession. */
export type PickedElementInfo = never;

/** @deprecated Use useDeveloperInspectPicker. */
export function useElementPicker() {
  throw new Error('useElementPicker is deprecated. Use useDeveloperInspectPicker.');
}
