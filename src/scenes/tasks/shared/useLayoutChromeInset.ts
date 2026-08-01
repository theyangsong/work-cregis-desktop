import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  unref,
  watch,
  type MaybeRef,
  type Ref,
} from 'vue';

type ChromeInsetOptions = {
  topOverlayRef?: Ref<HTMLElement | null>;
  bottomOverlayRef?: Ref<HTMLElement | null>;
  enabled?: MaybeRef<boolean>;
};

/**
 * 对齐 EgLayout：为 DataList 等滚动区写入 `--eds-layout-chrome-inset-*`，
 * 使底栏 Paginer 毛玻璃下仍有正文可模糊。
 */
export function useLayoutChromeInset(
  bodyRef: Ref<HTMLElement | null>,
  options: ChromeInsetOptions = {},
) {
  let resizeObserver: ResizeObserver | undefined;

  function updateChromeInsets() {
    const body = bodyRef.value;
    if (!body || unref(options.enabled) === false) {
      body?.style.removeProperty('--eds-layout-chrome-inset-top');
      body?.style.removeProperty('--eds-layout-chrome-inset-bottom');
      return;
    }

    const top = options.topOverlayRef?.value?.offsetHeight ?? 0;
    const bottom = options.bottomOverlayRef?.value?.offsetHeight ?? 0;

    body.style.setProperty('--eds-layout-chrome-inset-top', `${top}px`);
    body.style.setProperty('--eds-layout-chrome-inset-bottom', `${bottom}px`);
  }

  function observeChromeOverlays() {
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => {
      updateChromeInsets();
    });

    if (bodyRef.value) {
      resizeObserver.observe(bodyRef.value);
    }
    if (options.topOverlayRef?.value) {
      resizeObserver.observe(options.topOverlayRef.value);
    }
    if (options.bottomOverlayRef?.value) {
      resizeObserver.observe(options.bottomOverlayRef.value);
    }

    updateChromeInsets();
  }

  function scheduleChromeInsetUpdate() {
    void nextTick(() => {
      requestAnimationFrame(observeChromeOverlays);
    });
  }

  onMounted(scheduleChromeInsetUpdate);
  onUpdated(scheduleChromeInsetUpdate);

  watch(
    () => [
      bodyRef.value,
      options.topOverlayRef?.value,
      options.bottomOverlayRef?.value,
      unref(options.enabled),
    ] as const,
    scheduleChromeInsetUpdate,
  );

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = undefined;
  });

  return {
    updateChromeInsets: scheduleChromeInsetUpdate,
  };
}
