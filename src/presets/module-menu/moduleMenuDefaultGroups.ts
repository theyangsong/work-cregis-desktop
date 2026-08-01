import type { ModuleMenuPresetGroup } from './cregisModuleMenuGroups';

/** 组件场景默认菜单 — 未单独配置模块（Wallet / Report 等）的回退结构。 */
export const moduleMenuDefaultGroups: ModuleMenuPresetGroup[] = [
  {
    items: [
      { label: 'Label', icon: 'eds-add' },
      { label: 'Label', icon: 'eds-add' },
    ],
  },
  {
    title: 'Title',
    items: [
      {
        label: 'Label',
        icon: 'eds-add',
        tier: 2,
        subitems: [
          { label: 'Label', icon: 'eds-add' },
          { label: 'Label', icon: 'eds-add' },
        ],
      },
      { label: 'Label', icon: 'eds-add' },
    ],
  },
  {
    title: 'Title 2',
    items: [
      { label: 'Label', icon: 'eds-add' },
      { label: 'Label', icon: 'eds-add' },
    ],
  },
];
