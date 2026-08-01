const EDITABLE_SELECTOR = 'input, textarea, [contenteditable="true"]';
const DEV_COPY_SELECTOR = '[data-shell-debug-ui], [data-dev-inspect-copy]';

function isEditableCopyTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR));
}

function isDevCopyTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(DEV_COPY_SELECTOR));
}

/** 业务客户端禁止复制；输入框内编辑与 Dev Inspect 面板除外。 */
export function installPageCopyGuard(): void {
  const blockClipboard = (event: ClipboardEvent) => {
    if (isEditableCopyTarget(event.target)) return;
    if (isDevCopyTarget(event.target)) return;
    event.preventDefault();
  };

  document.addEventListener('copy', blockClipboard);
  document.addEventListener('cut', blockClipboard);
}
