import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import type { AppLocale } from '@/composables/useAppLocale';
import { useAppI18n } from '@/composables/useAppI18n';
import { resolveEnglishUiText } from '@/i18n/translateUiText';
import { UI_TEXT_ZH_CN } from '@/i18n/uiTextZhCN';
import {
  isTasksDataListMenuItem,
  TASKS_MODULE_MENU_ITEMS_WITH_DATA_LIST,
  type TasksDataListMenuItemLabel,
} from '@/scenes/tasks/tasksDataListPageData';

export type ShellPageKey = `${string}:${string}`;

function readAppLocale(): AppLocale {
  const lang = document.documentElement.lang.trim();
  return lang === 'zh-CN' ? 'zh-CN' : 'en';
}

/** 模块菜单文案去掉末尾计数角标（如「待签名99+99+」→「待签名」）。 */
export function normalizeModuleMenuLabel(raw: string): string {
  return raw
    .replace(/(?:\s*\d+\+?\s*)+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readFocusedModuleMenuItem(preview: Element): Element | null {
  const focused = preview.querySelector(
    '.eds-module-menu-item[class*="itemFocused"], .eds-module-menu-item[aria-pressed="true"]',
  );
  return focused instanceof Element ? focused : null;
}

function readFocusedModuleMenuLabel(preview: Element): string | null {
  const focused = readFocusedModuleMenuItem(preview);
  if (!focused) {
    return null;
  }

  const labelEl = focused.querySelector('[class*="itemLabel"]');
  const labelText = labelEl?.textContent?.replace(/\s+/g, ' ').trim();
  if (labelText) {
    return labelText;
  }

  const text = focused.textContent?.replace(/\s+/g, ' ').trim();
  return text ? normalizeModuleMenuLabel(text) : null;
}

function resolveTasksMenuItemLabel(raw: string): TasksDataListMenuItemLabel | null {
  const normalized = normalizeModuleMenuLabel(raw);
  if (!normalized) {
    return null;
  }

  if (isTasksDataListMenuItem(normalized)) {
    return normalized;
  }

  const english = resolveEnglishUiText(readAppLocale(), normalized);
  if (isTasksDataListMenuItem(english)) {
    return english;
  }

  /** 「待签名」等文案在 catalog 中对应多个英文 key，反向 map 会歧义；按 Tasks 菜单项逐一匹配。 */
  for (const item of TASKS_MODULE_MENU_ITEMS_WITH_DATA_LIST) {
    const catalogZh = UI_TEXT_ZH_CN[item];
    if (typeof catalogZh === 'string' && normalizeModuleMenuLabel(catalogZh) === normalized) {
      return item;
    }
  }

  return null;
}

function readDataListToolbarTitle(preview: Element): string | null {
  const titleEl = preview.querySelector('.eds-tool-bar-title p, .eds-tool-bar-title');
  const text = titleEl?.textContent?.replace(/\s+/g, ' ').trim();
  return text ? normalizeModuleMenuLabel(text) : null;
}

function resolveTasksPageKeyFromPreview(preview: Element): ShellPageKey {
  const menuLabel = readFocusedModuleMenuLabel(preview);
  if (menuLabel) {
    const item = resolveTasksMenuItemLabel(menuLabel);
    if (item) {
      return `Tasks:${item}`;
    }
  }

  const toolbarTitle = readDataListToolbarTitle(preview);
  if (toolbarTitle) {
    const item = resolveTasksMenuItemLabel(toolbarTitle);
    if (item) {
      return `Tasks:${item}`;
    }
  }

  return 'Tasks:unknown';
}

export function resolvePageKeyFromDom(): ShellPageKey {
  const preview = document.querySelector('.app-preview');
  if (!preview) {
    return 'unknown:unknown';
  }

  if (preview.querySelector('.eds-data-list')) {
    return resolveTasksPageKeyFromPreview(preview);
  }

  const menuLabel = readFocusedModuleMenuLabel(preview);
  if (menuLabel?.toLowerCase().includes('preference') || menuLabel?.includes('偏好')) {
    return 'Account Settings:Preference';
  }

  return 'App:Shell';
}

export function readShellPageDisplayLabelFromDom(): string | null {
  const preview = document.querySelector('.app-preview');
  if (!preview) {
    return null;
  }

  const menuLabel = readFocusedModuleMenuLabel(preview);
  if (menuLabel) {
    return normalizeModuleMenuLabel(menuLabel);
  }

  const toolbarTitle = readDataListToolbarTitle(preview);
  return toolbarTitle ? normalizeModuleMenuLabel(toolbarTitle) : null;
}

export function resolveShellPageDisplayName(
  pageKey: ShellPageKey,
  ui: (key: string) => string,
): string {
  const [module, page] = pageKey.split(':');

  if (module === 'Tasks' && isTasksDataListMenuItem(page)) {
    return ui(page);
  }

  if (pageKey === 'Account Settings:Preference') {
    return ui('Preference');
  }

  if (pageKey === 'App:Shell') {
    return ui('Tasks');
  }

  if (module === 'Tasks' && page === 'unknown') {
    return readAppLocale() === 'zh-CN' ? '未知页面' : 'Unknown page';
  }

  if (pageKey === 'unknown:unknown') {
    return readAppLocale() === 'zh-CN' ? '未知页面' : 'Unknown page';
  }

  return readAppLocale() === 'zh-CN' ? '未知页面' : 'Unknown page';
}

export function useShellPageKey(): Ref<ShellPageKey> {
  const pageKey = ref<ShellPageKey>(resolvePageKeyFromDom());
  let observer: MutationObserver | undefined;

  function sync() {
    pageKey.value = resolvePageKeyFromDom();
  }

  onMounted(() => {
    sync();
    observer = new MutationObserver(sync);
    const preview = document.querySelector('.app-preview');
    if (preview) {
      observer.observe(preview, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'aria-current', 'aria-pressed'],
      });
    }
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = undefined;
  });

  return pageKey;
}

export function useShellPageContext() {
  const pageKey = useShellPageKey();
  const { ui } = useAppI18n();

  const pageDisplayName = computed(() => {
    const key = pageKey.value;
    if (key !== 'Tasks:unknown' && key !== 'unknown:unknown') {
      return resolveShellPageDisplayName(key, ui);
    }

    const fromDom = readShellPageDisplayLabelFromDom();
    if (fromDom) {
      const item = resolveTasksMenuItemLabel(fromDom);
      if (item) {
        return ui(item);
      }
      return fromDom;
    }

    return resolveShellPageDisplayName(key, ui);
  });

  const effectivePageKey = computed((): ShellPageKey => {
    const key = pageKey.value;
    if (key !== 'Tasks:unknown') {
      return key;
    }

    const fromDom = readShellPageDisplayLabelFromDom();
    if (fromDom) {
      const item = resolveTasksMenuItemLabel(fromDom);
      if (item) {
        return `Tasks:${item}`;
      }
    }

    return key;
  });

  return {
    pageKey,
    effectivePageKey,
    pageDisplayName,
  };
}
