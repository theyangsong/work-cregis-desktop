export type SigningFooterLatencyNetworkItem = {
  key: string;
  label: string;
  statusLabel: string;
  statusColor: string;
};

export const SIGNING_FOOTER_LATENCY_MENU_TITLE = 'MPC网络';

export const signingFooterLatencyNetworkItems: SigningFooterLatencyNetworkItem[] = [
  {
    key: 'us-la',
    label: '美国洛杉矶',
    statusLabel: '2100ms',
    statusColor: 'var(--status-danger)',
  },
  {
    key: 'us-ny',
    label: '美国纽约',
    statusLabel: '1022ms',
    statusColor: 'var(--status-warning)',
  },
  {
    key: 'sg',
    label: '新加坡',
    statusLabel: '20ms',
    statusColor: 'var(--status-success)',
  },
  {
    key: 'jp-tokyo',
    label: '日本东京',
    statusLabel: '无网络',
    statusColor: 'var(--text-base-tertiary)',
  },
];
