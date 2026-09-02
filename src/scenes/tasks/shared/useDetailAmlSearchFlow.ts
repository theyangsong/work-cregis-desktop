import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import {
  pickRandomDetailAmlSearchResult,
  type DetailAmlSearchResultVariant,
} from './detailAmlSearchResult';
import { useEdsToastMotion } from './useEdsToastMotion';

export const DETAIL_AML_SEARCH_DURATION_MS = 4000;

export const DETAIL_AML_SCREENING_UI_KEY = 'Screening in progress';

function createAmlSearchResultsMap(): Map<string, DetailAmlSearchResultVariant> {
  return new Map();
}

export function useDetailAmlSearchFlow(options: {
  detailId: Ref<string | undefined>;
  ui: (key: string) => string;
}) {
  const amlSearchActiveItemKey = ref<string | null>(null);
  const amlSearchResultsByKey = ref(createAmlSearchResultsMap());
  const amlToast = useEdsToastMotion();

  let amlSearchTimer: ReturnType<typeof setTimeout> | undefined;

  function resetAmlSearchFlow() {
    amlSearchActiveItemKey.value = null;
    amlSearchResultsByKey.value = createAmlSearchResultsMap();
    if (amlSearchTimer !== undefined) {
      clearTimeout(amlSearchTimer);
      amlSearchTimer = undefined;
    }
    amlToast.reset();
  }

  function onItemValueAmlSearchClick(key: string) {
    if (amlSearchActiveItemKey.value) return;

    amlSearchActiveItemKey.value = key;
    amlToast.show(options.ui(DETAIL_AML_SCREENING_UI_KEY));

    const resultVariant = pickRandomDetailAmlSearchResult();

    if (amlSearchTimer !== undefined) {
      clearTimeout(amlSearchTimer);
      amlSearchTimer = undefined;
    }

    amlSearchTimer = window.setTimeout(() => {
      amlSearchActiveItemKey.value = null;
      amlSearchResultsByKey.value = new Map([
        ...amlSearchResultsByKey.value,
        [key, resultVariant],
      ]);
      amlSearchTimer = undefined;
    }, DETAIL_AML_SEARCH_DURATION_MS);
  }

  watch(() => options.detailId.value, resetAmlSearchFlow);

  onBeforeUnmount(resetAmlSearchFlow);

  return {
    amlSearchActiveItemKey,
    amlSearchResultsByKey,
    amlToastText: amlToast.text,
    amlToastKeepMounted: amlToast.keepMounted,
    amlToastMotionActive: amlToast.motionActive,
    onItemValueAmlSearchClick,
    resetAmlSearchFlow,
  };
}
