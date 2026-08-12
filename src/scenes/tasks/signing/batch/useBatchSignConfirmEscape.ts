import { hasOpenClickAnchoredTooltip } from '@eds/desktop-components';
import {
  onBeforeUnmount,
  onMounted,
  type MaybeRefOrGetter,
  toValue,
} from 'vue';

/**
 * 批量签名确认 Popup Esc：子页先返回摘要，摘要页关闭弹窗。
 * 注册在 document capture，避免 window 层 click Popover 拦截后 EgPopup 收不到。
 */
export function useBatchSignConfirmEscape(options: {
  open: MaybeRefOrGetter<boolean>;
  activePage: MaybeRefOrGetter<'summary' | 'detail' | 'reasons'>;
  onBack: () => void;
  onClose: () => void;
}): void {
  function onEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !toValue(options.open)) return;
    if (hasOpenClickAnchoredTooltip()) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (toValue(options.activePage) !== 'summary') {
      options.onBack();
      return;
    }

    options.onClose();
  }

  onMounted(() => {
    document.addEventListener('keydown', onEscape, { capture: true });
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onEscape, { capture: true });
  });
}
