import type { CregisModuleMenuBusinessTitle } from './businessModuleTitles';
import { moduleMenuDefaultGroups } from './moduleMenuDefaultGroups';

export type ModuleMenuPresetAvatar = {
  name: string;
  colorIndex?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
};

export type ModuleMenuPresetSubItem = {
  label: string;
  icon: string;
};

export type ModuleMenuPresetItem = {
  label: string;
  icon: string;
  tier?: 1 | 2;
  subitems?: ModuleMenuPresetSubItem[];
  avatar?: ModuleMenuPresetAvatar;
  message?: string;
  messageType?: 'subtle' | 'brand' | 'danger';
  focusBackground?: 'inherit' | 'same-white';
  showReddot?: boolean;
};

export type ModuleMenuPresetGroup = {
  title?: string;
  items: ModuleMenuPresetItem[];
};

const cregisTasksModuleMenuGroups: ModuleMenuPresetGroup[] = [
  {
    title: 'To Do',
    items: [
      { label: 'Approval', icon: 'eds-stamp' },
      { label: 'Signing', icon: 'eds-signature-pen' },
    ],
  },
  {
    title: 'Completed',
    items: [
      { label: 'Approved', icon: 'eds-batch' },
      { label: 'Signed', icon: 'eds-work-done' },
    ],
  },
  {
    items: [
      { label: 'All Records', icon: 'eds-list-square' },
      { label: 'Sent Request', icon: 'eds-list-square' },
    ],
  },
];

/** Cregis Payment Engine — 业务定稿菜单。 */
const cregisPaymentEngineModuleMenuGroups: ModuleMenuPresetGroup[] = [
  {
    items: [
      { label: 'Order Record', icon: 'eds-text-journal' },
      { label: 'Bulk Transfer Record', icon: 'eds-arrow-left-right' },
      { label: 'Refund Record', icon: 'eds-arrow-exit-left' },
      { label: 'Payment Exception Record', icon: 'eds-text-abnormal', showReddot: true },
    ],
  },
  {
    title: 'Payout Record',
    items: [{ label: 'Wallet Payout', icon: 'eds-arrow-launch-square' }],
  },
  {
    title: 'Callback',
    items: [
      { label: 'Callback Error', icon: 'eds-text-abnormal' },
      { label: 'History Callback', icon: 'eds-history' },
    ],
  },
  {
    items: [{ label: 'Settings', icon: 'eds-gear' }],
  },
];

/** Cregis Account Settings — 业务定稿菜单。 */
const cregisAccountSettingsModuleMenuGroups: ModuleMenuPresetGroup[] = [
  {
    items: [
      { label: 'Preference', icon: 'eds-user-preference' },
      { label: 'Account Security', icon: 'eds-asafety' },
      { label: 'MPC Network', icon: 'eds-website' },
      { label: 'About Cregis', icon: 'eds-cregis' },
    ],
  },
];

/** Cregis Notifications — 业务定稿菜单。 */
const cregisNotificationsModuleMenuGroups: ModuleMenuPresetGroup[] = [
  {
    items: [
      { label: 'Team Activities', icon: 'eds-team' },
      { label: 'Transactions', icon: 'eds-convert' },
      { label: 'Tasks', icon: 'eds-circulation' },
      { label: 'Announcements', icon: 'eds-push' },
      { label: 'AML Alerts', icon: 'eds-alarm' },
    ],
  },
];

/** Cregis Manage — 业务定稿菜单。 */
const cregisManageModuleMenuGroups: ModuleMenuPresetGroup[] = [
  {
    items: [
      { label: 'Team Subscription', icon: 'eds-diamond' },
      { label: 'Team Account Balance', icon: 'eds-usd-accounting' },
      { label: 'Order Management', icon: 'eds-text-order' },
    ],
  },
  {
    items: [
      { label: 'Member', icon: 'eds-user-information' },
      { label: 'Role', icon: 'eds-team' },
    ],
  },
  {
    items: [
      { label: 'Team Security', icon: 'eds-asafety' },
      { label: 'API Manage', icon: 'eds-api-box' },
    ],
  },
];

/** Cregis WaaS — 业务定稿菜单。 */
export const cregisWaasModuleMenuGroups: ModuleMenuPresetGroup[] = [
  {
    items: [{ label: 'Sub-Address', icon: 'eds-address-books' }],
  },
  {
    title: 'Payout Record',
    items: [
      { label: 'Wallet Payout', icon: 'eds-arrow-launch-square' },
      { label: 'Sub-Address Payout', icon: 'eds-payor-book' },
    ],
  },
  {
    title: 'Transactions',
    items: [
      { label: 'History', icon: 'eds-text-journal' },
      { label: 'Processing', icon: 'eds-clocks' },
    ],
  },
  {
    title: 'Collection',
    items: [
      { label: 'Rule Configuration', icon: 'eds-list-configure' },
      { label: 'Task Record', icon: 'eds-arrow-reply-all-email' },
      { label: 'API Collection', icon: 'eds-api-box' },
      {
        label: 'Collection Record',
        icon: 'eds-gather',
        tier: 2,
        subitems: [
          { label: 'History', icon: 'eds-text-journal' },
          { label: 'Processing', icon: 'eds-clocks' },
        ],
      },
    ],
  },
  {
    title: 'Callback',
    items: [
      { label: 'Callback Error', icon: 'eds-text-abnormal' },
      { label: 'History Callback', icon: 'eds-history' },
    ],
  },
  {
    items: [{ label: 'Settings', icon: 'eds-gear' }],
  },
];

export const cregisModuleMenuByTitle: Partial<
  Record<CregisModuleMenuBusinessTitle, ModuleMenuPresetGroup[]>
> = {
  Tasks: cregisTasksModuleMenuGroups,
  WaaS: cregisWaasModuleMenuGroups,
  'Payment Engine': cregisPaymentEngineModuleMenuGroups,
  Manage: cregisManageModuleMenuGroups,
  Notifications: cregisNotificationsModuleMenuGroups,
  'Account Settings': cregisAccountSettingsModuleMenuGroups,
};

/** 未配置模块回退：组件场景默认菜单。 */
export const cregisDefaultModuleMenuGroups = moduleMenuDefaultGroups;

export function getCregisModuleMenuGroups(
  title: CregisModuleMenuBusinessTitle,
): ModuleMenuPresetGroup[] {
  return cregisModuleMenuByTitle[title] ?? cregisDefaultModuleMenuGroups;
}
