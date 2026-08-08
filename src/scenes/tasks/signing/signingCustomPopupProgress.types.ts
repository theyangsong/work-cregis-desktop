export type SigningCustomPopupStepState = 'done' | 'active' | 'pending';

export type SigningCustomPopupProgressStep = {
  key: string;
  label: string;
  state: SigningCustomPopupStepState;
};
