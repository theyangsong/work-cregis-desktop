import { parseSigningThreshold } from './multiSignWaiting.constants';
import { formatGroupedAmountText } from '@/utils/formatGroupedDisplay';
import type { SigningDetail, SigningProgressMember } from './types';

export type MultiSignWaitingSidebarField = {
  key: string;
  labelKey: string;
  value: string;
};

export type MultiSignWaitingMemberPresence = 'joined' | 'pending' | 'offline';

export type MultiSignWaitingMemberView = {
  id: string;
  name: string;
  emailMasked: string;
  avatarName: string;
  deviceLabel?: string;
  isInitiator: boolean;
  isCurrentUser: boolean;
  presence: MultiSignWaitingMemberPresence;
  joined: boolean;
  muted: boolean;
  avatarColorIndex?: number;
};

export type MultiSignWaitingPanelModel = {
  sidebarFields: MultiSignWaitingSidebarField[];
  members: MultiSignWaitingMemberView[];
  thresholdRequired: number;
  thresholdTotal: number;
  joinedCount: number;
};

const MEMBER_DEVICE_LABELS = ['macOS', 'Android', 'Windows'] as const;

const MEMBER_NAME_PRESETS = [
  'Alex Mah.',
  'Cooper',
  'Ed Stark.',
  'Sophia',
] as const;

const MEMBER_EMAIL_PRESETS = [
  'w******g@stark.com',
  'j******n@x.com',
  'w******g@yandex.com',
  'w******g@yahoo.com',
] as const;

function resolveInitiatorMember(detail: SigningDetail): SigningProgressMember | null {
  if (detail.initiatorKind !== 'member') return null;
  return detail.signers[0] ?? detail.approvalNodes[0]?.members[0] ?? null;
}

function buildInitiatorSidebarField(detail: SigningDetail): MultiSignWaitingSidebarField {
  const initiator = resolveInitiatorMember(detail);

  if (initiator) {
    return {
      key: 'initiator',
      labelKey: 'Initiating party',
      value: `${initiator.name} (${initiator.emailMasked})`,
    };
  }

  const headline = detail.initiatorDisplay.split(' · ')[0]?.trim() ?? detail.initiatorDisplay;

  return {
    key: 'initiator',
    labelKey: 'Initiating party',
    value: headline,
  };
}

function buildMultiSignWaitingMembers(
  detail: SigningDetail,
  joinedCount: number,
): MultiSignWaitingMemberView[] {
  const { total, required } = parseSigningThreshold(detail.signingThreshold);
  const memberTotal = Math.min(Math.max(total, detail.signers.length, required), 4);
  const initiatorMember = resolveInitiatorMember(detail);

  const members = Array.from({ length: memberTotal }, (_, index) => {
    const signer = detail.signers[index];
    const name = signer?.name ?? MEMBER_NAME_PRESETS[index] ?? `Signer ${index + 1}`;
    const emailMasked =
      signer?.emailMasked ?? MEMBER_EMAIL_PRESETS[index] ?? 'm******r@example.com';
    const avatarName = signer?.avatarName ?? name;
    const isInitiator =
      initiatorMember != null
      && signer != null
      && signer.name === initiatorMember.name
      && signer.emailMasked === initiatorMember.emailMasked;

    return {
      id: `${detail.id}-member-${index}`,
      name,
      emailMasked,
      avatarName,
      deviceLabel: MEMBER_DEVICE_LABELS[index],
      isInitiator,
      isCurrentUser: name === 'Ethan Chen',
      presence: 'joined' as const,
      joined: true,
      muted: false,
      avatarColorIndex: isInitiator ? 10 : undefined,
    };
  });

  return members.slice(0, Math.max(1, Math.min(joinedCount, members.length)));
}

export function buildMultiSignWaitingPanelModel(
  detail: SigningDetail,
  joinedCount: number,
  translate: (key: string) => string,
): MultiSignWaitingPanelModel {
  const sender = detail.senders[0];
  const receiver = detail.receivers[0];
  const { required, total } = parseSigningThreshold(detail.signingThreshold);

  return {
    sidebarFields: [
      {
        key: 'amount',
        labelKey: 'Amount',
        value: formatGroupedAmountText(detail.amountDisplay),
      },
      {
        key: 'business-type',
        labelKey: 'Type of Business',
        value: translate(detail.businessType),
      },
      buildInitiatorSidebarField(detail),
      {
        key: 'sender',
        labelKey: 'From Address',
        value: sender?.address ?? detail.senderSummary,
      },
      {
        key: 'receiver',
        labelKey: 'To Address',
        value: receiver?.address ?? detail.receiverSummary,
      },
      {
        key: 'memo',
        labelKey: 'Memo',
        value: detail.memo,
      },
    ],
    members: buildMultiSignWaitingMembers(detail, joinedCount),
    thresholdRequired: required,
    thresholdTotal: total,
    joinedCount,
  };
}
