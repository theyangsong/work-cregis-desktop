<script setup lang="ts">
import { computed } from 'vue';
import {
  developerInspectActive,
  inspectHoverInfo,
  inspectHoverRect,
  inspectPinnedInfo,
  inspectPinnedRect,
} from './developerInspectSession';
import InspectHoverPopover from './InspectHoverPopover.vue';
import styles from '../ShellDebugPlatform.module.css';

const hoverOverlayStyle = computed(() => {
  const rect = inspectHoverRect.value;
  if (!rect) return undefined;
  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
});

const pinnedOverlayStyle = computed(() => {
  const rect = inspectPinnedRect.value;
  if (!rect) return undefined;
  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
});

const showHoverPopover = computed(
  () =>
    developerInspectActive.value
    && inspectHoverInfo.value
    && inspectHoverRect.value,
);
</script>

<template>
  <Teleport to="body">
    <div v-if="developerInspectActive" data-dev-inspect-overlay :class="styles.inspectOverlayRoot">
      <div
        v-if="hoverOverlayStyle"
        :class="styles.inspectHoverBox"
        :style="hoverOverlayStyle"
      />
      <div
        v-if="pinnedOverlayStyle"
        :class="styles.inspectPinnedBox"
        :style="pinnedOverlayStyle"
      />

      <InspectHoverPopover
        v-if="showHoverPopover && inspectHoverInfo && inspectHoverRect"
        :info="inspectHoverInfo"
        :anchor-rect="inspectHoverRect"
      />
    </div>
  </Teleport>
</template>
