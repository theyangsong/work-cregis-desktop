import type { FlotationMenuItemPreset } from '@eds/desktop-components';
import type { CregisModuleMenuBusinessTitle } from './businessModuleTitles';

const FLOTATION_TITLE_MENU_LABELS = [
  'Aurora Merchant',
  'Borealis Acquire',
  'Cascade Disburse',
  'Delta Escrow',
  'Ember Exchange',
  'Flint Ledger',
  'Granite Invoice',
  'Harbor Transit',
  'Ivory Vault',
  'Jasper Capture',
] as const;

const FLOTATION_TITLE_ENABLED_ROWS = new Set([1, 2, 3, 5, 7, 8, 9, 10]);
const FLOTATION_TITLE_REDDOT_ROWS = new Set([3, 4, 5, 7]);

/** Module Menu 标题 EgFlotation 演示项（与 Showcase Cregis 场景一致）。 */
export const cregisModuleMenuTitleFlotationItems: FlotationMenuItemPreset[] =
  FLOTATION_TITLE_MENU_LABELS.map((label, index) => {
    const row = index + 1;
    const enabled = FLOTATION_TITLE_ENABLED_ROWS.has(row);

    return {
      label,
      boxType: 'text',
      showTag: true,
      tag: enabled ? 'Enable' : 'Disabled',
      tagStatus: enabled ? 'success' : 'danger',
      showReddot: FLOTATION_TITLE_REDDOT_ROWS.has(row),
    };
  });

/** WaaS → Doris Studio；其余浮层模块 → 模块名。 */
export function resolveCregisModuleMenuFlotationTitle(
  moduleTitle: CregisModuleMenuBusinessTitle,
): string {
  if (moduleTitle === 'WaaS') return 'Doris Studio';
  return moduleTitle;
}

export const cregisModuleMenuTitleFlotationProps = {
  width: 288,
  maxHeight: 540,
  addLabel: 'Create Project',
  closeOnScroll: true,
  placement: 'bottom' as const,
  align: 'start' as const,
};
