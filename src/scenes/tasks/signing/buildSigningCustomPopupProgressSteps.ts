import type { SigningCustomPopupProgressStep } from './signingCustomPopupProgress.types';
import type { SigningProgressPhase } from './types';

const PROGRESS_STEP_ORDER = ['sign', 'broadcast', 'on-chain'] as const;

type ProgressStepKey = (typeof PROGRESS_STEP_ORDER)[number];

function buildThreeStepProgress(
  activeIndex: number,
  translate: (key: string) => string,
): SigningCustomPopupProgressStep[] {
  const labels: Record<ProgressStepKey, string> = {
    sign: translate('Signature step'),
    broadcast: translate('Broadcast step'),
    'on-chain': translate('On-chain confirmation'),
  };

  return PROGRESS_STEP_ORDER.map((key, stepIndex) => {
    let state: SigningCustomPopupProgressStep['state'] = 'pending';
    if (stepIndex < activeIndex) state = 'done';
    else if (stepIndex === activeIndex) state = 'active';

    return { key, label: labels[key], state };
  });
}

export function buildSigningProgressPopupSteps(
  phase: SigningProgressPhase,
  translate: (key: string) => string,
): SigningCustomPopupProgressStep[] {
  const phaseIndex: Record<SigningProgressPhase, number> = {
    signing: 0,
    'sign-failed': 0,
    broadcasting: 1,
    'on-chain-confirming': 2,
    'broadcast-success': 3,
    'broadcast-failed': 1,
  };

  return buildThreeStepProgress(phaseIndex[phase], translate);
}
