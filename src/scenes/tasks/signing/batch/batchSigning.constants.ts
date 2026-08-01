export const SIGNING_BATCH_SELECT_MAX = 100;

/** EgPopup `uses="custom"` · Showcase `popupCustomBoxSizePresets.md`。 */
export const POPUP_CUSTOM_BOX_MD_WIDTH = 780;
export const POPUP_CUSTOM_BOX_MD_HEIGHT = 560;

export const BATCH_SIGN_CONFIRM_POPUP_WIDTH = POPUP_CUSTOM_BOX_MD_WIDTH;
export const BATCH_SIGN_CONFIRM_POPUP_HEIGHT = POPUP_CUSTOM_BOX_MD_HEIGHT;
export const BATCH_SIGN_PROGRESS_POPUP_WIDTH = POPUP_CUSTOM_BOX_MD_WIDTH;
export const BATCH_SIGN_PROGRESS_POPUP_HEIGHT = POPUP_CUSTOM_BOX_MD_HEIGHT;
/** 批处理网络选择 Flotation 默认宽 / 最大高（标注定稿）。 */
export const BATCH_CURRENCY_PICKER_WIDTH = 360;
export const BATCH_CURRENCY_PICKER_MAX_HEIGHT = 440;
/** 相对工具栏批处理触发器的交叉轴偏移（标注定稿）。 */
export const BATCH_NETWORK_PICKER_CROSS_AXIS_OFFSET_PX = 133;

/** 演示：第 2 条及中间行在 0–3s 内随机完成；首条瞬时；末条固定 10s。 */
export const BATCH_PROGRESS_OTHER_ROW_MAX_MS = 3_000;

/** 演示：最后一条固定 10s 完成（广播成功）。 */
export const BATCH_PROGRESS_LAST_ROW_MS = 10_000;

/** 单条 pending → 终态的状态步数（pending → signing → broadcasting → success/failed）。 */
export const BATCH_PROGRESS_STEPS_PER_ROW = 3;

export const MOCK_WITHDRAWAL_QUOTA_USD = 50_000;

/** 超出团队提币额度部分收取 0.1% 超额服务费。 */
export const WITHDRAWAL_OVERAGE_FEE_RATE = 0.001;

/** 演示：rowIndex % 7 === 0 时模拟额度不足 */
export const MOCK_QUOTA_INSUFFICIENT_ROW_MOD = 7;
