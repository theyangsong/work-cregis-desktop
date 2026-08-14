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

/** 待签名模块是否处于前台，用于展示浮标。 */
export const multiSignCollaborationModuleActive = ref(false);

export const pendingMultiSignInvitations = computed(() =>
  invitations.value.filter((item) => item.status === 'pending'),
);

export const pendingMultiSignInvitationCount = computed(
  () => pendingMultiSignInvitations.value.length,
);

export function setMultiSignCollaborationModuleActive(active: boolean) {
  multiSignCollaborationModuleActive.value = active;
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
