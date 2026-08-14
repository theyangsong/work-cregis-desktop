/** Shell Debug · EgAnchoredPopover 尺寸（Launcher + QA deform 滚动上限共用）。 */
export const SHELL_DEBUG_POPOVER_WIDTH = 320;
export const SHELL_DEBUG_POPOVER_MIN_HEIGHT = 360;
export const SHELL_DEBUG_POPOVER_MAX_HEIGHT = 530;
/** topTool + divider，用于 content 区 max-height 换算。 */
export const SHELL_DEBUG_POPOVER_CHROME_HEIGHT = 62;

export const shellDebugPopoverContentMaxHeight =
  SHELL_DEBUG_POPOVER_MAX_HEIGHT - SHELL_DEBUG_POPOVER_CHROME_HEIGHT;

export const shellDebugPopoverContentMinHeight =
  SHELL_DEBUG_POPOVER_MIN_HEIGHT - SHELL_DEBUG_POPOVER_CHROME_HEIGHT;
