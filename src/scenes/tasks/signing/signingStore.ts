import { ref } from 'vue';
import { isMultiSignRow } from '../list-field/tasksListFieldBusinessTypeRowData';
import { buildSigningDetailRowFields } from './buildSigningDetailRowFields';
import type { SigningDetail, SigningStatus } from './types';

const MOCK_PASSWORD = '123456';

export const signingStoreRevision = ref(0);

function touchSigningStore() {
  signingStoreRevision.value += 1;
}

type StoreEntry = SigningDetail & { processedAt?: number };

const entries = new Map<string, StoreEntry>();

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  const tail = local.slice(-1);
  return `${visible}******${tail}@${domain}`;
}

function formatUtcTimestamp(date: Date, offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = String(Math.abs(offsetHours)).padStart(2, '0');
  const pad = (n: number) => String(n).padStart(2, '0');
  return `UTC${sign}${abs}:00 ${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function signingModeFromRow(rowIndex: number): 'single' | 'multi' {
  return isMultiSignRow(rowIndex) ? 'multi' : 'single';
}

function buildCustomDetailFields(id: string, rowIndex: number) {
  const appliedAt = new Date(Date.UTC(2026, 6, 17, 14, 8, 11));
  const signingMode = signingModeFromRow(rowIndex);

  const member: SigningDetail['approvalNodes'][number]['members'][number] = {
    name: 'Name',
    emailMasked: maskEmail('t******c@gmail.com'),
    avatarName: 'Name',
  };

  return {
    strategy: 'High Value Guard · #POL-0192',
    thirdPartyRef: `TP-20260717-${String(rowIndex + 1).padStart(3, '0')}`,
    memo: 'Monthly vendor settlement',
    initiatorKind: rowIndex % 4 === 0 ? ('waas' as const) : ('member' as const),
    initiatorDisplay:
      rowIndex % 4 === 0
        ? 'WaaS Project Alpha · IP 203.0.113.10'
        : `${member.name} (${member.emailMasked}) · MacBook · DEV-019 · IP 198.51.100.8`,
    initiatorNote: 'Please sign before cutoff.',
    initiatorAtDisplay: formatUtcTimestamp(appliedAt, 8),
    approvalNodes: [
      {
        title: 'Approval Node 1',
        statusLabel: 'Approval Passed',
        members: [member, { ...member, name: 'Reviewer', avatarName: 'Reviewer' }],
      },
      {
        title: 'Approval Node 2',
        statusLabel: 'Approval Passed',
        members: [{ ...member, name: 'Auditor', avatarName: 'Auditor' }],
      },
    ],
    signingMode,
    signingThreshold: signingMode === 'multi' ? '2 / 3' : null,
    signers: [
      member,
      { ...member, name: 'Signer B', avatarName: 'Signer B' },
      { ...member, name: 'Signer C', avatarName: 'Signer C' },
    ],
  };
}

function buildDetail(id: string, rowIndex: number): StoreEntry {
  return {
    id,
    status: 'pending',
    version: 1,
    ...buildSigningDetailRowFields(rowIndex),
    ...buildCustomDetailFields(id, rowIndex),
  };
}

function syncDetailFromRow(entry: StoreEntry, rowIndex: number) {
  Object.assign(entry, buildSigningDetailRowFields(rowIndex));
  const mode = signingModeFromRow(rowIndex);
  entry.signingMode = mode;
  entry.signingThreshold = mode === 'multi' ? '2 / 3' : null;
}

function ensureEntry(id: string, rowIndex: number): StoreEntry {
  const existing = entries.get(id);
  if (existing) {
    syncDetailFromRow(existing, rowIndex);
    return existing;
  }
  const created = buildDetail(id, rowIndex);
  entries.set(id, created);
  return created;
}

export function signingIdFromRowIndex(index: number): string {
  return `SIG-${String(index + 1).padStart(6, '0')}`;
}

export function parseRowIndexFromSigningId(id: string): number {
  const match = /^SIG-(\d+)$/.exec(id);
  if (!match) return 0;
  return Math.max(0, Number.parseInt(match[1], 10) - 1);
}

export function isSigningRowEligibleForBatch(rowIndex: number): boolean {
  return !isMultiSignRow(rowIndex);
}

export function listPendingSigningIds(allRowIndexes: number[]): string[] {
  return allRowIndexes
    .filter((index) => isSigningRowEligibleForBatch(index))
    .map((index) => signingIdFromRowIndex(index))
    .filter((id) => {
      const entry = entries.get(id);
      return !entry || entry.status === 'pending';
    });
}

/** 详情导航用：含单签与多签全部待签名项。 */
export function listAllPendingSigningIds(allRowIndexes: number[]): string[] {
  return allRowIndexes
    .map((index) => signingIdFromRowIndex(index))
    .filter((id) => {
      const entry = entries.get(id);
      return !entry || entry.status === 'pending';
    });
}

export function countPendingSignings(rowCount: number): number {
  const indexes = Array.from({ length: Math.max(0, rowCount) }, (_, index) => index);
  return listAllPendingSigningIds(indexes).length;
}

export function checkSigningPending(id: string, rowIndex: number): boolean {
  const entry = entries.get(id) ?? ensureEntry(id, rowIndex);
  return entry.status === 'pending';
}

export function getSigningDetail(id: string, rowIndex: number): SigningDetail {
  const entry = ensureEntry(id, rowIndex);
  return { ...entry };
}

export function submitSigningAction(
  id: string,
  rowIndex: number,
  action: 'pass' | 'reject',
  password: string,
): { ok: true } | { ok: false; reason: 'processed' | 'invalid-password' } {
  const entry = ensureEntry(id, rowIndex);
  if (entry.status !== 'pending') {
    return { ok: false, reason: 'processed' };
  }
  if (password !== MOCK_PASSWORD) {
    return { ok: false, reason: 'invalid-password' };
  }
  entry.status = action === 'pass' ? 'signed' : 'rejected';
  entry.version += 1;
  entry.processedAt = Date.now();
  touchSigningStore();
  return { ok: true };
}

export function submitBatchSigningAction(
  ids: string[],
  action: 'pass' | 'reject',
  password: string,
): { ok: true; processedIds: string[] } | { ok: false; reason: 'processed' | 'invalid-password' | 'multi-sign' } {
  if (password !== MOCK_PASSWORD) {
    return { ok: false, reason: 'invalid-password' };
  }
  for (const id of ids) {
    const rowIndex = parseRowIndexFromSigningId(id);
    if (!isSigningRowEligibleForBatch(rowIndex)) {
      return { ok: false, reason: 'multi-sign' };
    }
    const entry = ensureEntry(id, rowIndex);
    if (entry.status !== 'pending') {
      return { ok: false, reason: 'processed' };
    }
  }
  const processedIds: string[] = [];
  for (const id of ids) {
    const rowIndex = parseRowIndexFromSigningId(id);
    const entry = entries.get(id)!;
    entry.status = action === 'pass' ? 'signed' : 'rejected';
    entry.version += 1;
    entry.processedAt = Date.now();
    processedIds.push(id);
  }
  touchSigningStore();
  return { ok: true, processedIds };
}

export function resetSigningStoreForDemo() {
  entries.clear();
  touchSigningStore();
}

export type { SigningStatus };
