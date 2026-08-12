import type { AppLocale } from '@/composables/useAppLocale';
import { UI_TEXT_ZH_CN } from '@/i18n/uiTextZhCN';

const ENGLISH_BY_ZH = Object.fromEntries(
  Object.entries(UI_TEXT_ZH_CN).map(([english, chinese]) => [chinese, english]),
) as Record<string, string>;

/** 中英文可共用的展示文案（如矿工费区间、金额），catalog 值不含 CJK。 */
function isLocaleNeutralDisplayText(text: string): boolean {
  return !/[\u3400-\u9fff\uf900-\ufaff]/.test(text);
}

/** 展示层翻译：英文 source → 当前 locale 文案。 */
export function translateUiText(locale: AppLocale, text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const catalogValue = UI_TEXT_ZH_CN[trimmed];
  if (catalogValue) {
    if (locale === 'zh-CN') return catalogValue;
    if (isLocaleNeutralDisplayText(catalogValue)) return catalogValue;
  }

  if (locale === 'en') return text;

  if (trimmed.startsWith('Sort ')) {
    const header = trimmed.slice('Sort '.length);
    return `${UI_TEXT_ZH_CN.Sort ?? '排序'} ${translateUiText(locale, header)}`;
  }

  return text;
}

/** 将可能已翻译的 Nav / 菜单 label 还原为英文 key（路由用）。 */
export function resolveEnglishUiText(locale: AppLocale, text: string): string {
  const trimmed = text.trim();
  if (!trimmed || locale === 'en') return trimmed;

  if (UI_TEXT_ZH_CN[trimmed]) return trimmed;

  const english = ENGLISH_BY_ZH[trimmed];
  if (english) return english;

  if (trimmed.startsWith(`${UI_TEXT_ZH_CN.Sort ?? '排序'} `)) {
    const headerZh = trimmed.slice((UI_TEXT_ZH_CN.Sort ?? '排序').length + 1);
    const headerEn = ENGLISH_BY_ZH[headerZh] ?? headerZh;
    return `Sort ${headerEn}`;
  }

  return trimmed;
}
