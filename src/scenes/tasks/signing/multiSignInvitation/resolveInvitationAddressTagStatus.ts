import type { TagStatus } from '@eds/desktop-components';

const TAG_STATUS_BY_LABEL: Record<string, TagStatus> = {
  内部: 'warning',
  白名单: 'success',
  默认付款地址: 'ready',
  多签: 'ready',
};

export function resolveInvitationAddressTagStatus(label: string): TagStatus {
  return TAG_STATUS_BY_LABEL[label] ?? 'ready';
}
