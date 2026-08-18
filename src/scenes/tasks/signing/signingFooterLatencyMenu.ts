export type SigningFooterLatencyNetworkItem = {
  key: string;
  label: string;
  statusLabel: string;
  statusColor: string;
};

export const SIGNING_FOOTER_LATENCY_MENU_TITLE = 'MPC Network';

export const signingFooterLatencyNetworkItems: SigningFooterLatencyNetworkItem[] = [
  {
    key: 'us-la',
    label: 'Los Angeles',
    statusLabel: '2100ms',
    statusColor: 'var(--status-danger)',
  },
  {
    key: 'us-ny',
    label: 'New York',
    statusLabel: '1022ms',
    statusColor: 'var(--status-warning)',
  },
  {
    key: 'sg',
    label: 'Singapore',
    statusLabel: '20ms',
    statusColor: 'var(--status-success)',
  },
  {
    key: 'jp-tokyo',
    label: 'Tokyo',
    statusLabel: 'No network',
    statusColor: 'var(--text-base-tertiary)',
  },
];
