/** 多签等待页 EgPopup custom Box（独立界面，与 SigningProgress 656×516 无关）。 */
export const MULTI_SIGN_WAITING_POPUP_WIDTH = 780;
export const MULTI_SIGN_WAITING_POPUP_HEIGHT = 560;

/** 多签等待页关闭二次确认 Popover 面板宽（px）。 */
export const MULTI_SIGN_WAITING_EXIT_CONFIRM_POPOVER_WIDTH = 296;

/** 演示：第 2–(n-1) 名成员每次在 0–3s 内随机加入。 */
export const MULTI_SIGN_MEMBER_JOIN_RANDOM_MAX_MS = 3_000;

/** 演示：达到门限前的最后一名成员固定延迟 5s 后出现。 */
export const MULTI_SIGN_MEMBER_JOIN_LAST_DELAY_MS = 5_000;

/** 参与人演示：就绪后进入签名中的延迟。 */
export const MULTI_SIGN_PARTICIPANT_SIGNING_AFTER_READY_MS = 800;

/** 参与人签名成功 · EgEndFeedbackCard 文案 i18n key。 */
export const SIGNING_PARTICIPANT_SUCCESS_MESSAGE = 'Signature successful';

export function parseSigningThreshold(threshold: string | null | undefined): {
  required: number;
  total: number;
} {
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(String(threshold ?? '').trim());
  if (!match) {
    return { required: 2, total: 3 };
  }
  return {
    required: Number.parseInt(match[1]!, 10),
    total: Number.parseInt(match[2]!, 10),
  };
}
