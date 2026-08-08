import { nextTick, ref, watch, type Ref } from 'vue';

type MaybeRefOrGetter<T> = Ref<T> | (() => T);

function readValue<T>(source: MaybeRefOrGetter<T>): T {
  return typeof source === 'function' ? source() : source.value;
}

/**
 * EgPopup 懒挂载 + 延迟 open，保证 microFloat 进出场动效（须先挂载 open=false，再下一帧 open=true）。
 * `suspended`：上层 Popup 打开时暂挂下层，走 EgPopup 出场动效（非 CSS 硬隐藏）；上层关闭后再入场。
 */
export function usePopupShellLifecycle(options: {
  open: MaybeRefOrGetter<boolean>;
  suspended?: MaybeRefOrGetter<boolean>;
  onBeforeOpen?: () => void;
  /** EgPopup 视觉 open=true 且 DOM 就绪后（含 suspend 恢复），用于验证成功后延迟翻页。 */
  onShellOpened?: () => void;
  onClosed?: () => void;
}) {
  const popupMounted = ref(false);
  const popupOpen = ref(false);
  const closingForSuspend = ref(false);

  function isOpen() {
    return readValue(options.open);
  }

  function isSuspended() {
    if (options.suspended === undefined) {
      return false;
    }
    return readValue(options.suspended);
  }

  function shouldShow() {
    return isOpen() && !isSuspended();
  }

  async function openPopup() {
    options.onBeforeOpen?.();
    if (!popupMounted.value) {
      popupMounted.value = true;
      await nextTick();
    }
    requestAnimationFrame(() => {
      if (shouldShow()) {
        popupOpen.value = true;
        void nextTick().then(() => {
          requestAnimationFrame(() => {
            if (shouldShow() && popupOpen.value) {
              options.onShellOpened?.();
            }
          });
        });
      }
    });
  }

  function teardown() {
    popupMounted.value = false;
    options.onClosed?.();
  }

  watch(
    () => [isOpen(), isSuspended()] as const,
    async ([open, suspended]) => {
      if (shouldShow()) {
        await openPopup();
        return;
      }

      if (!popupMounted.value) {
        return;
      }

      if (popupOpen.value) {
        closingForSuspend.value = open && suspended;
        popupOpen.value = false;
        return;
      }

      if (!open) {
        teardown();
      }
    },
    { immediate: true },
  );

  function onPopupClosed() {
    popupOpen.value = false;

    if (closingForSuspend.value) {
      closingForSuspend.value = false;
      return;
    }

    teardown();
  }

  return {
    popupMounted,
    popupOpen,
    onPopupClosed,
  };
}
