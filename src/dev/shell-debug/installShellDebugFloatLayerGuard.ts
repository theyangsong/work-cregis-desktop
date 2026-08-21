const SHELL_DEBUG_TARGET_SELECTOR =
  '[data-shell-debug-ui], [data-dev-inspect-panel], [data-dev-inspect-overlay]';

const SHELL_DEBUG_FLOAT_CONTENT_SELECTOR =
  '.shell-debug-popover-content, .shell-debug-dev-inspect-hint, .shell-debug-model-popover-content';

let installed = false;

function isCapture(options?: boolean | AddEventListenerOptions): boolean {
  if (options === true) return true;
  if (options && typeof options === 'object') return Boolean(options.capture);
  return false;
}

function isShellDebugFloatTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest(SHELL_DEBUG_TARGET_SELECTOR)) return true;

  const floating = target.closest('[class*="floating"]');
  if (!(floating instanceof HTMLElement)) return false;
  return floating.querySelector(SHELL_DEBUG_FLOAT_CONTENT_SELECTOR) !== null;
}

/**
 * Dev 壳层与业务 click Popover 并存：点击 Dev / QA 启动器或壳层 Popover 时，
 * 不应触发 AnchoredTooltip 的 document pointerdown 外部关闭。
 *
 * 仅 DEV 在 main.ts 同步安装；包装 document capture pointerdown 监听器。
 */
export function installShellDebugFloatLayerGuard(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const rawAdd = document.addEventListener.bind(document);
  const rawRemove = document.removeEventListener.bind(document);
  const wrappedListeners = new WeakMap<EventListener, EventListener>();

  document.addEventListener = function shellDebugGuardedAddEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (type !== 'pointerdown' || !isCapture(options) || typeof listener !== 'function') {
      return rawAdd(type, listener, options);
    }

    const wrapped: EventListener = (event) => {
      if (isShellDebugFloatTarget(event.target)) return;
      listener.call(document, event);
    };

    wrappedListeners.set(listener, wrapped);
    return rawAdd(type, wrapped, options);
  };

  document.removeEventListener = function shellDebugGuardedRemoveEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (type === 'pointerdown' && typeof listener === 'function') {
      const wrapped = wrappedListeners.get(listener);
      if (wrapped) {
        wrappedListeners.delete(listener);
        return rawRemove(type, wrapped, options);
      }
    }

    return rawRemove(type, listener, options);
  };
}
