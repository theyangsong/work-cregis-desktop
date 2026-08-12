const EDITABLE_SELECTOR = 'input, textarea, [contenteditable="true"]';

function isEditableCopyTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR));
}

/** 业务客户端禁止复制；输入框内编辑除外。 */
export function installPageCopyGuard(): void {
  const blockClipboard = (event: ClipboardEvent) => {
    if (isEditableCopyTarget(event.target)) return;
    event.preventDefault();
  };

  document.addEventListener('copy', blockClipboard);
  document.addEventListener('cut', blockClipboard);
}
