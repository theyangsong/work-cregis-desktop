<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { EgCregisModuleMenu, EgCregisNavBar, EgLayout } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import PreferencePage from '@/scenes/account-settings/PreferencePage.vue';
import {
  DEFAULT_CREGIS_MODULE_MENU_BUSINESS_TITLE,
  navLabelShouldHideModuleMenu,
  resolveNavChromeLabelToModuleMenuTitle,
  type CregisModuleMenuBusinessTitle,
} from '@/presets/module-menu/businessModuleTitles';
import { resolveEnglishUiText } from '@/i18n/translateUiText';
import TasksDataListPage from '@/scenes/tasks/TasksDataListPage.vue';
import { setMultiSignCollaborationModuleActive } from '@/scenes/tasks/signing/multiSignInvitation/multiSignInvitationStore';
import { useTasksModuleMenuGroups } from '@/scenes/tasks/useTasksModuleMenuGroups';
import {
  DEFAULT_TASKS_DATA_LIST_MENU_ITEM,
  isTasksDataListMenuItem,
  resolveTasksModuleMenuDisplayLabel,
  type TasksDataListMenuItemLabel,
} from '@/scenes/tasks/tasksDataListPageData';

const { messages, ui, locale } = useAppI18n();

function translateModuleMenu(text: string) {
  return ui(resolveTasksModuleMenuDisplayLabel(text, locale.value));
}

const activeModuleTitle = ref<CregisModuleMenuBusinessTitle>(
  DEFAULT_CREGIS_MODULE_MENU_BUSINESS_TITLE,
);

const activeNavLabel = ref('Wallet');

const activeModuleMenuItem = ref<string | null>(null);

const showModuleMenu = computed(() => !navLabelShouldHideModuleMenu(activeNavLabel.value));

const showTasksDataList = computed(
  () =>
    activeModuleTitle.value === 'Tasks' &&
    activeModuleMenuItem.value !== null &&
    isTasksDataListMenuItem(activeModuleMenuItem.value),
);

const showPreferencePage = computed(
  () => activeModuleTitle.value === 'Account Settings' && activeModuleMenuItem.value === 'Preference',
);

const tasksModuleMenuGroups = useTasksModuleMenuGroups();

watch(activeModuleTitle, (title) => {
  if (title === 'Tasks') {
    activeModuleMenuItem.value = DEFAULT_TASKS_DATA_LIST_MENU_ITEM;
    return;
  }
  if (title === 'Account Settings') {
    activeModuleMenuItem.value = 'Preference';
    return;
  }
  activeModuleMenuItem.value = null;
}, { immediate: true });

watch(
  [activeModuleTitle, activeModuleMenuItem],
  ([title, item]) => {
    setMultiSignCollaborationModuleActive(title === 'Tasks' && item === 'Signing');
  },
  { immediate: true },
);

function onNavClick(event: MouseEvent) {
  const button = (event.target as HTMLElement | null)?.closest('button');
  if (!button?.closest('.eds-nav-bar')) return;

  const label = button.getAttribute('aria-label') ?? '';
  const englishLabel = resolveEnglishUiText(locale.value, label);
  if (englishLabel.trim()) activeNavLabel.value = englishLabel;

  const title = resolveNavChromeLabelToModuleMenuTitle(englishLabel);
  if (title) activeModuleTitle.value = title;
}

function onModuleMenuItemSelect(label: string) {
  if (activeModuleTitle.value === 'Tasks') {
    if (isTasksDataListMenuItem(label)) {
      activeModuleMenuItem.value = label as TasksDataListMenuItemLabel;
    }
    return;
  }

  if (activeModuleTitle.value === 'Account Settings') {
    activeModuleMenuItem.value = label;
  }
}
</script>

<template>
  <EgLayout type="free">
    <template #nav>
      <div class="app-shell-nav" @click.capture="onNavClick">
        <EgCregisNavBar :translate="ui" />
      </div>
    </template>

    <template v-if="showModuleMenu" #moduleMenu>
      <EgCregisModuleMenu
        :title="activeModuleTitle"
        :translate="translateModuleMenu"
        :groups="activeModuleTitle === 'Tasks' ? tasksModuleMenuGroups : undefined"
        @item-select="onModuleMenuItemSelect"
      />
    </template>

    <TasksDataListPage
      v-if="showTasksDataList && activeModuleMenuItem"
      :key="activeModuleMenuItem"
      :toolbar-title="activeModuleMenuItem"
    />
    <PreferencePage v-else-if="showPreferencePage" />
    <div v-else class="app-shell-main">
      <p class="app-shell-main__hint">{{ messages.appShellMainHint }}</p>
    </div>
  </EgLayout>
</template>

<style scoped>
.app-shell-nav {
  display: contents;
}

.app-shell-main {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
}

.app-shell-main__hint {
  margin: 0;
  color: var(--text-base-secondary);
  font-size: var(--eds-body-medium-size);
  font-weight: var(--eds-body-medium-weight);
  line-height: var(--eds-body-medium-line-height);
}
</style>
