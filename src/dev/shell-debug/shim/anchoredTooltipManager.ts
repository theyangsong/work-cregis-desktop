export {
  closeBarBlockingAnchoredTooltips,
  hasOpenClickAnchoredTooltip,
  registerAnchoredTooltipClose,
  setClickAnchoredTooltipOpen,
} from '../../../../../eds-desktop/packages/components/src/molecules/tooltip/anchoredTooltipManager';

import { closeAllAnchoredTooltips as closeAllOriginal } from '../../../../../eds-desktop/packages/components/src/molecules/tooltip/anchoredTooltipManager';
import { isShellDebugUiInteractionPending } from '../shellDebugFloatInteraction';

/** Dev 壳层启动器（含 QA / Model 的 EgAnchoredPopover.open）不应关掉业务 Popover。 */
export function closeAllAnchoredTooltips(): void {
  if (isShellDebugUiInteractionPending()) return;
  closeAllOriginal();
}
