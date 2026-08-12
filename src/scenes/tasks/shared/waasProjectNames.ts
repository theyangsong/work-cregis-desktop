/** WaaS 浮层菜单中的项目名称（与 Module Menu 浮层一致，不含 Aurora/Borealis/Cascade）。 */
export const WAAS_PAYOUT_PROJECT_NAMES = [
  'Delta Escrow',
  'Ember Exchange',
  'Flint Ledger',
  'Granite Invoice',
  'Harbor Transit',
  'Ivory Vault',
  'Jasper Capture',
] as const;

export function isWaasPayoutTransferType(value: string): boolean {
  return value === 'Wallet Payout' || value === 'Sub-Address Payout';
}

export function resolveWaasProjectNameForRow(rowIndex: number): string {
  return WAAS_PAYOUT_PROJECT_NAMES[rowIndex % WAAS_PAYOUT_PROJECT_NAMES.length]!;
}
