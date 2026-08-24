<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { EgDivider, EgIcon, EgIconButton } from '@eds/desktop-components';
import { useShellDebugWindowsChrome } from './shellDebugWindowMode';
import styles from './ShellDebugWindowsChrome.module.css';

const LAYOUT_TELEPORT_SELECTOR =
  '#app > .app-preview .app-shell-container .eds-layout:not(.eds-layout-chrome-overlay)';

const { windowsChromeActive } = useShellDebugWindowsChrome();
const layoutReady = ref(false);

function syncLayoutReady() {
  layoutReady.value = Boolean(document.querySelector(LAYOUT_TELEPORT_SELECTOR));
}

onMounted(() => {
  syncLayoutReady();
});

watch(windowsChromeActive, () => {
  syncLayoutReady();
});
</script>

<template>
  <Teleport
    v-if="windowsChromeActive && layoutReady"
    :to="LAYOUT_TELEPORT_SELECTOR"
  >
    <header
      data-shell-debug-ui
      data-shell-debug-windows-titlebar
      :class="styles.titleBar"
      aria-hidden="true"
    >
      <div :class="styles.titleBarRow">
        <div :class="styles.controls">
          <EgIconButton shape="rectangular" size="sm" label="Minimize" tabindex="-1">
            <EgIcon name="eds-win-minimize" fit />
          </EgIconButton>
          <EgIconButton shape="rectangular" size="sm" label="Maximize" tabindex="-1">
            <EgIcon name="eds-win-maximize" fit />
          </EgIconButton>
          <EgIconButton shape="rectangular" size="sm" label="Close" tabindex="-1">
            <EgIcon name="eds-win-close" fit />
          </EgIconButton>
        </div>
      </div>
      <EgDivider />
    </header>
  </Teleport>
</template>
