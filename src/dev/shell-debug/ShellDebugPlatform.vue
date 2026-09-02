<script setup lang="ts">
import { computed } from 'vue';
import '@/dev/shell-debug/bootstrap';
import '@/dev/shell-debug/inspect/developerInspect.css';
import '@/dev/shell-debug/shellDebugPopoverChrome.css';
import '@/dev/shell-debug/shellDebugWindowsChrome.css';
import DeveloperInspectOverlay from './inspect/DeveloperInspectOverlay.vue';
import { useDeveloperInspectPicker } from './inspect/useElementPicker';
import TestScenarioMode from './modes/TestScenarioMode.vue';
import { useShellPageContext } from './pageKeyFromShell';
import ShellDebugDevLauncher from './ShellDebugDevLauncher.vue';
import ShellDebugLauncherAnchored from './ShellDebugLauncherAnchored.vue';
import ShellDebugModelCapsule from './ShellDebugModelCapsule.vue';
import ShellDebugPreviewResize from './ShellDebugPreviewResize.vue';
import ShellDebugWindowsChrome from './ShellDebugWindowsChrome.vue';
import ShellDebugWndCapsule from './ShellDebugWndCapsule.vue';
import styles from './ShellDebugPlatform.module.css';

useDeveloperInspectPicker();

const { effectivePageKey, pageDisplayName } = useShellPageContext();
const qaPanelTitle = computed(() => `${pageDisplayName.value} QA`);
</script>

<template>
  <div :class="[styles.shellDebugRoot, 'desktopTokens']" data-shell-debug-ui>
    <DeveloperInspectOverlay />
    <ShellDebugPreviewResize />
    <ShellDebugWindowsChrome />

    <div :class="styles.launcherColumn">
      <ShellDebugModelCapsule />

      <ShellDebugWndCapsule />

      <ShellDebugDevLauncher />

      <ShellDebugLauncherAnchored
        label="QA"
        icon="eds-coffee"
        :panel-title="qaPanelTitle"
        :show-panel-meta="false"
        launcher-popover-id="qa"
        trigger-aria-label="Open QA test tools"
      >
        <TestScenarioMode :page-key="effectivePageKey" />
      </ShellDebugLauncherAnchored>
    </div>
  </div>
</template>
