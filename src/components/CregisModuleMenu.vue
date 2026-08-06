<script setup lang="ts">
import { computed } from 'vue';
import {
  EgAvatar,
  EgFlotation,
  EgFlotationTrigger,
  EgIcon,
  EgModuleMenu,
  EgModuleMenuGroup,
  EgModuleMenuItem,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  moduleMenuBusinessTitleUsesFlotationTitle,
  type CregisModuleMenuBusinessTitle,
} from '@/presets/module-menu/businessModuleTitles';
import {
  cregisModuleMenuTitleFlotationItems,
  cregisModuleMenuTitleFlotationProps,
  resolveCregisModuleMenuFlotationTitle,
} from '@/presets/module-menu/cregisModuleMenuFlotationTitle';
import type { ModuleMenuPresetGroup } from '@/presets/module-menu/cregisModuleMenuGroups';

const props = defineProps<{
  title: CregisModuleMenuBusinessTitle;
  groups: ModuleMenuPresetGroup[];
}>();

const emit = defineEmits<{
  itemSelect: [label: string];
}>();

const { ui } = useAppI18n();

const flotationMenuItems = computed(() =>
  cregisModuleMenuTitleFlotationItems.map((item) => ({
    ...item,
    tag: item.tag ? ui(item.tag) : item.tag,
  })),
);

const flotationMenuProps = computed(() => ({
  ...cregisModuleMenuTitleFlotationProps,
  addLabel: ui(cregisModuleMenuTitleFlotationProps.addLabel),
}));

function onItemClick(label: string) {
  emit('itemSelect', label);
}

const usesFlotationTitle = computed(() =>
  moduleMenuBusinessTitleUsesFlotationTitle('cregis', props.title),
);

const menuTitle = computed(() => {
  const raw = usesFlotationTitle.value
    ? resolveCregisModuleMenuFlotationTitle(props.title)
    : props.title;
  return ui(raw);
});
</script>

<template>
  <EgModuleMenu
    :key="title"
    :title="menuTitle"
    :title-mode="usesFlotationTitle ? 'trigger' : 'text'"
  >
    <template v-if="usesFlotationTitle" #title>
      <EgFlotation
        v-bind="flotationMenuProps"
        :items="flotationMenuItems"
      >
        <template #trigger="{ expanded, selectedItem, hasAnyItemReddot }">
          <EgFlotationTrigger
            module-menu-title
            trigger-style="text"
            width-mode="trigger"
            :label="selectedItem?.label ?? menuTitle"
            :show-reddot="hasAnyItemReddot"
            :expanded="expanded"
          />
        </template>
      </EgFlotation>
    </template>

    <EgModuleMenuGroup
      v-for="(group, groupIndex) in groups"
      :key="`module-menu-group-${groupIndex}`"
      :title="group.title ? ui(group.title) : undefined"
    >
      <template
        v-for="(item, itemIndex) in group.items"
        :key="`module-menu-group-${groupIndex}-item-${itemIndex}`"
      >
        <EgModuleMenuItem
          :tier="item.tier ?? 1"
          :label="ui(item.label)"
          :message="item.message?.trim() || undefined"
          :message-type="item.messageType ?? 'subtle'"
          :message-focus-background="item.focusBackground ?? 'inherit'"
          :show-reddot="Boolean(item.showReddot)"
          @click="onItemClick(item.label)"
        >
          <template #icon>
            <EgAvatar
              v-if="item.avatar"
              :name="item.avatar.name"
              :size="item.avatar.size ?? 'sm'"
              :color-index="item.avatar.colorIndex"
            />
            <EgIcon v-else :name="item.icon" size="sm" />
          </template>
          <template v-if="(item.tier ?? 1) === 2 && item.subitems?.length">
            <EgModuleMenuItem
              v-for="(subItem, subIndex) in item.subitems"
              :key="`module-menu-group-${groupIndex}-item-${itemIndex}-sub-${subIndex}`"
              subitem
              :label="ui(subItem.label)"
              @click="onItemClick(subItem.label)"
            >
              <template #icon>
                <EgIcon :name="subItem.icon" size="sm" />
              </template>
            </EgModuleMenuItem>
          </template>
        </EgModuleMenuItem>
      </template>
    </EgModuleMenuGroup>
  </EgModuleMenu>
</template>
