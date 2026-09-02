import type { TagCustomStyle } from '@eds/desktop-components';

/** AML 结果 Tag：DS 四种 aml-* 样式，文案走 ui() 短 label。 */
export const DETAIL_AML_SEARCH_RESULT_VARIANTS = [
  { labelKey: 'Danger', customStyle: 'aml-danger' },
  { labelKey: 'Safe', customStyle: 'aml-safe' },
  { labelKey: 'Suspicious', customStyle: 'aml-suspicious' },
  { labelKey: 'No result', customStyle: 'aml-invalid' },
] as const satisfies readonly {
  labelKey: string;
  customStyle: TagCustomStyle;
}[];

export type DetailAmlSearchResultVariant =
  (typeof DETAIL_AML_SEARCH_RESULT_VARIANTS)[number];

export const DETAIL_AML_RESULT_CUSTOM_STYLES = [
  'aml-danger',
  'aml-safe',
  'aml-suspicious',
  'aml-invalid',
] as const satisfies readonly TagCustomStyle[];

export function pickRandomDetailAmlSearchResult(): DetailAmlSearchResultVariant {
  const index = Math.floor(Math.random() * DETAIL_AML_SEARCH_RESULT_VARIANTS.length);
  return DETAIL_AML_SEARCH_RESULT_VARIANTS[index]!;
}

export function isDetailAmlResultCustomStyle(
  customStyle: string | undefined,
): customStyle is DetailAmlSearchResultVariant['customStyle'] {
  return DETAIL_AML_RESULT_CUSTOM_STYLES.includes(
    customStyle as DetailAmlSearchResultVariant['customStyle'],
  );
}

function labelMatchesKey(
  label: string,
  key: string,
  translate?: (key: string) => string,
): boolean {
  const translated = translate ? translate(key) : key;
  return label === key || label === translated;
}

export function tagMatchesDetailAmlSearchResult(
  tag: { label?: string; customStyle?: string },
  translate?: (key: string) => string,
): boolean {
  if (isDetailAmlResultCustomStyle(tag.customStyle)) return true;

  const label = String(tag.label ?? '').trim();
  return DETAIL_AML_SEARCH_RESULT_VARIANTS.some(({ labelKey }) =>
    labelMatchesKey(label, labelKey, translate),
  );
}
