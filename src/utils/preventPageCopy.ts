const EDITABLE_SELECTOR = 'input, textarea, [contenteditable="true"]';
const DEV_COPY_SELECTOR = '[data-shell-debug-ui], [data-dev-inspect-copy]';
const DEVICE_INFO_COPY_SELECTOR = '[data-detail-device-info-copy]';
const SIGNING_CUSTOM_POPUP_COPY_SELECTOR = '[data-signing-custom-popup-copy]';

function isEditableCopyTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR));
}

function isDevCopyTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(DEV_COPY_SELECTOR));
}

function isDeviceInfoCopyTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(DEVICE_INFO_COPY_SELECTOR));
}

function isSigningCustomPopupCopyTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(SIGNING_CUSTOM_POPUP_COPY_SELECTOR));
}

/** 业务客户端禁止复制；输入框内编辑与 Dev Inspect 面板除外。 */
export function installPageCopyGuard(): void {
  const blockClipboard = (event: ClipboardEvent) => {
    if (isEditableCopyTarget(event.target)) return;
    if (isDevCopyTarget(event.target)) return;
    if (isDeviceInfoCopyTarget(event.target)) return;
    if (isSigningCustomPopupCopyTarget(event.target)) return;
    event.preventDefault();
  };

  document.addEventListener('copy', blockClipboard);
  document.addEventListener('cut', blockClipboard);
}
