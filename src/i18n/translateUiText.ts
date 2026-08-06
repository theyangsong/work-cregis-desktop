import type { AppLocale } from '@/composables/useAppLocale';
import { UI_TEXT_ZH_CN } from '@/i18n/uiTextZhCN';

const ENGLISH_BY_ZH = Object.fromEntries(
  Object.entries(UI_TEXT_ZH_CN).map(([english, chinese]) => [chinese, english]),
) as Record<string, string>;

/** 展示层翻译：英文 source → 当前 locale 文案。 */
export function translateUiText(locale: AppLocale, text: string): string {
  const trimmed = text.trim();
  if (!trimmed || locale === 'en') return text;

  const translated = UI_TEXT_ZH_CN[trimmed];
  if (translated) return translated;

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
