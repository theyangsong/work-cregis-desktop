import {
  isShellDebugUiInteractionPending,
  markShellDebugUiInteraction,
} from './shellDebugFloatInteraction';
import { isShellDebugUiElement } from './shellDebugUiScope';

let installed = false;

function isCapture(options?: boolean | AddEventListenerOptions): boolean {
  if (options === true) return true;
  if (options && typeof options === 'object') return Boolean(options.capture);
  return false;
}

function nodeInShellDebugUi(node: EventTarget | null): boolean {
  return node instanceof Element && isShellDebugUiElement(node);
}

function isShellDebugFloatInteraction(event: Event): boolean {
  if (nodeInShellDebugUi(event.target)) return true;

  if ('composedPath' in event) {
    for (const node of event.composedPath()) {
      if (nodeInShellDebugUi(node)) return true;
    }
  }

  return false;
}

function shouldSkipAnchoredOutsideDismiss(event: Event): boolean {
  return isShellDebugUiInteractionPending() || isShellDebugFloatInteraction(event);
}

type EventTargetLike = {
  addEventListener: typeof document.addEventListener;
  removeEventListener: typeof document.removeEventListener;
};

function patchCaptureListenerTarget(target: EventTargetLike): void {
  const rawAdd = target.addEventListener.bind(target);
  const rawRemove = target.removeEventListener.bind(target);
  const wrappedListeners = new WeakMap<EventListener, EventListener>();

  target.addEventListener = function shellDebugGuardedAddEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (!isCapture(options) || typeof listener !== 'function') {
      return rawAdd(type, listener, options);
    }

    if (type === 'pointerdown') {
      const wrapped: EventListener = (event) => {
        if (shouldSkipAnchoredOutsideDismiss(event)) {
          if (isShellDebugFloatInteraction(event)) {
            markShellDebugUiInteraction();
          }
          return;
        }
        listener.call(target, event);
      };

      wrappedListeners.set(listener, wrapped);
      return rawAdd(type, wrapped, options);
    }

    if (type === 'scroll') {
      const wrapped: EventListener = (event) => {
        if (shouldSkipAnchoredOutsideDismiss(event)) return;
        listener.call(target, event);
      };

      wrappedListeners.set(listener, wrapped);
      return rawAdd(type, wrapped, options);
    }

    return rawAdd(type, listener, options);
  };

  target.removeEventListener = function shellDebugGuardedRemoveEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    if ((type === 'pointerdown' || type === 'scroll') && typeof listener === 'function') {
      const wrapped = wrappedListeners.get(listener);
      if (wrapped) {
        wrappedListeners.delete(listener);
        return rawRemove(type, wrapped, options);
      }
    }

    return rawRemove(type, listener, options);
  };
}

/**
 * Dev 壳层与业务 click Popover 并存：点击 Dev / QA / Model 启动器或壳层 Popover 时，
 * 不应触发 AnchoredTooltip 的 document/window capture pointerdown / scroll 外部关闭。
 *
 * main.ts 最前同步安装（VITE_SHELL_DEBUG !== 'false'，含 Pages preview）；包装 document/window capture pointerdown 与 scroll。
 */
export function installShellDebugFloatLayerGuard(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  patchCaptureListenerTarget(document);
  patchCaptureListenerTarget(window);
}

export { markShellDebugUiInteraction };
