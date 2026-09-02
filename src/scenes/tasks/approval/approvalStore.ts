import { ref } from 'vue';
import type { ApprovalDetail, ApprovalStatus } from './types';
import { buildMockDetailProgressFields } from '../shared/buildMockDetailProgressFields';
import { buildApprovalDetailRowFields } from './buildApprovalDetailRowFields';

const MOCK_PASSWORD = '111111';

export const approvalStoreRevision = ref(0);

function touchApprovalStore() {
  approvalStoreRevision.value += 1;
}

type StoreEntry = ApprovalDetail & { processedAt?: number };

const entries = new Map<string, StoreEntry>();

function buildCustomDetailFields(rowIndex: number) {
  return buildMockDetailProgressFields(rowIndex, {
    initiatorNote: 'Please approve before cutoff.',
    scenario: 'approval-workflow',
  });
}

function buildDetail(id: string, rowIndex: number, menuItem = 'Approval'): StoreEntry {
  return {
    id,
    status: 'pending',
    version: 1,
    ...buildApprovalDetailRowFields(rowIndex, menuItem),
    ...buildCustomDetailFields(rowIndex),
  };
}

function syncDetailFromRow(
  entry: StoreEntry,
  rowIndex: number,
  menuItem = 'Approval',
) {
  Object.assign(entry, buildApprovalDetailRowFields(rowIndex, menuItem));
  Object.assign(
    entry,
    buildMockDetailProgressFields(rowIndex, {
      initiatorNote: 'Please approve before cutoff.',
      scenario: 'approval-workflow',
    }),
  );
}

function ensureEntry(
  id: string,
  rowIndex: number,
  menuItem = 'Approval',
): StoreEntry {
  const existing = entries.get(id);
  if (existing) {
    syncDetailFromRow(existing, rowIndex, menuItem);
    return existing;
  }
  const created = buildDetail(id, rowIndex, menuItem);
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

export function getApprovalDetail(
  id: string,
  rowIndex: number,
  menuItem = 'Approval',
): ApprovalDetail {
  const entry = ensureEntry(id, rowIndex, menuItem);
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
