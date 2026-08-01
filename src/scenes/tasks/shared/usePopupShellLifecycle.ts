import { nextTick, ref, watch, type Ref } from 'vue';

type MaybeRefOrGetter<T> = Ref<T> | (() => T);

function readValue<T>(source: MaybeRefOrGetter<T>): T {
  return typeof source === 'function' ? source() : source.value;
}

/**
 * EgPopup 懒挂载 + 延迟 open，保证 microFloat 进出场动效（须先挂载 open=false，再下一帧 open=true）。
 *
 * `suspended`：上层 Popup 打开时 instant 卸下层 shell（无出场动效），叠层视觉仅「上层 / 下层」；
 * 上层关闭后下层再入场。真关闭（open=false）仍走 EgPopup 出场 → @close → onClosed。
 */
export function usePopupShellLifecycle(options: {
  open: MaybeRefOrGetter<boolean>;
  suspended?: MaybeRefOrGetter<boolean>;
  /** open→false 时立即卸 shell（无出场动效），仍触发 onClosed。用于层间 handoff。 */
  dismissWithoutAnimation?: MaybeRefOrGetter<boolean>;
  onBeforeOpen?: () => void;
  /** EgPopup 视觉 open=true 且 DOM 就绪后（含 suspend 恢复），用于验证成功后延迟翻页。 */
  onShellOpened?: () => void;
  onClosed?: () => void;
}) {
  const popupMounted = ref(false);
  const popupOpen = ref(false);
  const closingForSuspend = ref(false);
  /** 是否曾真正打开过 shell；避免 lazy mount 首帧 open=false 误触发 onClosed。 */
  const shellHasPresented = ref(false);

  function isOpen() {
    return readValue(options.open);
  }

  function isSuspended() {
    if (options.suspended === undefined) {
      return false;
    }
    return readValue(options.suspended);
  }

  function isDismissWithoutAnimation() {
    if (options.dismissWithoutAnimation === undefined) {
      return false;
    }
    return readValue(options.dismissWithoutAnimation);
  }

  function shouldShow() {
    return isOpen() && !isSuspended();
  }

  function suspendShellInstantly() {
    closingForSuspend.value = true;
    popupOpen.value = false;
    popupMounted.value = false;
  }

  function dismissShellInstantly() {
    popupOpen.value = false;
    popupMounted.value = false;
    closingForSuspend.value = false;
    if (shellHasPresented.value) {
      shellHasPresented.value = false;
      options.onClosed?.();
    }
  }

  async function openPopup() {
    options.onBeforeOpen?.();
    closingForSuspend.value = false;
    if (!popupMounted.value) {
      popupMounted.value = true;
      await nextTick();
    }
    requestAnimationFrame(() => {
      if (shouldShow()) {
        popupOpen.value = true;
        shellHasPresented.value = true;
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

  function resetShellState() {
    popupMounted.value = false;
    popupOpen.value = false;
    closingForSuspend.value = false;
  }

  function teardown() {
    const shouldNotify = shellHasPresented.value;
    resetShellState();
    shellHasPresented.value = false;
    if (shouldNotify) {
      options.onClosed?.();
    }
  }

  watch(
    () => [isOpen(), isSuspended(), isDismissWithoutAnimation()] as const,
    async ([open, suspended]) => {
      if (shouldShow()) {
        await openPopup();
        return;
      }

      if (!popupMounted.value) {
        if (!open) {
          resetShellState();
        }
        return;
      }

      if (open && suspended) {
        suspendShellInstantly();
        return;
      }

      if (popupOpen.value) {
        if (!open && isDismissWithoutAnimation()) {
          dismissShellInstantly();
          return;
        }
        closingForSuspend.value = false;
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
