/** 多签等待页 EgPopup custom Box（独立界面，与 SigningProgress 656×516 无关）。 */
export const MULTI_SIGN_WAITING_POPUP_WIDTH = 780;
export const MULTI_SIGN_WAITING_POPUP_HEIGHT = 560;

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
