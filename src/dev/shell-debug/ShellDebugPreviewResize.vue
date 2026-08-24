<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { developerInspectActive } from './inspect/developerInspectSession';
import {
  applyShellDebugCustomSize,
  clampPreviewSize,
  readShellDebugPreviewSize,
  resolvePreviewRoot,
} from './shellDebugWindowMode';
import styles from './ShellDebugPreviewResize.module.css';

type Edge = 'east' | 'west' | 'north' | 'south';

const previewRect = ref<DOMRect | null>(null);
const resizing = ref(false);

let previewObserver: ResizeObserver | undefined;
let observedPreview: Element | null = null;

function syncPreviewRect() {
  const preview = resolvePreviewRoot();
  previewRect.value = preview?.getBoundingClientRect() ?? null;
}

function observePreview() {
  const preview = resolvePreviewRoot();
  if (!preview || preview === observedPreview) return;

  previewObserver?.disconnect();
  observedPreview = preview;
  previewObserver = new ResizeObserver(syncPreviewRect);
  previewObserver.observe(preview);
  syncPreviewRect();
}

function onViewportChange() {
  observePreview();
  syncPreviewRect();
}

const handlesEnabled = computed(() => !developerInspectActive.value && previewRect.value != null);

const eastStyle = computed(() => {
  const rect = previewRect.value;
  if (!rect) return undefined;
  return {
    top: `${rect.top}px`,
    left: `${rect.right - 4}px`,
    height: `${rect.height}px`,
  };
});

const westStyle = computed(() => {
  const rect = previewRect.value;
  if (!rect) return undefined;
  return {
    top: `${rect.top}px`,
    left: `${Math.max(rect.left - 4, 0)}px`,
    height: `${rect.height}px`,
  };
});

const northStyle = computed(() => {
  const rect = previewRect.value;
  if (!rect) return undefined;
  return {
    top: `${Math.max(rect.top - 4, 0)}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
});

const southStyle = computed(() => {
  const rect = previewRect.value;
  if (!rect) return undefined;
  return {
    top: `${rect.bottom - 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
});

function stopResize() {
  resizing.value = false;
  document.body.classList.remove(styles.rootResizing);
  document.body.style.removeProperty('cursor');
}

function onEdgePointerDown(edge: Edge, event: PointerEvent) {
  if (!handlesEnabled.value) return;

  event.preventDefault();
  event.stopPropagation();

  const startSize = readShellDebugPreviewSize();
  if (!startSize) return;

  const startWidth = startSize.width;
  const startHeight = startSize.height;

  const cursor =
    edge === 'east' || edge === 'west' ? 'ew-resize' : 'ns-resize';

  resizing.value = true;
  document.body.classList.add(styles.rootResizing);
  document.body.style.cursor = cursor;

  const startX = event.clientX;
  const startY = event.clientY;

  function onPointerMove(moveEvent: PointerEvent) {
    let nextWidth = startWidth;
    let nextHeight = startHeight;

    if (edge === 'east') {
      nextWidth = startWidth + (moveEvent.clientX - startX);
    } else if (edge === 'west') {
      nextWidth = startWidth - (moveEvent.clientX - startX);
    } else if (edge === 'south') {
      nextHeight = startHeight + (moveEvent.clientY - startY);
    } else if (edge === 'north') {
      nextHeight = startHeight - (moveEvent.clientY - startY);
    }

    const clamped = clampPreviewSize(nextWidth, nextHeight);
    applyShellDebugCustomSize(clamped.width, clamped.height);
    syncPreviewRect();
  }

  function onPointerUp() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    stopResize();
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}

watch(developerInspectActive, (active) => {
  if (active) stopResize();
});

onMounted(() => {
  observePreview();
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('scroll', onViewportChange, true);
});

onBeforeUnmount(() => {
  previewObserver?.disconnect();
  previewObserver = undefined;
  observedPreview = null;
  window.removeEventListener('resize', onViewportChange);
  window.removeEventListener('scroll', onViewportChange, true);
  stopResize();
});
</script>

<template>
  <div
    v-if="handlesEnabled"
    :class="[styles.root, resizing && styles.rootResizing]"
    data-shell-debug-ui
    aria-hidden="true"
  >
    <div
      :class="[styles.edge, styles.edgeEast]"
      :style="eastStyle"
      @pointerdown="onEdgePointerDown('east', $event)"
    />
    <div
      :class="[styles.edge, styles.edgeWest]"
      :style="westStyle"
      @pointerdown="onEdgePointerDown('west', $event)"
    />
    <div
      :class="[styles.edge, styles.edgeNorth]"
      :style="northStyle"
      @pointerdown="onEdgePointerDown('north', $event)"
    />
    <div
      :class="[styles.edge, styles.edgeSouth]"
      :style="southStyle"
      @pointerdown="onEdgePointerDown('south', $event)"
    />
  </div>
</template>
