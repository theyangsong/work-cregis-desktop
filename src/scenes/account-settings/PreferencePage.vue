<script setup lang="ts">
import { computed } from 'vue';
import { useThemeProvider, type ThemeMode } from '@eds/desktop-components';
import AppShellPreferenceSelect from '@/components/AppShellPreferenceSelect.vue';
import { useAppI18n } from '@/composables/useAppI18n';
import { APP_LOCALE_OPTIONS, useAppLocale } from '@/composables/useAppLocale';
import styles from './PreferencePage.module.css';

const { locale, setLocale } = useAppLocale();
const { messages } = useAppI18n();
const { theme, setTheme } = useThemeProvider();
const themeValue = computed(() => theme.value);

const themeOptions = computed(() => [
  { value: 'light', label: messages.value.preferenceLight },
  { value: 'dark', label: messages.value.preferenceDark },
] as const);

function onLocaleChange(value: string) {
  if (value === 'zh-CN' || value === 'en') {
    setLocale(value);
  }
}

function onThemeChange(value: string) {
  if (value === 'light' || value === 'dark') {
    setTheme(value as ThemeMode);
  }
}
</script>

<template>
  <div class="desktopTokens" :class="styles.page">
    <div :class="styles.panel">
      <AppShellPreferenceSelect
        :model-value="locale"
        :options="APP_LOCALE_OPTIONS"
        :aria-label="messages.preferenceLanguage"
        @update:model-value="onLocaleChange"
      />
      <AppShellPreferenceSelect
        :model-value="themeValue"
        :options="themeOptions"
        :aria-label="messages.preferenceTheme"
        @update:model-value="onThemeChange"
      />
    </div>
  </div>
</template>
