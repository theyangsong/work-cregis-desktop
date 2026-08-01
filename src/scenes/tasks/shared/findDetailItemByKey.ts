import type { DetailItemData, DetailSectionData } from '@eds/desktop-components';

export function findDetailItemByKey(
  sections: DetailSectionData[],
  key: string,
): DetailItemData | undefined {
  for (const section of sections) {
    const match = section.items.find((item) => item.key === key);
    if (match) {
      return match;
    }
  }
  return undefined;
}
