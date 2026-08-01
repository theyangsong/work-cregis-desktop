import type { DetailItemData, DetailSectionData } from '@eds/desktop-components';

export type DetailAddressExpandKey = 'sender' | 'receiver';

export function isDetailAddressExpandKey(key: string): key is DetailAddressExpandKey {
  return key === 'sender' || key === 'receiver';
}

function expandAddressItem(item: DetailItemData): DetailItemData {
  if (item.addressLayout !== 'multi-collapsed' || !item.valueEntries?.length) {
    return item;
  }

  const entries = item.valueEntries;
  return {
    ...item,
    addressLayout: 'multi-expanded',
    valueEntries: entries.map((entry, index) => ({
      ...entry,
      dashed: index < entries.length - 1,
    })),
  };
}

export function applyDetailAddressExpand(
  sections: DetailSectionData[],
  expandedKeys: ReadonlySet<string>,
): DetailSectionData[] {
  if (expandedKeys.size === 0) {
    return sections;
  }

  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.key && expandedKeys.has(item.key)) {
        return expandAddressItem(item);
      }
      return item;
    }),
  }));
}
