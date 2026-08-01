/** 演示：单笔签名进度终态（固定行，便于列表验收）。 */
export type SigningProgressDemoFailure =
  | 'broadcast-failed'
  | 'mpc-network-error';

/** 第 1 条（1-based）→ 广播失败。 */
export const SIGNING_PROGRESS_DEMO_BROADCAST_FAILED_ROW_INDEX = 0;

/** 第 5 条（1-based）→ MPC 网络异常 · 签名失败。 */
export const SIGNING_PROGRESS_DEMO_MPC_NETWORK_ERROR_ROW_INDEX = 4;

export function resolveSigningProgressDemoFailure(
  rowIndex: number,
): SigningProgressDemoFailure | null {
  if (rowIndex === SIGNING_PROGRESS_DEMO_BROADCAST_FAILED_ROW_INDEX) {
    return 'broadcast-failed';
  }

  if (rowIndex === SIGNING_PROGRESS_DEMO_MPC_NETWORK_ERROR_ROW_INDEX) {
    return 'mpc-network-error';
  }

  return null;
}
