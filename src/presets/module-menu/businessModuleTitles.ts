import {
  cregisModuleMenuBusinessTitles,
  DEFAULT_CREGIS_MODULE_MENU_BUSINESS_TITLE,
  type CregisModuleMenuBusinessTitle,
} from '@eds/desktop-components';

export type { CregisModuleMenuBusinessTitle };
export { DEFAULT_CREGIS_MODULE_MENU_BUSINESS_TITLE };

/** Cregis：Nav 聚焦时不展示 Module Menu（Report / Marketplace / 应用入口）。 */
export const cregisNavLabelsWithoutModuleMenu = [
  'Report',
  'Marketplace',
  'UniChain',
  'MetaMask',
] as const;

const NAV_CHROME_LABEL_TO_MODULE_TITLE: Record<string, CregisModuleMenuBusinessTitle> = {
  Notice: 'Notifications',
  'User avatar': 'Account Settings',
};

/** Nav Bar 按钮 aria-label → Module Menu 业务模块名。 */
export function resolveNavChromeLabelToModuleMenuTitle(
  label: string,
): CregisModuleMenuBusinessTitle | null {
  const trimmed = label.trim();
  const mapped = NAV_CHROME_LABEL_TO_MODULE_TITLE[trimmed];
  if (mapped) return mapped;

  if ((cregisModuleMenuBusinessTitles as readonly string[]).includes(trimmed)) {
    return trimmed as CregisModuleMenuBusinessTitle;
  }

  return null;
}

export function navLabelShouldHideModuleMenu(label: string): boolean {
  return (cregisNavLabelsWithoutModuleMenu as readonly string[]).includes(label.trim());
}
