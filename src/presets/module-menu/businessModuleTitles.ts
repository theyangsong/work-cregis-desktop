/** Cregis 业务场景 Module Menu 模块名 — 与 Cregis Nav Bar 一致。 */
export const cregisModuleMenuBusinessTitles = [
  'Wallet',
  'Tasks',
  'WaaS',
  'Payment Engine',
  'Report',
  'Risk Control',
  'Manage',
  'Marketplace',
  'Notifications',
  'Account Settings',
] as const;

export type CregisModuleMenuBusinessTitle = (typeof cregisModuleMenuBusinessTitles)[number];

export type ModuleMenuBusinessScenario = 'cregis' | 'udun';

export const DEFAULT_CREGIS_MODULE_MENU_BUSINESS_TITLE: CregisModuleMenuBusinessTitle = 'Wallet';

/** Cregis：已在 `cregisModuleMenuByTitle` 单独维护菜单组数据的模块。 */
export const cregisModuleMenuBusinessTitlesWithMenuPreset: readonly CregisModuleMenuBusinessTitle[] =
  ['Tasks', 'Payment Engine', 'Manage', 'Notifications', 'Account Settings'];

/** Cregis：标题走 EgFlotation Combo（模块菜单下拉标题）。 */
export const cregisModuleMenuBusinessTitlesWithFlotationTitle: readonly CregisModuleMenuBusinessTitle[] =
  ['WaaS', 'Payment Engine'];

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

export function moduleMenuBusinessTitleUsesFlotationTitle(
  scenario: ModuleMenuBusinessScenario,
  title: string,
): boolean {
  if (scenario !== 'cregis') return false;
  return (cregisModuleMenuBusinessTitlesWithFlotationTitle as readonly string[]).includes(title);
}

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
