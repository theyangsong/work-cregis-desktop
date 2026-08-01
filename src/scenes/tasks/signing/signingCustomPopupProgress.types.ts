export type SigningCustomPopupStepState = 'done' | 'active' | 'pending' | 'failed';

export type SigningCustomPopupProgressStep = {
  key: string;
  label: string;
  state: SigningCustomPopupStepState;
};
