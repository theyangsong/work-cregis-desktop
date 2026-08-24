import { onMounted, ref, type Ref } from 'vue';

export const SHELL_DEBUG_PREVIEW_PRESETS = {
  default: { width: 1280, height: 800 },
  minimum: { width: 960, height: 720 },
} as const;

export type ShellDebugWindowSizePreset = keyof typeof SHELL_DEBUG_PREVIEW_PRESETS;
/** Wnd. 弹窗选项；`windows` 仅切换系统条，不改预览尺寸。 */
export type ShellDebugWindowPreset = ShellDebugWindowSizePreset | 'windows';
export type ShellDebugWindowMode = ShellDebugWindowSizePreset | 'custom';

const PREVIEW_SELECTOR = '#app > .app-preview';

export const SHELL_DEBUG_WINDOW_MODE_OPTIONS = [
  { value: 'default' as const, label: 'Default' },
  { value: 'minimum' as const, label: 'Minimum' },
  { value: 'windows' as const, label: 'Windows' },
];

const windowMode: Ref<ShellDebugWindowMode> = ref('default');
const customSize: Ref<{ width: number; height: number } | null> = ref(null);
const windowsChromeActive = ref(false);
let initialized = false;

function resolvePreviewRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const preview = document.querySelector(PREVIEW_SELECTOR);
  return preview instanceof HTMLElement ? preview : null;
}

function readPreviewSizeLimits() {
  const root = getComputedStyle(document.documentElement);
  const parsePx = (value: string, fallback: number) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    minWidth: parsePx(root.getPropertyValue('--app-preview-min-width'), 960),
    minHeight: parsePx(root.getPropertyValue('--app-preview-min-height'), 720),
    maxWidth: parsePx(root.getPropertyValue('--app-preview-max-width'), 1280),
    maxHeight: parsePx(root.getPropertyValue('--app-preview-max-height'), 800),
  };
}

function syncPreviewSizeCssVars(width: number, height: number) {
  if (typeof document === 'undefined') return;
  const widthValue = `${width}px`;
  const heightValue = `${height}px`;
  document.documentElement.style.setProperty('--app-preview-width', widthValue);
  document.documentElement.style.setProperty('--app-preview-height', heightValue);
}

function applyWindowsChrome(active: boolean) {
  windowsChromeActive.value = active;
  const preview = resolvePreviewRoot();
  if (!preview) return;
  if (active) {
    preview.dataset.shellDebugWindowsChrome = 'true';
  } else {
    delete preview.dataset.shellDebugWindowsChrome;
  }
}

function clampPreviewSize(width: number, height: number) {
  const limits = readPreviewSizeLimits();
  return {
    width: Math.min(limits.maxWidth, Math.max(limits.minWidth, Math.round(width))),
    height: Math.min(limits.maxHeight, Math.max(limits.minHeight, Math.round(height))),
  };
}

function applyPreviewSize(
  preview: HTMLElement,
  width: number,
  height: number,
  mode: ShellDebugWindowMode,
) {
  const clamped = clampPreviewSize(width, height);
  syncPreviewSizeCssVars(clamped.width, clamped.height);
  preview.style.setProperty('--app-preview-width', `${clamped.width}px`);
  preview.style.setProperty('--app-preview-height', `${clamped.height}px`);
  preview.style.removeProperty('width');
  preview.style.removeProperty('height');
  preview.style.removeProperty('max-width');
  preview.style.removeProperty('max-height');
  preview.dataset.shellDebugWindowMode = mode;
  windowMode.value = mode;
  customSize.value = mode === 'custom' ? clamped : null;
}

export function applyShellDebugWindowMode(mode: ShellDebugWindowPreset) {
  if (mode === 'windows') {
    applyWindowsChrome(true);
    return;
  }

  applyWindowsChrome(false);
  const preset = SHELL_DEBUG_PREVIEW_PRESETS[mode];
  const preview = resolvePreviewRoot();
  if (!preview) {
    const clamped = clampPreviewSize(preset.width, preset.height);
    syncPreviewSizeCssVars(clamped.width, clamped.height);
    windowMode.value = mode;
    customSize.value = null;
    return;
  }
  applyPreviewSize(preview, preset.width, preset.height, mode);
}

export function applyShellDebugCustomSize(width: number, height: number) {
  const preview = resolvePreviewRoot();
  if (!preview) return;
  applyPreviewSize(preview, width, height, 'custom');
}

export function readShellDebugPreviewSize(): { width: number; height: number } | null {
  const preview = resolvePreviewRoot();
  if (!preview) return null;
  const rect = preview.getBoundingClientRect();
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
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

  function setWindowModePreview(mode: ShellDebugWindowPreset) {
    applyShellDebugWindowMode(mode);
  }

  return {
    windowMode,
    customSize,
    windowsChromeActive,
    setWindowModePreview,
  };
}

export function useShellDebugWindowsChrome() {
  onMounted(() => {
    initShellDebugWindowMode();
  });

  return {
    windowsChromeActive,
  };
}

export { clampPreviewSize, readPreviewSizeLimits, resolvePreviewRoot, windowsChromeActive };
