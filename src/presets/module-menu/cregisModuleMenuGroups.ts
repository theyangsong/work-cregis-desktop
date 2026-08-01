export type CregisModuleMenuItem = {
  label: string;
  icon: string;
};

export type CregisModuleMenuGroup = {
  title?: string;
  items: CregisModuleMenuItem[];
};

/** Cregis Module Menu — 4 组占位结构（组件库暂无 group-count 声明式 API，用 slot 组合实现）。 */
export const cregisModuleMenuGroups: CregisModuleMenuGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: 'eds-wallet' },
      { label: 'Analytics', icon: 'eds-bill' },
    ],
  },
  {
    title: 'Assets',
    items: [
      { label: 'Wallets', icon: 'eds-wallet' },
      { label: 'Transactions', icon: 'eds-circulation' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Approvals', icon: 'eds-database-safety' },
      { label: 'Reports', icon: 'eds-bill' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Team', icon: 'eds-categorization' },
      { label: 'Integrations', icon: 'eds-app-ecology' },
    ],
  },
];
