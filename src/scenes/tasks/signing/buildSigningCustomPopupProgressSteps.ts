import type { SigningCustomPopupProgressStep } from './signingCustomPopupProgress.types';
import type { MultiSignRoomPhase, SigningProgressPhase } from './types';

export function buildSigningProgressPopupSteps(
  phase: SigningProgressPhase,
  translate: (key: string) => string,
): SigningCustomPopupProgressStep[] {
  const order = ['sign', 'broadcast', 'on-chain'] as const;
  const phaseIndex: Record<SigningProgressPhase, number> = {
    signing: 0,
    'sign-failed': 0,
    broadcasting: 1,
    'on-chain-confirming': 2,
    'broadcast-success': 3,
    'broadcast-failed': 1,
  };
  const activeIndex = phaseIndex[phase];

  return order.map((key, stepIndex) => {
    let state: SigningCustomPopupProgressStep['state'] = 'pending';
    if (stepIndex < activeIndex) state = 'done';
    else if (stepIndex === activeIndex) state = 'active';

    const labels: Record<(typeof order)[number], string> = {
      sign: translate('Signature step'),
      broadcast: translate('Broadcast step'),
      'on-chain': translate('On-chain confirmation'),
    };

    return { key, label: labels[key], state };
  });
}

export function buildMultiSignWaitingPopupSteps(
  phase: MultiSignRoomPhase,
  translate: (key: string) => string,
): SigningCustomPopupProgressStep[] {
  const waitingDone = phase === 'ready';

  return [
    {
      key: 'waiting',
      label: translate('Waiting'),
      state: waitingDone ? 'done' : 'active',
    },
    {
      key: 'ready',
      label: translate('Ready'),
      state: waitingDone ? 'active' : 'pending',
    },
    {
      key: 'sign',
      label: translate('Signature step'),
      state: 'pending',
    },
  ];
}
