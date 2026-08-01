<script setup lang="ts">
import {
  EgIcon,
  EgLayout,
  EgModuleMenu,
  EgModuleMenuGroup,
  EgModuleMenuItem,
  EgNavBar,
} from '@eds/desktop-components';
import { cregisModuleMenuGroups } from '@/presets/module-menu/cregisModuleMenuGroups';
import { cregisNavBarDeclarativeAttrs } from '@/presets/nav/cregisNavBarDeclarative';
</script>

<template>
  <EgLayout type="free">
    <template #nav>
      <EgNavBar v-bind="cregisNavBarDeclarativeAttrs" />
    </template>

    <template #moduleMenu>
      <EgModuleMenu title="Wallet">
        <EgModuleMenuGroup
          v-for="(group, groupIndex) in cregisModuleMenuGroups"
          :key="`module-menu-group-${groupIndex}`"
          :title="group.title"
        >
          <EgModuleMenuItem
            v-for="(item, itemIndex) in group.items"
            :key="`module-menu-group-${groupIndex}-item-${itemIndex}`"
            :label="item.label"
          >
            <template #icon>
              <EgIcon :name="item.icon" size="sm" />
            </template>
          </EgModuleMenuItem>
        </EgModuleMenuGroup>
      </EgModuleMenu>
    </template>

    <div class="app-shell-main">
      <p class="app-shell-main__hint">主内容区</p>
    </div>
  </EgLayout>
</template>

<style scoped>
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
