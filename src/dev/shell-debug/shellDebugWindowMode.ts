import { onMounted, ref, type Ref } from 'vue';

export type ShellDebugWindowMode = 'default' | 'minimum' | 'windows';

const PREVIEW_SELECTOR = '#app > .app-preview';

export const SHELL_DEBUG_WINDOW_MODE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'minimum', label: 'Minimum' },
  { value: 'windows', label: 'Windows' },
] as const satisfies readonly { value: ShellDebugWindowMode; label: string }[];

const windowMode: Ref<ShellDebugWindowMode> = ref('default');
let initialized = false;

function resolvePreviewRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const preview = document.querySelector(PREVIEW_SELECTOR);
  return preview instanceof HTMLElement ? preview : null;
}

export function applyShellDebugWindowMode(mode: ShellDebugWindowMode) {
  windowMode.value = mode;
  const preview = resolvePreviewRoot();
  if (!preview) return;
  preview.dataset.shellDebugWindowMode = mode;
}

export function initShellDebugWindowMode() {
  if (initialized || typeof window === 'undefined') return;
  applyShellDebugWindowMode('default');
  initialized = true;
}

export function useShellDebugWindowMode() {
  onMounted(() => {
    initShellDebugWindowMode();
  });

  function setWindowModePreview(mode: ShellDebugWindowMode) {
    applyShellDebugWindowMode(mode);
  }

  return {
    windowMode,
    setWindowModePreview,
  };
}
