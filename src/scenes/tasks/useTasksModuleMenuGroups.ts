import { computed } from 'vue';
import {
  getCregisModuleMenuGroups,
  type ModuleMenuPresetGroup,
  type ModuleMenuPresetItem,
} from '@/presets/module-menu/cregisModuleMenuGroups';
import {
  approvalStoreRevision,
  countPendingApprovals,
} from '@/scenes/tasks/approval/approvalStore';
import { formatModuleMenuBadgeCount } from '@/scenes/tasks/approval/formatModuleMenuBadgeCount';
import {
  countPendingSignings,
  signingStoreRevision,
} from '@/scenes/tasks/signing/signingStore';
import { DATA_LIST_APPROVAL_ROW_COUNT, DATA_LIST_SIGNING_ROW_COUNT } from '@/scenes/tasks/tasksDataListPageData';

const TODO_MENU_BADGE_RESOLVERS: Record<string, () => number> = {
  Approval: () => countPendingApprovals(DATA_LIST_APPROVAL_ROW_COUNT),
  Signing: () => countPendingSignings(DATA_LIST_SIGNING_ROW_COUNT),
};

function withTodoMenuBadge(item: ModuleMenuPresetItem): ModuleMenuPresetItem {
  const resolveCount = TODO_MENU_BADGE_RESOLVERS[item.label];
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
    void approvalStoreRevision.value;
    void signingStoreRevision.value;

    return getCregisModuleMenuGroups('Tasks').map((group) => ({
      ...group,
      items: group.items.map(withTodoMenuBadge),
    }));
  });
}
