import { ref } from 'vue';

export type ShellDebugMode = 'developer' | 'testing';

export const shellDebugPanelOpen = ref(false);
export const shellDebugActiveMode = ref<ShellDebugMode>('developer');

export function openShellDebugPanel(mode: ShellDebugMode) {
  shellDebugActiveMode.value = mode;
  shellDebugPanelOpen.value = true;
}

export function closeShellDebugPanel() {
  shellDebugPanelOpen.value = false;
}

export function toggleShellDebugPanel(mode: ShellDebugMode) {
  if (shellDebugPanelOpen.value && shellDebugActiveMode.value === mode) {
    closeShellDebugPanel();
    return;
  }
  openShellDebugPanel(mode);
}
