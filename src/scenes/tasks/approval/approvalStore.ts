import { ref } from 'vue';
import type { ApprovalDetail, ApprovalStatus } from './types';
import { buildApprovalDetailRowFields } from './buildApprovalDetailRowFields';

const MOCK_PASSWORD = '123456';

export const approvalStoreRevision = ref(0);

function touchApprovalStore() {
  approvalStoreRevision.value += 1;
}

type StoreEntry = ApprovalDetail & { processedAt?: number };

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

function buildCustomDetailFields(id: string, rowIndex: number) {
  const appliedAt = new Date(Date.UTC(2026, 6, 17, 14, 8, 11));

  const member: ApprovalDetail['approvalNodes'][number]['members'][number] = {
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
    initiatorNote: 'Please approve before cutoff.',
    initiatorAtDisplay: formatUtcTimestamp(appliedAt, 8),
    approvalNodes: [
      {
        title: 'Approval Node 1',
        statusLabel: 'Pending (1/2)',
        members: [member, { ...member, name: 'Reviewer', avatarName: 'Reviewer' }],
      },
      {
        title: 'Approval Node 2',
        statusLabel: 'Waiting',
        members: [{ ...member, name: 'Auditor', avatarName: 'Auditor' }],
      },
    ],
    signingMode: rowIndex % 2 === 0 ? ('multi' as const) : ('single' as const),
    signingThreshold: rowIndex % 2 === 0 ? '2 / 3' : null,
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
    ...buildApprovalDetailRowFields(rowIndex),
    ...buildCustomDetailFields(id, rowIndex),
  };
}

function syncDetailFromRow(entry: StoreEntry, rowIndex: number) {
  Object.assign(entry, buildApprovalDetailRowFields(rowIndex));
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

export function approvalIdFromRowIndex(index: number): string {
  return `APR-${String(index + 1).padStart(6, '0')}`;
}

export function parseRowIndexFromApprovalId(id: string): number {
  const match = /^APR-(\d+)$/.exec(id);
  if (!match) return 0;
  return Math.max(0, Number.parseInt(match[1], 10) - 1);
}

export function listPendingApprovalIds(allRowIndexes: number[]): string[] {
  return allRowIndexes
    .map((index) => approvalIdFromRowIndex(index))
    .filter((id) => {
      const entry = entries.get(id);
      return !entry || entry.status === 'pending';
    });
}

export function countPendingApprovals(rowCount: number): number {
  const indexes = Array.from({ length: Math.max(0, rowCount) }, (_, index) => index);
  return listPendingApprovalIds(indexes).length;
}

export function checkApprovalPending(id: string, rowIndex: number): boolean {
  const entry = entries.get(id) ?? ensureEntry(id, rowIndex);
  return entry.status === 'pending';
}

export function getApprovalDetail(id: string, rowIndex: number): ApprovalDetail {
  const entry = ensureEntry(id, rowIndex);
  return { ...entry };
}

export function submitApprovalAction(
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
  entry.status = action === 'pass' ? 'approved' : 'rejected';
  entry.version += 1;
  entry.processedAt = Date.now();
  touchApprovalStore();
  return { ok: true };
}

export function submitBatchApprovalAction(
  ids: string[],
  action: 'pass' | 'reject',
  password: string,
): { ok: true; processedIds: string[] } | { ok: false; reason: 'processed' | 'invalid-password' } {
  if (password !== MOCK_PASSWORD) {
    return { ok: false, reason: 'invalid-password' };
  }
  const processedIds: string[] = [];
  for (const id of ids) {
    const rowIndex = parseRowIndexFromApprovalId(id);
    const entry = ensureEntry(id, rowIndex);
    if (entry.status !== 'pending') {
      return { ok: false, reason: 'processed' };
    }
  }
  for (const id of ids) {
    const rowIndex = parseRowIndexFromApprovalId(id);
    const entry = entries.get(id)!;
    entry.status = action === 'pass' ? 'approved' : 'rejected';
    entry.version += 1;
    entry.processedAt = Date.now();
    processedIds.push(id);
  }
  touchApprovalStore();
  return { ok: true, processedIds };
}

export function resetApprovalStoreForDemo() {
  entries.clear();
  touchApprovalStore();
}

export type { ApprovalStatus };
