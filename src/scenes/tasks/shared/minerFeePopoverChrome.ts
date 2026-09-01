import { POPOVER_PRESET_WIDTH_BASE } from '@eds/desktop-components';

/** Showcase Popovers · miner-fee 场景与 EgPopover 对齐的壳层 props。 */
export const MINER_FEE_POPOVER_CHROME = {
  placement: 'top',
  align: 'center',
  topTool: true,
  topToolClosable: true,
  widthMode: 'fixed',
  width: POPOVER_PRESET_WIDTH_BASE,
  heightMode: 'adaptive',
} as const;
