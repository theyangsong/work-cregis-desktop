import { onMounted, ref, type Ref } from 'vue';

export type AppLocale = 'zh-CN' | 'zh-TW' | 'en';

const LOCALE_STORAGE_KEY = 'cregis-locale-pref';

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

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'zh-CN' || stored === 'zh-TW' || stored === 'en') return stored;

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
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
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

  function setLocale(next: AppLocale) {
    applyAppLocale(next, document.documentElement, { persist: true });
  }

  return { locale, setLocale };
}
