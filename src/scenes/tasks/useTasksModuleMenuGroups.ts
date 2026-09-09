import { computed } from 'vue';
import {
  getCregisModuleMenuGroups,
  type ModuleMenuPresetGroup,
  type ModuleMenuPresetItem,
} from '@eds/desktop-components';
import { formatModuleMenuBadgeCount } from '@/scenes/tasks/approval/formatModuleMenuBadgeCount';
import { tasksModuleMenuDataVolumes } from '@/scenes/tasks/tasksModuleMenuDataVolume';
import type { TasksDataListMenuItemLabel } from '@/scenes/tasks/tasksDataListPageData';

const TODO_MENU_BADGE_RESOLVERS: Partial<
  Record<TasksDataListMenuItemLabel, () => number>
> = {
  Approval: () => tasksModuleMenuDataVolumes.value.Approval,
  Signing: () => tasksModuleMenuDataVolumes.value.Signing,
};

function withTodoMenuBadge(item: ModuleMenuPresetItem): ModuleMenuPresetItem {
  const resolveCount = TODO_MENU_BADGE_RESOLVERS[item.label as TasksDataListMenuItemLabel];
  if (!resolveCount) return item;

  const count = resolveCount();
  const message = formatModuleMenuBadgeCount(count);

  if (count <= 0) {
    return {
      ...item,
      message,
      messageType: 'subtle',
      focusBackground: 'inherit',
    };
  }

  return {
    ...item,
    message,
    messageType: 'danger',
    focusBackground: 'same-white',
  };
}

export function useTasksModuleMenuGroups() {
  return computed<ModuleMenuPresetGroup[]>(() => {
    void tasksModuleMenuDataVolumes.value;

    return getCregisModuleMenuGroups('Tasks').map((group) => ({
      ...group,
      items: group.items.map(withTodoMenuBadge),
    }));
  });
}
