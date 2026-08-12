import { hasOpenClickAnchoredTooltip } from '@eds/desktop-components';
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
  type Ref,
  toValue,
} from 'vue';

function isDataListSelectModeDomActive(
  dataListRef: Ref<ComponentPublicInstance | null> | undefined,
): boolean {
  const root = dataListRef?.value?.$el as HTMLElement | undefined;
  if (!root?.classList.contains('eds-data-list')) return false;
  return root.querySelector('thead button[role="checkbox"]') != null;
}

/**
 * 批处理 Esc 退出：与 EgDataList `onSelectModeEscape` 同链。
 * 兜底父级 `v-model:select-mode` 已与 DS 内部态不同步时仍可退出。
 */
export function useDataListSelectModeEscape(options: {
  selectMode: MaybeRefOrGetter<boolean>;
  closeSelectMode: () => void;
  dataListRef?: Ref<ComponentPublicInstance | null>;
  enabled?: MaybeRefOrGetter<boolean>;
}): void {
  const resolveEnabled = () => {
    if (options.enabled !== undefined && !toValue(options.enabled)) return false;
    return toValue(options.selectMode) || isDataListSelectModeDomActive(options.dataListRef);
  };

  function onSelectModeEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    if (!resolveEnabled()) return;
    if (hasOpenClickAnchoredTooltip()) return;
    event.preventDefault();
    options.closeSelectMode();
  }

  let removeListener: (() => void) | undefined;

  onMounted(() => {
    void nextTick(() => {
      window.addEventListener('keydown', onSelectModeEscape, { capture: true });
      removeListener = () => {
        window.removeEventListener('keydown', onSelectModeEscape, { capture: true });
      };
    });
  });

  onBeforeUnmount(() => {
    removeListener?.();
  });
}
