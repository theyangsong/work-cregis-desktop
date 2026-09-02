import type { DetailApprovalProgressStep } from './detailApprovalProgress.types';

export type DetailApprovalProgressMarkerVisual =
  | 'default'
  | 'completed'
  | 'processing'
  | 'rejected'
  | 'withdrawn';

/** 时间线圆点：通过 / 进行中 / 驳回 / 撤回 / 未到达。 */
export function resolveDetailApprovalProgressMarkerVisual(
  step: DetailApprovalProgressStep,
): DetailApprovalProgressMarkerVisual {
  if (step.key === 'withdrawn') {
    return 'withdrawn';
  }
  if (step.statusTag === 'danger') {
    return 'rejected';
  }
  if (step.statusTag === 'warning') {
    return 'processing';
  }
  if (step.completed) {
    return 'completed';
  }
  return 'default';
}
