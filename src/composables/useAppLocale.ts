import { onMounted, ref, type Ref } from 'vue';

export type AppLocale = 'zh-CN' | 'zh-TW' | 'en';

/** 账户设置 Preference 持久化；Shell Debug 切换不写 storage。 */
const LOCALE_USER_PREF_KEY = 'cregis-locale-user-pref';
/** @deprecated Shell Debug 曾误写入此 key；仅迁移 zh 偏好，忽略 en。 */
const LEGACY_LOCALE_STORAGE_KEY = 'cregis-locale-pref';

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

  const legacy = localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
  if (legacy === 'zh-CN' || legacy === 'zh-TW') {
    localStorage.setItem(LOCALE_USER_PREF_KEY, legacy);
    localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
    return legacy;
  }
  if (legacy === 'en') {
    localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
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
    localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
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
