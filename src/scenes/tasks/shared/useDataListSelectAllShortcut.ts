import {
  onBeforeUnmount,
  onMounted,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
  type Ref,
  toValue,
} from 'vue';

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"]'));
}

function queryDataListSelectAllCheckbox(
  dataListRoot: HTMLElement,
): HTMLButtonElement | null {
  return dataListRoot.querySelector('thead button[role="checkbox"]');
}

/** 触发 DataList 表头全选切换（与点击表头 checkbox 一致，仅当前页 `data-list`）。 */
export function triggerDataListSelectAllToggle(
  dataListRoot: HTMLElement | null | undefined,
): void {
  if (!dataListRoot) return;
  const checkbox = queryDataListSelectAllCheckbox(dataListRoot);
  checkbox?.click();
}

/** @deprecated 使用 triggerDataListSelectAllToggle */
export function triggerDataListSelectAll(
  dataListRoot: HTMLElement | null | undefined,
): void {
  triggerDataListSelectAllToggle(dataListRoot);
}

export function useDataListSelectAllShortcut(options: {
  selectMode: MaybeRefOrGetter<boolean>;
  dataListRef: Ref<ComponentPublicInstance | null>;
  pageRowCount: MaybeRefOrGetter<number>;
  selectedCount: MaybeRefOrGetter<number>;
  enabled?: MaybeRefOrGetter<boolean>;
}): void {
  const resolveEnabled = () => {
    if (options.enabled !== undefined && !toValue(options.enabled)) return false;
    return toValue(options.selectMode);
  };

  function onSelectAllKeydown(event: KeyboardEvent) {
    if (event.key !== 'q' && event.key !== 'Q') return;
    if (event.isComposing) return;
    if (!resolveEnabled()) return;
    if (isEditableKeyboardTarget(event.target)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const pageCount = toValue(options.pageRowCount);
    if (pageCount <= 0) return;

    const root = options.dataListRef.value?.$el as HTMLElement | undefined;
    if (!root?.classList.contains('eds-data-list')) return;

    event.preventDefault();
    event.stopPropagation();
    triggerDataListSelectAllToggle(root);
  }

  onMounted(() => {
    window.addEventListener('keydown', onSelectAllKeydown, { capture: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onSelectAllKeydown, { capture: true });
  });
}
