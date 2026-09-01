import type { CryptoAddressSideTags } from '@eds/desktop-components';

const BLACKLIST_LABEL_KEY = 'Blacklist';

export const RECEIVER_BLACKLIST_FEEDBACK_UI_KEY =
  'This address has been blacklisted. Transactions to this address are prohibited. We recommend rejecting this application.';

function normalizeTagList(
  tags?: CryptoAddressSideTags['system'] | CryptoAddressSideTags['custom'],
) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : [tags];
  return list.filter((tag) => tag.show !== false);
}

export function hasBlacklistAddressTags(
  tags: CryptoAddressSideTags | undefined,
  translate?: (key: string) => string,
): boolean {
  if (!tags) return false;

  const blacklistLabel = translate
    ? translate(BLACKLIST_LABEL_KEY)
    : BLACKLIST_LABEL_KEY;

  return [...normalizeTagList(tags.system), ...normalizeTagList(tags.custom)].some(
    (tag) => {
      const label = String(tag.label ?? '').trim();
      return (
        tag.customStyle === 'aml-danger' ||
        label === BLACKLIST_LABEL_KEY ||
        label === blacklistLabel
      );
    },
  );
}

type AddressEntryWithTags = {
  tags?: string[];
  addressTags?: CryptoAddressSideTags;
};

export function addressEntryHasBlacklist(
  entry: AddressEntryWithTags,
  translate?: (key: string) => string,
): boolean {
  return addressEntriesIncludeBlacklist([entry], translate);
}

export function addressEntriesIncludeBlacklist(
  entries: readonly AddressEntryWithTags[],
  translate?: (key: string) => string,
): boolean {
  const blacklistLabel = translate
    ? translate(BLACKLIST_LABEL_KEY)
    : BLACKLIST_LABEL_KEY;

  return entries.some(
    (entry) =>
      hasBlacklistAddressTags(entry.addressTags, translate) ||
      (entry.tags ?? []).some(
        (tag) => tag === BLACKLIST_LABEL_KEY || tag === blacklistLabel,
      ),
  );
}
