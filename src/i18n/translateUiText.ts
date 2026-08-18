import type { AppLocale } from '@/composables/useAppLocale';
import { COLLABORATION_KEY_RENAMES } from '@/i18n/collaborationLocaleOverrides';
import { I18N_NAV_MODULE_MENU_CATALOG_KEYS } from '@/i18n/i18nNavModuleMenuKeys';
import { I18N_DOC_ALIGNED_KEYS } from '@/i18n/i18nDocAlignedKeys';
import { I18N_DOC_EN_LABELS } from '@/i18n/i18nDocEnLabels';
import { UI_TEXT_ZH_CN } from '@/i18n/uiTextZhCN';
import { UI_TEXT_ZH_TW } from '@/i18n/uiTextZhTW';

const ENGLISH_BY_ZH_CN = Object.fromEntries(
  Object.entries(UI_TEXT_ZH_CN).map(([english, chinese]) => [chinese, english]),
) as Record<string, string>;

const ENGLISH_BY_ZH_TW = Object.fromEntries(
  Object.entries(UI_TEXT_ZH_TW).map(([english, traditional]) => [traditional, english]),
) as Record<string, string>;

/** 中英文可共用的展示文案（如矿工费区间、金额），catalog 值不含 CJK。 */
function isLocaleNeutralDisplayText(text: string): boolean {
  return !/[\u3400-\u9fff\uf900-\ufaff]/.test(text);
}

function isDocAligned(catalogKey: string): boolean {
  return I18N_DOC_ALIGNED_KEYS.has(catalogKey);
}

/**
 * 展示层翻译（唯一入口）。
 *
 * 1. zh-CN catalog 为基准；英文 / 繁体仅来自 Excel + 核对表。
 * 2. 表外（未在 I18N_DOC_ALIGNED_KEYS）→ en / zh-TW / zh-CN 均显示 catalog 简体中文。
 * 3. UI 标签 / 固定文案须走 ui() / 本函数（页面、详情 title、弹窗、tooltip、tag…）。
 * 4. 字段 value、人名、地址、金额等业务数据禁止传入本函数（见 work.mdc §5）。
 * 5. en：表内用 Excel en-us（I18N_DOC_EN_LABELS）；表外显示 catalog 简体；无 doc 映射时不二次 Title Case。
 */
export function translateUiText(locale: AppLocale, text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const catalogKey = COLLABORATION_KEY_RENAMES[trimmed] ?? trimmed;
  const catalogValue = UI_TEXT_ZH_CN[catalogKey];
  if (catalogValue) {
    if (locale === 'zh-CN') return catalogValue;

    // 规则 2：源文档 / 核对表无 zh-cn 匹配 → 三语显示 catalog 简体中文。
    if (!isDocAligned(catalogKey)) {
      return catalogValue;
    }

    if (locale === 'zh-TW') {
      return UI_TEXT_ZH_TW[catalogKey] ?? catalogValue;
    }
    if (I18N_NAV_MODULE_MENU_CATALOG_KEYS.has(catalogKey)) {
      return catalogKey;
    }
    if (isLocaleNeutralDisplayText(catalogValue)) return catalogValue;
    return I18N_DOC_EN_LABELS[catalogKey] ?? catalogKey;
  }

  if (trimmed.startsWith('Sort ')) {
    const header = trimmed.slice('Sort '.length);
    const sortLabel =
      locale === 'zh-TW'
        ? (UI_TEXT_ZH_TW.Sort ?? UI_TEXT_ZH_CN.Sort ?? '排序')
        : (UI_TEXT_ZH_CN.Sort ?? '排序');
    return `${sortLabel} ${translateUiText(locale, header)}`;
  }

  // 无 catalog 基准：无法核对表；三语回显原文便于补 key（应尽快写入 uiTextZhCN）。
  return text;
}

/** 将可能已翻译的 Nav / 菜单 label 还原为英文 key（路由用）。 */
export function resolveEnglishUiText(locale: AppLocale, text: string): string {
  const trimmed = text.trim();
  if (!trimmed || locale === 'en') return trimmed;

  if (UI_TEXT_ZH_CN[trimmed]) return trimmed;

  const englishByLocale =
    locale === 'zh-TW' ? (ENGLISH_BY_ZH_TW[trimmed] ?? ENGLISH_BY_ZH_CN[trimmed]) : ENGLISH_BY_ZH_CN[trimmed];
  if (englishByLocale) return englishByLocale;

  const sortLabel =
    locale === 'zh-TW'
      ? (UI_TEXT_ZH_TW.Sort ?? UI_TEXT_ZH_CN.Sort ?? '排序')
      : (UI_TEXT_ZH_CN.Sort ?? '排序');
  if (trimmed.startsWith(`${sortLabel} `)) {
    const headerZh = trimmed.slice(sortLabel.length + 1);
    const headerEn =
      locale === 'zh-TW'
        ? (ENGLISH_BY_ZH_TW[headerZh] ?? ENGLISH_BY_ZH_CN[headerZh] ?? headerZh)
        : (ENGLISH_BY_ZH_CN[headerZh] ?? headerZh);
    return `Sort ${headerEn}`;
  }

  return trimmed;
}
