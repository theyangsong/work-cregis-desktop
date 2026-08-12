import type { ComponentPublicInstance, Ref } from 'vue';

export type DataListSelectModeExpose = {
  openSelect?: () => void;
  closeSelect?: () => void;
};

export function resolveDataListSelectModeApi(
  dataListRef: Ref<ComponentPublicInstance | null>,
): DataListSelectModeExpose {
  const instance = dataListRef.value;
  if (!instance) return {};

  const direct = instance as DataListSelectModeExpose;
  if (typeof direct.closeSelect === 'function' || typeof direct.openSelect === 'function') {
    return direct;
  }

  const exposed = (instance as { $?: { exposed?: DataListSelectModeExpose } }).$?.exposed;
  if (
    exposed
    && (typeof exposed.closeSelect === 'function' || typeof exposed.openSelect === 'function')
  ) {
    return exposed;
  }

  return direct;
}

/** 与 EgDataList BatchBar dismiss / Esc 同链：优先 closeSelect()，并同步父级 v-model。 */
export function closeDataListSelectMode(
  dataListRef: Ref<ComponentPublicInstance | null>,
  fallback: () => void,
): void {
  const { closeSelect } = resolveDataListSelectModeApi(dataListRef);
  if (closeSelect) {
    closeSelect();
  }
  fallback();
}

export function openDataListSelectMode(
  dataListRef: Ref<ComponentPublicInstance | null>,
  fallback: () => void,
): void {
  const { openSelect } = resolveDataListSelectModeApi(dataListRef);
  if (openSelect) {
    openSelect();
    return;
  }
  fallback();
}
