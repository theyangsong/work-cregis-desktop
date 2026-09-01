export const SIGNING_CUSTOM_POPUP_WIDTH = 656;
export const SIGNING_CUSTOM_POPUP_HEIGHT = 480;

/** 演示：SigningProgress 各步停留时长（签名 → 广播 → 链上确认）。 */
export const SIGNING_PROGRESS_SIGN_HOLD_MS = 5_000;
export const SIGNING_PROGRESS_BROADCAST_HOLD_MS = 0;
export const SIGNING_PROGRESS_ON_CHAIN_HOLD_MS = 0;

/** @deprecated 统一步长；新逻辑请用上方分步常量。 */
export const SIGNING_PROGRESS_STEP_HOLD_MS = SIGNING_PROGRESS_SIGN_HOLD_MS;

/** 广播成功步完成后，自动关弹窗前的停留（展示终态进度）。 */
export const SIGNING_PROGRESS_SUCCESS_AUTO_CLOSE_MS = 800;
