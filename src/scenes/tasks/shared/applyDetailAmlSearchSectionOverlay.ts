import type {
  CryptoAddressSideTags,
  DetailItemData,
  DetailItemValueEntry,
  DetailSectionData,
} from '@eds/desktop-components';
import {
  addressEntryHasBlacklist,
  tagMatchesBlacklistLabel,
} from './hasBlacklistAddressTags';
import {
  tagMatchesDetailAmlSearchResult,
  type DetailAmlSearchResultVariant,
} from './detailAmlSearchResult';

export const DETAIL_RECEIVER_ITEM_KEY = 'receiver';

export function resolveDetailItemValueCopyKey(
  itemKey: string,
  entryIndex: number,
): string {
  return entryIndex > 0 ? `${itemKey}-${entryIndex}` : itemKey;
}

function normalizeTagList(
  tags?: CryptoAddressSideTags['system'] | CryptoAddressSideTags['custom'],
) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : [tags];
  return list.filter((tag) => tag.show !== false);
}

function hasRenderableAddressSideTags(tags?: CryptoAddressSideTags): boolean {
  if (!tags) return false;
  return (
    normalizeTagList(tags.system).length > 0 || normalizeTagList(tags.custom).length > 0
  );
}

function shouldStripTagForAmlPending(
  tag: { label?: string; customStyle?: string },
  translate: (key: string) => string,
): boolean {
  if (tagMatchesBlacklistLabel(tag, translate)) return false;
  return tagMatchesDetailAmlSearchResult(tag, translate);
}

function stripAmlPendingTags(
  tags: CryptoAddressSideTags | undefined,
  translate: (key: string) => string,
): CryptoAddressSideTags | undefined {
  if (!tags) return undefined;

  const filterSlot = (
    slot: CryptoAddressSideTags['system'] | CryptoAddressSideTags['custom'],
  ) => {
    const kept = normalizeTagList(slot).filter(
      (tag) => !shouldStripTagForAmlPending(tag, translate),
    );
    if (kept.length === 0) return undefined;
    return kept.length === 1 ? kept[0] : kept;
  };

  const system = filterSlot(tags.system);
  const custom = filterSlot(tags.custom);
  if (!system && !custom && !tags.more) return undefined;

  return {
    ...(system ? { system } : {}),
    ...(custom ? { custom } : {}),
    ...(tags.more ? { more: tags.more } : {}),
  };
}

function applyAmlSearchResultTag(
  tags: CryptoAddressSideTags | undefined,
  result: DetailAmlSearchResultVariant,
  translate: (key: string) => string,
): CryptoAddressSideTags {
  const base = tags ?? {};
  const systemTags = normalizeTagList(base.system).filter(
    (tag) => !shouldStripTagForAmlPending(tag, translate),
  );
  const customTags = normalizeTagList(base.custom).filter(
    (tag) => !shouldStripTagForAmlPending(tag, translate),
  );

  const amlResultTag = {
    show: true as const,
    size: 'sm' as const,
    family: 'custom' as const,
    label: translate(result.labelKey),
    customStyle: result.customStyle,
  };

  return {
    ...base,
    system: [amlResultTag, ...systemTags],
    ...(customTags.length > 0
      ? { custom: customTags.length === 1 ? customTags[0] : customTags }
      : base.custom
        ? { custom: base.custom }
        : {}),
    ...(base.more ? { more: base.more } : {}),
  };
}

function buildAmlSearchResultEntry(
  entry: DetailItemValueEntry,
  result: DetailAmlSearchResultVariant,
  translate: (key: string) => string,
): DetailItemValueEntry {
  const next: DetailItemValueEntry = {
    ...entry,
    valueAddressSideTags: applyAmlSearchResultTag(
      entry.valueAddressSideTags,
      result,
      translate,
    ),
    valueAddressSideTagsRevealAll: true,
    valueAddressSideTagsBelow: true,
  };

  return next;
}

function buildAmlSearchPendingEntry(
  entry: DetailItemValueEntry,
  translate: (key: string) => string,
): DetailItemValueEntry {
  const strippedTags = stripAmlPendingTags(entry.valueAddressSideTags, translate);
  const next: DetailItemValueEntry = { ...entry };

  if (strippedTags && hasRenderableAddressSideTags(strippedTags)) {
    next.valueAddressSideTags = strippedTags;
  } else if (entry.valueAddressSideTags) {
    delete next.valueAddressSideTags;
    delete next.valueAddressSideTagsRevealAll;
    delete next.valueAddressSideTagsBelow;
  }

  const tagsForBlacklistCheck = next.valueAddressSideTags ?? entry.valueAddressSideTags;
  if (
    !addressEntryHasBlacklist({ addressTags: tagsForBlacklistCheck }, translate)
  ) {
    next.valueAddressSideFeedback = undefined;
  }

  return next;
}

function applyReceiverAmlOverlay(
  item: DetailItemData,
  resultsByKey: ReadonlyMap<string, DetailAmlSearchResultVariant>,
  translate: (key: string) => string,
): DetailItemData {
  if (!item.showValueAmlSearch || item.key !== DETAIL_RECEIVER_ITEM_KEY) {
    return item;
  }

  const itemKey = item.key;

  if (item.valueEntries?.length) {
    const valueEntries = item.valueEntries.map((entry, entryIndex) => {
      const copyKey = resolveDetailItemValueCopyKey(itemKey, entryIndex);
      const result = resultsByKey.get(copyKey);
      return result
        ? buildAmlSearchResultEntry(entry, result, translate)
        : buildAmlSearchPendingEntry(entry, translate);
    });

    return { ...item, valueEntries };
  }

  const copyKey = resolveDetailItemValueCopyKey(itemKey, 0);
  const result = resultsByKey.get(copyKey);

  if (!result) {
    return item;
  }

  const baseEntry: DetailItemValueEntry = {
    value: item.value,
    tag: item.tag,
    tagBeforeValue: item.tagBeforeValue,
    valueAddressSideTags: undefined,
  };

  const resultEntry = buildAmlSearchResultEntry(baseEntry, result, translate);
  return {
    ...item,
    valueEntries: [resultEntry],
    value: resultEntry.value,
    tag: resultEntry.tag,
  };
}

export function applyDetailAmlSearchSectionOverlay(
  sections: DetailSectionData[],
  options: {
    resultsByKey: ReadonlyMap<string, DetailAmlSearchResultVariant>;
    translate: (key: string) => string;
  },
): DetailSectionData[] {
  return sections.map((section) => ({
    ...section,
    items: section.items?.map((item) =>
      applyReceiverAmlOverlay(item, options.resultsByKey, options.translate),
    ),
  }));
}
