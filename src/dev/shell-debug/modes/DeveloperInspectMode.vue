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
          ? pinnedInfo
            ? '已选中 · 悬停其他元素可测间距 · 点击空白关闭'
            : '悬停查看布局 · 点击元素选中 · 点击空白关闭'
          : '高亮已暂停 · 关闭 Dev 前仍拦截业务导航'
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
