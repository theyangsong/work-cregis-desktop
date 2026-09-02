import type {
  CryptoAddressSideTags,
  CryptoAddressTagSlotConfig,
  TagColorfulStyle,
  TagCustomStyle,
  TagSize,
} from '@eds/desktop-components';
import { BLACKLIST_LABEL_KEY } from '../shared/hasBlacklistAddressTags';
import { tasksDataListShowsAddressBlacklist } from '../tasksDataListPageData';
import {
  MAX_CURRENCY_SIDE_ADDRESSES,
  currencyAddressTagsEnabledKey,
  parseCurrencyAddressCount,
} from './listFieldCurrencyShared';

type CurrencyTagPanelSlot = 'system' | 'custom';

const TAG_COUNT_MAX = 100;

export const CURRENCY_CUSTOM_TAG_DEFAULT_LABELS = [
  'Coinbase',
  'OKX',
  'Isolation',
  'Testing',
  'Market',
] as const;

export const CURRENCY_CUSTOM_TAG_DEFAULT_COUNT = CURRENCY_CUSTOM_TAG_DEFAULT_LABELS.length;

function capitalizeKey(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function slotLabel(slot: CurrencyTagPanelSlot): string {
  return slot === 'system' ? 'Danger' : 'Custom';
}

export function currencyTagShowKey(
  side: 'from' | 'to',
  addressIndex: number,
  slot: CurrencyTagPanelSlot,
): string {
  return `${side}Address${addressIndex}Show${capitalizeKey(slot)}Tag`;
}

function currencyTagKeyPrefix(
  side: 'from' | 'to',
  addressIndex: number,
  slot: CurrencyTagPanelSlot,
): string {
  return `${side}Address${addressIndex}${capitalizeKey(slot)}Tag`;
}

function currencyTagCountKey(
  side: 'from' | 'to',
  addressIndex: number,
  slot: CurrencyTagPanelSlot,
): string {
  return `${currencyTagKeyPrefix(side, addressIndex, slot)}Count`;
}

function currencyTagItemKey(
  side: 'from' | 'to',
  addressIndex: number,
  slot: CurrencyTagPanelSlot,
  field: 'Label' | 'SystemType' | 'ColorfulStyle' | 'CustomStyle',
  tagIndex: number,
): string {
  return `${currencyTagKeyPrefix(side, addressIndex, slot)}${field}${tagIndex}`;
}

function parseCurrencyTagCount(
  state: Record<string, unknown>,
  side: 'from' | 'to',
  addressIndex: number,
  slot: CurrencyTagPanelSlot,
): number {
  const parsed = Number.parseInt(
    String(state[currencyTagCountKey(side, addressIndex, slot)] ?? '1'),
    10,
  );
  return Number.isFinite(parsed) ? Math.min(TAG_COUNT_MAX, Math.max(1, parsed)) : 1;
}

function defaultTagItemValue(
  slot: CurrencyTagPanelSlot,
  tagIndex: number,
  field: 'Label' | 'SystemType' | 'ColorfulStyle' | 'CustomStyle',
): string {
  if (field === 'Label') {
    if (slot === 'custom' && tagIndex <= CURRENCY_CUSTOM_TAG_DEFAULT_LABELS.length) {
      return CURRENCY_CUSTOM_TAG_DEFAULT_LABELS[tagIndex - 1];
    }
    return tagIndex === 1 ? slotLabel(slot) : `Tag ${tagIndex}`;
  }
  if (field === 'SystemType') {
    return 'solid-red';
  }
  if (field === 'CustomStyle') {
    if (slot === 'system') {
      return 'aml-danger';
    }
    return resolveCurrencyCustomTagStyle(tagIndex);
  }
  return 'apricot';
}

export function resolveCurrencyCustomTagStyle(tagIndex: number): TagCustomStyle {
  if (tagIndex === 1) return 'teal';
  if (tagIndex === 2) return 'cobalt';
  const extraCustomStyles = [
    'aurora',
    'vermilion',
    'orange',
    'amber',
    'lime',
    'mint',
    'clear-sky',
    'orchid',
    'rose',
    'peach',
  ] as const satisfies readonly TagCustomStyle[];
  return extraCustomStyles[(tagIndex - 3) % extraCustomStyles.length] ?? 'aurora';
}

export function resolveCurrencyCustomTagStyleForLabel(label: string): TagCustomStyle {
  const presetIndex = CURRENCY_CUSTOM_TAG_DEFAULT_LABELS.indexOf(
    label as (typeof CURRENCY_CUSTOM_TAG_DEFAULT_LABELS)[number],
  );
  return resolveCurrencyCustomTagStyle(presetIndex >= 0 ? presetIndex + 1 : 1);
}

function createCurrencyTagItemDefaults(
  side: 'from' | 'to',
  addressIndex: number,
  slot: CurrencyTagPanelSlot,
  family: 'system' | 'colorful' | 'custom',
  count: number,
  enabled: boolean,
): Record<string, unknown> {
  const entries: Record<string, unknown> = {
    [currencyTagShowKey(side, addressIndex, slot)]: enabled,
    [currencyTagCountKey(side, addressIndex, slot)]: String(count),
  };

  for (let tagIndex = 1; tagIndex <= count; tagIndex += 1) {
    entries[currencyTagItemKey(side, addressIndex, slot, 'Label', tagIndex)] =
      defaultTagItemValue(slot, tagIndex, 'Label');
    if (family === 'system') {
      entries[currencyTagItemKey(side, addressIndex, slot, 'SystemType', tagIndex)] =
        defaultTagItemValue(slot, tagIndex, 'SystemType');
    } else if (family === 'colorful') {
      entries[currencyTagItemKey(side, addressIndex, slot, 'ColorfulStyle', tagIndex)] =
        defaultTagItemValue(slot, tagIndex, 'ColorfulStyle');
    } else {
      entries[currencyTagItemKey(side, addressIndex, slot, 'CustomStyle', tagIndex)] =
        defaultTagItemValue(slot, tagIndex, 'CustomStyle');
    }
  }

  return entries;
}

function currencyAddressTagDefaults(
  side: 'from' | 'to',
  addressIndex: number,
  enabled = false,
): Record<string, unknown> {
  if (side === 'from') {
    return {
      [currencyAddressTagsEnabledKey(side, addressIndex)]: enabled,
      ...createCurrencyTagItemDefaults(side, addressIndex, 'system', 'custom', 1, enabled),
      ...createCurrencyTagItemDefaults(side, addressIndex, 'custom', 'custom', CURRENCY_CUSTOM_TAG_DEFAULT_COUNT, false),
    };
  }

  return {
    [currencyAddressTagsEnabledKey(side, addressIndex)]: enabled,
    ...createCurrencyTagItemDefaults(side, addressIndex, 'system', 'custom', 1, false),
    ...createCurrencyTagItemDefaults(side, addressIndex, 'custom', 'custom', CURRENCY_CUSTOM_TAG_DEFAULT_COUNT, enabled),
  };
}

export function currencyTagCustomizeDefaults(): Record<string, unknown> {
  const entries: Record<string, unknown> = {};

  for (const side of ['from', 'to'] as const) {
    for (let addressIndex = 1; addressIndex <= MAX_CURRENCY_SIDE_ADDRESSES; addressIndex += 1) {
      Object.assign(
        entries,
        currencyAddressTagDefaults(side, addressIndex, addressIndex === 1),
      );
    }
  }

  return entries;
}

function buildTagSlotArray(
  side: 'from' | 'to',
  addressIndex: number,
  slot: CurrencyTagPanelSlot,
  family: 'system' | 'colorful' | 'custom',
  customize: Record<string, unknown>,
): CryptoAddressTagSlotConfig[] {
  const showKey = currencyTagShowKey(side, addressIndex, slot);
  if (customize[showKey] === false) return [];

  const count = parseCurrencyTagCount(customize, side, addressIndex, slot);

  return Array.from({ length: count }, (_, index) => {
    const tagIndex = index + 1;
    const tag: CryptoAddressTagSlotConfig = {
      show: true,
      size: 'sm' as TagSize,
      family,
      label: String(
        customize[currencyTagItemKey(side, addressIndex, slot, 'Label', tagIndex)] ??
          defaultTagItemValue(slot, tagIndex, 'Label'),
      ),
    };

    if (family === 'colorful') {
      tag.colorfulStyle = String(
        customize[currencyTagItemKey(side, addressIndex, slot, 'ColorfulStyle', tagIndex)] ??
          defaultTagItemValue(slot, tagIndex, 'ColorfulStyle'),
      ) as TagColorfulStyle;
    } else {
      tag.customStyle = String(
        customize[currencyTagItemKey(side, addressIndex, slot, 'CustomStyle', tagIndex)] ??
          defaultTagItemValue(slot, tagIndex, 'CustomStyle'),
      ) as TagCustomStyle;
    }

    return tag;
  });
}

export function buildCurrencyAddressTags(
  side: 'from' | 'to',
  addressIndex: number,
  customize: Record<string, unknown>,
): CryptoAddressSideTags {
  if (customize[currencyAddressTagsEnabledKey(side, addressIndex)] !== true) {
    return { system: [], custom: [] };
  }

  return {
    system: buildTagSlotArray(side, addressIndex, 'system', 'custom', customize),
    custom: buildTagSlotArray(side, addressIndex, 'custom', 'custom', customize),
  };
}

function localizeTagSlot(
  slot: CryptoAddressSideTags['system'],
  translate: (text: string) => string,
): CryptoAddressSideTags['system'] {
  if (!slot) return slot;
  const list = Array.isArray(slot) ? slot : [slot];
  return list.map((tag) => ({
    ...tag,
    label: tag.label ? translate(tag.label) : tag.label,
  }));
}

/** 地址 Tag label 走 ui()；须在 Receiver / Sender 等 UI 层调用。 */
export function localizeCurrencyAddressTags(
  tags: CryptoAddressSideTags,
  translate: (text: string) => string,
): CryptoAddressSideTags {
  return {
    system: localizeTagSlot(tags.system, translate),
    custom: localizeTagSlot(tags.custom, translate),
    ...(tags.more
      ? {
          more: {
            ...tags.more,
            label: tags.more.label ? translate(tags.more.label) : tags.more.label,
          },
        }
      : {}),
  };
}

export function buildCurrencySideTagsList(
  side: 'from' | 'to',
  customize: Record<string, unknown>,
): CryptoAddressSideTags[] {
  const addressCount = parseCurrencyAddressCount(customize[`${side}AddressCount`]);
  return Array.from({ length: addressCount }, (_, index) =>
    buildCurrencyAddressTags(side, index + 1, customize),
  );
}

export function currencyAddressRiskTagOverrides(
  side: 'from' | 'to',
  addressIndex: number,
  count = 1,
  enabled = true,
): Record<string, unknown> {
  return {
    [currencyTagShowKey(side, addressIndex, 'system')]: enabled,
    ...createCurrencyTagItemDefaults(side, addressIndex, 'system', 'custom', count, enabled),
  };
}

/** 接收方「黑名单」演示 Tag（label = Blacklist / 黑名单，非 AML 筛查结果 Danger）。 */
export function currencyAddressBlacklistTagOverrides(
  side: 'from' | 'to',
  addressIndex: number,
  count = 1,
  enabled = true,
): Record<string, unknown> {
  const entries: Record<string, unknown> = {
    ...currencyAddressRiskTagOverrides(side, addressIndex, count, enabled),
  };

  for (let tagIndex = 1; tagIndex <= count; tagIndex += 1) {
    entries[currencyTagItemKey(side, addressIndex, 'system', 'Label', tagIndex)] =
      BLACKLIST_LABEL_KEY;
  }

  return entries;
}

export function currencyAddressCustomTagOverrides(
  side: 'from' | 'to',
  addressIndex: number,
  count: number,
  enabled = true,
): Record<string, unknown> {
  return {
    [currencyTagShowKey(side, addressIndex, 'custom')]: enabled,
    ...createCurrencyTagItemDefaults(side, addressIndex, 'custom', 'custom', count, enabled),
  };
}

/** 指定自定义 Tag 文案（顺序与 labels 一致）。 */
export function currencyAddressCustomTagLabelOverrides(
  side: 'from' | 'to',
  addressIndex: number,
  labels: readonly string[],
  enabled = true,
): Record<string, unknown> {
  const entries: Record<string, unknown> = {
    [currencyTagShowKey(side, addressIndex, 'custom')]: enabled,
    [currencyTagCountKey(side, addressIndex, 'custom')]: String(labels.length),
  };

  labels.forEach((label, index) => {
    const tagIndex = index + 1;
    entries[currencyTagItemKey(side, addressIndex, 'custom', 'Label', tagIndex)] = label;
    entries[currencyTagItemKey(side, addressIndex, 'custom', 'CustomStyle', tagIndex)] =
      resolveCurrencyCustomTagStyleForLabel(label);
  });

  return entries;
}

/** @deprecated 使用 currencyAddressRiskTagOverrides */
export function currencyAddressSystemTagOverrides(
  side: 'from' | 'to',
  addressIndex: number,
  count: number,
  enabled = true,
): Record<string, unknown> {
  return currencyAddressRiskTagOverrides(side, addressIndex, count, enabled);
}

/** Data List 演示：第 2 条（0-based index 1，TON）接收方 AML 危险 tag。 */
export const CURRENCY_DEMO_ROW_TON_AML_TAG_INDEX = 1;

/** Data List 演示：第 3 条（0-based index 2）展示完整地址 tag 组合。 */
export const CURRENCY_DEMO_ROW_WITH_TAGS_INDEX = 2;

const CURRENCY_DEMO_ROWS_WITH_ADDRESS_TAGS = new Set<number>([
  CURRENCY_DEMO_ROW_WITH_TAGS_INDEX,
]);

function resolveCurrencyDemoRowsWithAddressTags(menuItem?: string): Set<number> {
  const rows = new Set(CURRENCY_DEMO_ROWS_WITH_ADDRESS_TAGS);
  if (tasksDataListShowsAddressBlacklist(menuItem)) {
    rows.add(CURRENCY_DEMO_ROW_TON_AML_TAG_INDEX);
  }
  return rows;
}

export function applyCurrencyRowTagVisibility(
  customize: Record<string, unknown>,
  rowIndex: number,
  menuItem?: string,
): Record<string, unknown> {
  if (resolveCurrencyDemoRowsWithAddressTags(menuItem).has(rowIndex)) {
    return customize;
  }

  const next = { ...customize };

  for (const side of ['from', 'to'] as const) {
    for (let addressIndex = 1; addressIndex <= MAX_CURRENCY_SIDE_ADDRESSES; addressIndex += 1) {
      next[currencyAddressTagsEnabledKey(side, addressIndex)] = false;
      next[currencyTagShowKey(side, addressIndex, 'system')] = false;
      next[currencyTagShowKey(side, addressIndex, 'custom')] = false;
    }
  }

  return next;
}
