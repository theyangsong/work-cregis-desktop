import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue';

export const MULTI_SIGN_WAITING_POPUP_HOST_CLASS = 'eds-multi-sign-waiting-popup';

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

export function useMultiSignWaitingPopupHost(rootRef: Ref<HTMLElement | null>) {
  let popupContentHost: HTMLElement | null = null;

  function bindPopupContentHost() {
    popupContentHost = findPopupContentHost(rootRef.value);
    popupContentHost?.classList.add(MULTI_SIGN_WAITING_POPUP_HOST_CLASS);
  }

  function unbindPopupContentHost() {
    popupContentHost?.classList.remove(MULTI_SIGN_WAITING_POPUP_HOST_CLASS);
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
