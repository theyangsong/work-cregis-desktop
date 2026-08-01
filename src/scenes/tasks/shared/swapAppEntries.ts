/** Nav Bar 应用入口 — 与 cregisNavBarDeclarative appEntry* 一致。 */
export const SWAP_APP_ENTRIES = [
  { label: 'UniChain', icon: 'eds-application-22' },
  { label: 'MetaMask', icon: 'eds-application-5' },
] as const;

export function isSwapTransferType(value: string): boolean {
  return value === 'Swap';
}

export function resolveSwapAppEntryForRow(rowIndex: number): (typeof SWAP_APP_ENTRIES)[number] {
  return SWAP_APP_ENTRIES[rowIndex % SWAP_APP_ENTRIES.length]!;
}
