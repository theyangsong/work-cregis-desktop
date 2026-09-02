import { ref } from 'vue';
import { isMultiSignRow } from '../list-field/tasksListFieldBusinessTypeRowData';
import { buildMockDetailProgressFields } from '../shared/buildMockDetailProgressFields';
import { buildSigningDetailRowFields } from './buildSigningDetailRowFields';
import type { SigningDetail, SigningStatus } from './types';

const MOCK_PASSWORD = '111111';

export function verifyTradePassword(password: string): boolean {
  return password === MOCK_PASSWORD;
}

export const signingStoreRevision = ref(0);

function touchSigningStore() {
  signingStoreRevision.value += 1;
}

type StoreEntry = SigningDetail & { processedAt?: number };

const entries = new Map<string, StoreEntry>();

function buildCustomDetailFields(rowIndex: number) {
  return buildMockDetailProgressFields(rowIndex, {
    initiatorNote: 'Please sign before cutoff.',
    scenario: 'signing-workflow',
  });
}

function buildDetail(id: string, rowIndex: number, menuItem = 'Signing'): StoreEntry {
  return {
    id,
    status: 'pending',
    version: 1,
    ...buildSigningDetailRowFields(rowIndex, menuItem),
    ...buildCustomDetailFields(rowIndex),
  };
}

function syncDetailFromRow(
  entry: StoreEntry,
  rowIndex: number,
  menuItem = 'Signing',
) {
  Object.assign(entry, buildSigningDetailRowFields(rowIndex, menuItem));
  Object.assign(
    entry,
    buildMockDetailProgressFields(rowIndex, {
      initiatorNote: 'Please sign before cutoff.',
      scenario: 'signing-workflow',
    }),
  );
}

function ensureEntry(
  id: string,
  rowIndex: number,
  menuItem = 'Signing',
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

export function signingIdFromRowIndex(index: number): string {
  return `SIG-${String(index + 1).padStart(6, '0')}`;
}

export function parseRowIndexFromSigningId(id: string): number {
  const match = /^SIG-(\d+)$/.exec(id);
  if (!match) return 0;
  return Math.max(0, Number.parseInt(match[1], 10) - 1);
}

/** 与列表 Payout Wallets 列「多签」Tag 同源（rightLabel === 'Multi-Sign'）。 */
export function isMultiSignSigningDetail(
  detail: Pick<SigningDetail, 'id'> | null | undefined,
): boolean {
  if (!detail) return false;
  return isMultiSignRow(parseRowIndexFromSigningId(detail.id));
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

export function getSigningDetail(
  id: string,
  rowIndex: number,
  menuItem = 'Signing',
): SigningDetail {
  const entry = ensureEntry(id, rowIndex, menuItem);
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
