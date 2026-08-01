import { onMounted, ref, type Ref } from 'vue';

export type AppLocale = 'zh-CN' | 'zh-TW' | 'en';

/** 账户设置 Preference 持久化；Shell Debug 切换不写 storage。 */
const LOCALE_USER_PREF_KEY = 'cregis-locale-user-pref-v2';
/** @deprecated Shell Debug / 旧版 Preference 写入；启动时清除，默认简体。 */
const DEPRECATED_LOCALE_KEYS = ['cregis-locale-pref', 'cregis-locale-user-pref'] as const;

export const APP_LOCALE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en', label: 'English' },
] as const satisfies readonly { value: AppLocale; label: string }[];

/** Shell debug Model popover value labels (distinct from dropdown item labels). */
export const APP_LOCALE_SHELL_LABELS: Record<AppLocale, string> = {
  'zh-CN': '汉语简体',
  'zh-TW': '汉语繁体',
  en: 'English',
};

export const APP_LOCALE_CYCLE: readonly AppLocale[] = ['zh-CN', 'zh-TW', 'en'];

export function isChineseLocale(locale: AppLocale): boolean {
  return locale === 'zh-CN' || locale === 'zh-TW';
}

const locale: Ref<AppLocale> = ref('zh-CN');
let initialized = false;

function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'zh-CN';

  const userPref = localStorage.getItem(LOCALE_USER_PREF_KEY);
  if (userPref === 'zh-CN' || userPref === 'zh-TW' || userPref === 'en') return userPref;

  for (const key of DEPRECATED_LOCALE_KEYS) {
    localStorage.removeItem(key);
  }

  return 'zh-CN';
}

export function applyAppLocale(
  next: AppLocale,
  target: HTMLElement = document.documentElement,
  options?: { persist?: boolean },
) {
  locale.value = next;
  target.lang = next;
  if (options?.persist) {
    localStorage.setItem(LOCALE_USER_PREF_KEY, next);
    for (const key of DEPRECATED_LOCALE_KEYS) {
      localStorage.removeItem(key);
    }
  }
}

export function initAppLocale() {
  if (initialized || typeof window === 'undefined') return;
  applyAppLocale(readStoredLocale(), document.documentElement);
  initialized = true;
}

export function useAppLocale() {
  onMounted(() => {
    initAppLocale();
  });

  /** 账户设置等用户显式选择 — 持久化。 */
  function setLocale(next: AppLocale) {
    applyAppLocale(next, document.documentElement, { persist: true });
  }

  /** Shell Debug 等预览切换 — 仅当前会话，刷新后恢复默认/已保存偏好。 */
  function setLocalePreview(next: AppLocale) {
    applyAppLocale(next, document.documentElement);
  }

  return { locale, setLocale, setLocalePreview };
}
