import { onMounted, ref, type Ref } from 'vue';

export type AppLocale = 'zh-CN' | 'en';

const LOCALE_STORAGE_KEY = 'cregis-locale-pref';

export const APP_LOCALE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
] as const satisfies readonly { value: AppLocale; label: string }[];

const locale: Ref<AppLocale> = ref('zh-CN');
let initialized = false;

function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'zh-CN';

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'zh-CN' || stored === 'en') return stored;

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
