import { computed, ref } from 'vue';
import { buildMultiSignInvitationDemoData } from './buildMultiSignInvitationDemoData';
import type {
  MultiSignInvitation,
  MultiSignInvitationJoinResult,
} from './types';

const invitations = ref<MultiSignInvitation[]>(
  buildMultiSignInvitationDemoData().sort((left, right) =>
    right.invitedAtDisplay.localeCompare(left.invitedAtDisplay),
  ),
);

/** 演示：是否已导入钱包分片（false 时 Join 提示分片不存在）。 */
export const multiSignWalletShardImported = ref(true);

/** 待签名模块是否处于前台，用于展示浮标并在进入时自动展开浮层。 */
export const multiSignCollaborationModuleActive = ref(false);

const autoOpenConsumedSessionKey = 'multi-sign-invitation-auto-open-consumed';

/** 批处理多选退出后跳过一次自动展开（跨 FloatHost remount 生效）。 */
let skipAutoOpenOnceAfterBatchExit = false;

export function markSkipMultiSignInvitationAutoOpenOnce() {
  skipAutoOpenOnceAfterBatchExit = true;
}

export function consumeSkipMultiSignInvitationAutoOpenOnce(): boolean {
  if (!skipAutoOpenOnceAfterBatchExit) return false;
  skipAutoOpenOnceAfterBatchExit = false;
  return true;
}

export const pendingMultiSignInvitations = computed(() =>
  invitations.value.filter((item) => item.status === 'pending'),
);

export const pendingMultiSignInvitationCount = computed(
  () => pendingMultiSignInvitations.value.length,
);

export function setMultiSignCollaborationModuleActive(active: boolean) {
  multiSignCollaborationModuleActive.value = active;
}

export function shouldAutoOpenMultiSignInvitationPanel(): boolean {
  if (pendingMultiSignInvitationCount.value === 0) return false;
  if (!multiSignCollaborationModuleActive.value) return false;
  try {
    return sessionStorage.getItem(autoOpenConsumedSessionKey) !== '1';
  } catch {
    return true;
  }
}

export function markMultiSignInvitationAutoOpenConsumed() {
  try {
    sessionStorage.setItem(autoOpenConsumedSessionKey, '1');
  } catch {
    /* ignore */
  }
}

export function removeMultiSignInvitation(id: string) {
  invitations.value = invitations.value.filter((item) => item.id !== id);
}

export function getMultiSignInvitationById(id: string): MultiSignInvitation | undefined {
  return invitations.value.find((item) => item.id === id);
}

export function validateMultiSignInvitationJoin(
  id: string,
): MultiSignInvitationJoinResult | 'ok' {
  const invitation = getMultiSignInvitationById(id);
  if (!invitation || invitation.status !== 'pending') {
    return 'expired';
  }

  if (!multiSignWalletShardImported.value) {
    return 'shard-missing';
  }

  return 'ok';
}

export function joinMultiSignInvitation(id: string): MultiSignInvitationJoinResult {
  const precheck = validateMultiSignInvitationJoin(id);
  if (precheck !== 'ok') {
    if (precheck === 'expired') {
      removeMultiSignInvitation(id);
    }
    return precheck;
  }

  removeMultiSignInvitation(id);
  return 'joined';
}
