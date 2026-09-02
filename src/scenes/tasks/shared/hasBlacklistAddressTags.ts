import type { CryptoAddressSideTags } from '@eds/desktop-components';

export const BLACKLIST_LABEL_KEY = 'Blacklist';
export const DANGER_LABEL_KEY = 'Danger';

const ADDRESS_RISK_LABEL_KEYS = [BLACKLIST_LABEL_KEY, DANGER_LABEL_KEY] as const;

export const RECEIVER_BLACKLIST_FEEDBACK_UI_KEY =
  'This address has been blacklisted. Transactions to this address are prohibited. We recommend rejecting this application.';

function normalizeTagList(
  tags?: CryptoAddressSideTags['system'] | CryptoAddressSideTags['custom'],
) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : [tags];
  return list.filter((tag) => tag.show !== false);
}

function labelMatchesKey(
  label: string,
  key: string,
  translate?: (key: string) => string,
): boolean {
  const translated = translate ? translate(key) : key;
  return label === key || label === translated;
}

/** 仅「黑名单」Tag 名称；FormSubmission 反馈只绑定此 label。 */
export function tagMatchesBlacklistLabel(
  tag: { label?: string; customStyle?: string },
  translate?: (key: string) => string,
): boolean {
  const label = String(tag.label ?? '').trim();
  return labelMatchesKey(label, BLACKLIST_LABEL_KEY, translate);
}

/** AML 危险 / 黑名单等风险 Tag（含 aml-danger 样式）。 */
export function tagMatchesAddressRiskLabel(
  tag: { label?: string; customStyle?: string },
  translate?: (key: string) => string,
): boolean {
  if (tag.customStyle === 'aml-danger') return true;

  const label = String(tag.label ?? '').trim();
  return ADDRESS_RISK_LABEL_KEYS.some((key) => labelMatchesKey(label, key, translate));
}

export function hasBlacklistAddressTags(
  tags: CryptoAddressSideTags | undefined,
  translate?: (key: string) => string,
): boolean {
  if (!tags) return false;

  return [...normalizeTagList(tags.system), ...normalizeTagList(tags.custom)].some(
    (tag) => tagMatchesBlacklistLabel(tag, translate),
  );
}

export function hasAddressRiskTags(
  tags: CryptoAddressSideTags | undefined,
  translate?: (key: string) => string,
): boolean {
  if (!tags) return false;

  return [...normalizeTagList(tags.system), ...normalizeTagList(tags.custom)].some(
    (tag) => tagMatchesAddressRiskLabel(tag, translate),
  );
}

type AddressEntryWithTags = {
  tags?: string[];
  addressTags?: CryptoAddressSideTags;
};

function entryStringTagsIncludeBlacklist(
  tags: readonly string[],
  translate?: (key: string) => string,
): boolean {
  return tags.some((tag) => labelMatchesKey(tag, BLACKLIST_LABEL_KEY, translate));
}

function entryStringTagsIncludeAddressRisk(
  tags: readonly string[],
  translate?: (key: string) => string,
): boolean {
  return tags.some((tag) =>
    ADDRESS_RISK_LABEL_KEYS.some((key) => labelMatchesKey(tag, key, translate)),
  );
}

export function addressEntryHasBlacklist(
  entry: AddressEntryWithTags,
  translate?: (key: string) => string,
): boolean {
  return (
    hasBlacklistAddressTags(entry.addressTags, translate) ||
    entryStringTagsIncludeBlacklist(entry.tags ?? [], translate)
  );
}

export function addressEntriesIncludeAddressRisk(
  entries: readonly AddressEntryWithTags[],
  translate?: (key: string) => string,
): boolean {
  return entries.some(
    (entry) =>
      hasAddressRiskTags(entry.addressTags, translate) ||
      entryStringTagsIncludeAddressRisk(entry.tags ?? [], translate),
  );
}

/** @deprecated 签名禁用等场景请用 addressEntriesIncludeAddressRisk。 */
export function addressEntriesIncludeBlacklist(
  entries: readonly AddressEntryWithTags[],
  translate?: (key: string) => string,
): boolean {
  return addressEntriesIncludeAddressRisk(entries, translate);
}
