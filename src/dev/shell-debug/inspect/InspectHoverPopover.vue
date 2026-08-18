<script setup lang="ts">
import { computed } from 'vue';
import { EgTooltip } from '@eds/desktop-components';
import type { ElementInspectInfo } from './buildElementInspectInfo';
import InspectDetailPanel from './InspectDetailPanel.vue';

const INSPECT_POPOVER_WIDTH = 360;
const INSPECT_POPOVER_MAX_HEIGHT = 480;

const props = defineProps<{
  info: ElementInspectInfo;
  anchorRect: DOMRect;
}>();

const shellStyle = computed(() => {
  const rect = props.anchorRect;
  const width = INSPECT_POPOVER_WIDTH;
  const margin = 8;
  const estimatedHeight = Math.min(INSPECT_POPOVER_MAX_HEIGHT, 360);
  let left = rect.left;
  let top = rect.bottom + margin;

  if (left + width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - width - margin);
  }
  if (top + estimatedHeight > window.innerHeight - margin) {
    top = Math.max(margin, rect.top - estimatedHeight - margin);
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
  } as const;
});
</script>

<template>
  <div
    data-dev-inspect-hover-popover
    :class="$style.host"
    :style="shellStyle"
  >
    <EgTooltip
      panel-kind="flotation"
      panel-radius="radius-md"
      panel-flush
      width-mode="fixed"
      :width="INSPECT_POPOVER_WIDTH"
      height-mode="adaptive"
      :max-height="INSPECT_POPOVER_MAX_HEIGHT"
      :scrollable="true"
    >
      <InspectDetailPanel :info="info" />
    </EgTooltip>
  </div>
</template>

<style module>
.host {
  position: fixed;
  z-index: 10003;
  pointer-events: auto;
}
</style>
