<script setup lang="ts">
import { computed } from 'vue';
import InspectDetailPanel from '../inspect/InspectDetailPanel.vue';
import {
  clearInspectSelection,
  developerInspectActive,
  inspectPinnedInfo,
  setDeveloperInspectActive,
} from '../inspect/developerInspectSession';

const pinnedInfo = computed(() => inspectPinnedInfo.value);

function stopInspect() {
  setDeveloperInspectActive(false);
  clearInspectSelection();
}
</script>

<template>
  <div :class="$style.root" data-dev-inspect-copy>
    <p :class="$style.status">
      {{
        developerInspectActive
          ? 'Hover to preview · click to pin. App navigation is blocked while Dev is open.'
          : 'Highlight off — app navigation still blocked until you close Dev.'
      }}
    </p>

    <button
      v-if="developerInspectActive"
      type="button"
      :class="$style.stopButton"
      @click="stopInspect"
    >
      Pause highlight
    </button>

    <InspectDetailPanel :info="pinnedInfo" />
  </div>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  user-select: text;
}

.status {
  margin: 0;
  font-size: var(--eds-footnote-size);
  line-height: var(--eds-footnote-line-height);
  color: var(--text-base-secondary);
}

.stopButton {
  align-self: flex-start;
  margin: 0;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--material-outline-decor);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-base-primary);
  font: inherit;
  cursor: pointer;
  composes: motion-ease is-hover from global;
}

.stopButton:hover {
  background: var(--event-hover);
}
</style>
