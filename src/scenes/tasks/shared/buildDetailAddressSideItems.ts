import {
  createDetailApplyItemRow,
  type CryptoAddressSideTags,
  type DetailItemData,
} from '@eds/desktop-components';

export type DetailAddressSideKey = 'sender' | 'receiver';

type AddressEntry = {
  address: string;
  alias?: string;
  addressTags?: CryptoAddressSideTags;
};

function normalizeTagList(
  tags?: CryptoAddressSideTags['system'] | CryptoAddressSideTags['custom'],
) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : [tags];
  return list.filter((tag) => tag.show !== false);
}

function hasAddressSideTags(tags: CryptoAddressSideTags): boolean {
  return (
    normalizeTagList(tags.system).length > 0 || normalizeTagList(tags.custom).length > 0
  );
}

function resolveAddressSideTags(tags?: CryptoAddressSideTags): CryptoAddressSideTags | undefined {
  if (!tags || !hasAddressSideTags(tags)) return undefined;
  return tags;
}

/** createDetailApplyItemRow 仅覆盖 !== undefined 的字段；sender 变体 catalog 默认 tag 为演示别名，无 alias 时须传 '' 清掉。 */
function resolveAddressTag(_variantId: DetailAddressSideKey, alias?: string): string {
  return alias?.trim() ?? '';
}

function buildAddressValueEntries(
  entries: AddressEntry[],
  variantId: DetailAddressSideKey,
  options?: { dashed?: boolean },
) {
  return entries.map((entry, index) => ({
    value: entry.address,
    tag: resolveAddressTag(variantId, entry.alias),
    tagBeforeValue: true as const,
    valueAddressSideTags: resolveAddressSideTags(entry.addressTags),
    valueAddressSideTagsRevealAll: true as const,
    valueAddressSideTagsBelow: true as const,
    ...(options?.dashed && index < entries.length - 1 ? { dashed: true as const } : {}),
  }));
}

function withAddressSideTags(
  item: DetailItemData,
  primary: AddressEntry | undefined,
  entries: AddressEntry[],
  variantId: DetailAddressSideKey,
): DetailItemData {
  const valueEntries = buildAddressValueEntries(entries, variantId);
  const primaryTags = resolveAddressSideTags(primary?.addressTags);

  if (!primaryTags && valueEntries.every((entry) => !entry.valueAddressSideTags)) {
    return item;
  }

  return {
    ...item,
    valueEntries,
    value: valueEntries[0]?.value ?? item.value,
    tag: valueEntries[0]?.tag ?? item.tag,
  };
}

export function buildDetailAddressSideItem(
  variantId: DetailAddressSideKey,
  options: {
    key: DetailAddressSideKey;
    title: string;
    primary: AddressEntry | undefined;
    summary: string;
    count: number;
    orderCount?: number;
    entries: AddressEntry[];
    expandLabel: string;
    ordersLabel: string;
  },
): DetailItemData {
  const address = options.primary?.address ?? options.summary;
  const orderCount = options.orderCount ?? 0;

  if (orderCount > 1) {
    return withAddressSideTags(
      createDetailApplyItemRow(variantId, {
        key: options.key,
        title: options.title,
        value: address,
        tag: resolveAddressTag(variantId, options.primary?.alias),
        addressLayout: 'multi-orders',
        addressCount: orderCount,
        valueEntries: buildAddressValueEntries(
          options.entries.slice(0, 1),
          variantId,
        ),
        addressViewMoreLabel: options.ordersLabel,
      }),
      options.primary,
      options.entries.slice(0, 1),
      variantId,
    );
  }

  if (options.count > 1) {
    return withAddressSideTags(
      createDetailApplyItemRow(variantId, {
        key: options.key,
        title: options.title,
        value: address,
        tag: resolveAddressTag(variantId, options.primary?.alias),
        addressLayout: 'multi-collapsed',
        addressCount: options.count,
        valueEntries: buildAddressValueEntries(options.entries, variantId),
        addressViewMoreLabel: options.expandLabel,
      }),
      options.primary,
      options.entries,
      variantId,
    );
  }

  return withAddressSideTags(
    createDetailApplyItemRow(variantId, {
      key: options.key,
      title: options.title,
      value: address,
      tag: resolveAddressTag(variantId, options.primary?.alias),
    }),
    options.primary,
    options.entries,
    variantId,
  );
}
