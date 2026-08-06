import { computed } from 'vue';
import { translateAppMessage, type AppMessageKey } from '@/i18n/appMessages';
import { translateUiText } from '@/i18n/translateUiText';
import { useAppLocale } from './useAppLocale';

export function useAppI18n() {
  const { locale } = useAppLocale();

  function t(key: AppMessageKey): string {
    return translateAppMessage(locale.value, key);
  }

  function ui(text: string | undefined | null): string {
    if (text == null) return '';
    return translateUiText(locale.value, String(text));
  }

  const messages = computed(() => ({
    preferenceLanguage: translateAppMessage(locale.value, 'preference.language'),
    preferenceTheme: translateAppMessage(locale.value, 'preference.theme'),
    preferenceLight: translateAppMessage(locale.value, 'preference.light'),
    preferenceDark: translateAppMessage(locale.value, 'preference.dark'),
    appShellMainHint: translateAppMessage(locale.value, 'appShell.mainHint'),
  }));

  return { t, ui, messages, locale };
}
