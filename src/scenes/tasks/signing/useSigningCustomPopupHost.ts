import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue';

/** 与 EgVerify `eds-verify`、EgReminder `eds-reminder` 同级的 Popup Box 内容 host 标记 */
export const SIGNING_CUSTOM_POPUP_HOST_CLASS = 'eds-signing-custom-popup';

function findPopupContentHost(from: HTMLElement | null): HTMLElement | null {
  let element = from?.parentElement ?? null;

  while (element) {
    if (element.classList.contains('eds-popup-box-content')) {
      return element;
    }
    element = element.parentElement;
  }

  return null;
}

export function useSigningCustomPopupHost(rootRef: Ref<HTMLElement | null>) {
  let popupContentHost: HTMLElement | null = null;

  function bindPopupContentHost() {
    popupContentHost = findPopupContentHost(rootRef.value);
    popupContentHost?.classList.add(SIGNING_CUSTOM_POPUP_HOST_CLASS);
  }

  function unbindPopupContentHost() {
    popupContentHost?.classList.remove(SIGNING_CUSTOM_POPUP_HOST_CLASS);
    popupContentHost = null;
  }

  onMounted(async () => {
    bindPopupContentHost();
    await nextTick();
    if (!popupContentHost) {
      bindPopupContentHost();
    }
  });

  onBeforeUnmount(() => {
    unbindPopupContentHost();
  });
}
