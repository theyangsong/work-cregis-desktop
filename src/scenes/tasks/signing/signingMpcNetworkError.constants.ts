export type SigningMpcNetworkErrorOption = {
  key: string;
  label: string;
  latencyLabel: string;
  latencyColor: string;
};

export const signingMpcNetworkErrorOptions: SigningMpcNetworkErrorOption[] = [
  {
    key: 'shanghai',
    label: 'Cregis Network Shanghai',
    latencyLabel: '8ms',
    latencyColor: 'var(--status-success)',
  },
  {
    key: 'hongkong',
    label: 'Cregis Network Hongkong',
    latencyLabel: '324ms',
    latencyColor: 'var(--status-warning)',
  },
  {
    key: 'dubai',
    label: 'Cregis Network Dubai',
    latencyLabel: '2560ms',
    latencyColor: 'var(--status-danger)',
  },
];
