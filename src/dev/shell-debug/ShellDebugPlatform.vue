<script setup lang="ts">
import { computed } from 'vue';
import '@/dev/shell-debug/bootstrap';
import '@/dev/shell-debug/inspect/developerInspect.css';
import DeveloperInspectOverlay from './inspect/DeveloperInspectOverlay.vue';
import { useDeveloperInspectPicker } from './inspect/useElementPicker';
import DeveloperInspectMode from './modes/DeveloperInspectMode.vue';
import TestScenarioMode from './modes/TestScenarioMode.vue';
import { useShellPageContext } from './pageKeyFromShell';
import ShellDebugLauncherAnchored from './ShellDebugLauncherAnchored.vue';
import ShellDebugModelCapsule from './ShellDebugModelCapsule.vue';
import { setDevInspectPopoverOpen } from './inspect/developerInspectSession';
import styles from './ShellDebugPlatform.module.css';

useDeveloperInspectPicker();

const { pageKey, effectivePageKey, pageDisplayName } = useShellPageContext();
const devPanelMeta = computed(() => pageKey.value.replace(':', ' · '));
const qaPanelTitle = computed(() => `${pageDisplayName.value} QA`);

function onDevPanelOpen() {
  setDevInspectPopoverOpen(true);
}

function onDevPanelClose() {
  setDevInspectPopoverOpen(false);
}
</script>

<template>
  <div :class="[styles.shellDebugRoot, 'desktopTokens']" data-shell-debug-ui>
    <DeveloperInspectOverlay />

    <div :class="styles.launcherColumn">
      <ShellDebugModelCapsule />

      <ShellDebugLauncherAnchored
        label="Dev"
        icon="eds-sign-hashtag"
        panel-title="开发者"
        :panel-meta="devPanelMeta"
        trigger-aria-label="Open developer inspect tools"
        @open="onDevPanelOpen"
        @close="onDevPanelClose"
      >
        <DeveloperInspectMode />
      </ShellDebugLauncherAnchored>

      <ShellDebugLauncherAnchored
        label="QA"
        icon="eds-coffee"
        :panel-title="qaPanelTitle"
        :show-panel-meta="false"
        trigger-aria-label="Open QA test tools"
      >
        <TestScenarioMode :page-key="effectivePageKey" />
      </ShellDebugLauncherAnchored>
    </div>
  </div>
</template>
