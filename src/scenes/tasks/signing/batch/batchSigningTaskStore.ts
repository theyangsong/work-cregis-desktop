import { ref } from 'vue';
import { submitBatchSigningAction, submitSigningAction } from '../signingStore';
import { buildBatchSigningRowModel } from './buildBatchSigningRowModel';
import {
  BATCH_PROGRESS_LAST_ROW_MS,
  BATCH_PROGRESS_OTHER_ROW_MAX_MS,
  BATCH_PROGRESS_STEPS_PER_ROW,
} from './batchSigning.constants';
import type {
  BatchSigningFailReason,
  BatchSigningRowStatus,
  BatchSigningTask,
  BatchSigningTaskRow,
  SigningBatchRowModel,
} from './types';

const activeTask = ref<BatchSigningTask | null>(null);
const rowTimers: ReturnType<typeof setTimeout>[] = [];

function clearRowTimers() {
  for (const timerId of rowTimers) {
    clearTimeout(timerId);
  }
  rowTimers.length = 0;
}

function scheduleRowTimeout(fn: () => void, delayMs: number) {
  const timerId = window.setTimeout(fn, delayMs);
  rowTimers.push(timerId);
}

function randomRowDurationMs(): number {
  return Math.floor(Math.random() * (BATCH_PROGRESS_OTHER_ROW_MAX_MS + 1));
}

function resolveRowDurationMs(rowIndexInArray: number, totalRows: number): number {
  if (rowIndexInArray === 0) {
    return 0;
  }
  if (rowIndexInArray === 1) {
    return randomRowDurationMs();
  }
  if (rowIndexInArray === totalRows - 1) {
    return BATCH_PROGRESS_LAST_ROW_MS;
  }
  return randomRowDurationMs();
}

function mockTxHash(rowIndex: number): string {
  return `0x${(rowIndex + 1).toString(16).padStart(8, '0')}…${(rowIndex * 17 + 91).toString(16).slice(-4)}`;
}

/** 演示：第 1 条广播失败 → 成功 → 失败 → 成功，按 rowIndex % 4 循环。 */
function resolveDemoRowTerminalState(rowIndex: number): {
  status: 'success' | 'failed';
  failReason?: BatchSigningFailReason;
  txHash?: string;
} {
  const cycle = rowIndex % 4;

  if (cycle === 0) {
    return { status: 'failed', failReason: 'broadcast-failed' };
  }
  if (cycle === 2) {
    return { status: 'failed', failReason: 'sign-failed' };
  }
  return { status: 'success', txHash: mockTxHash(rowIndex) };
}

function advanceRowStatus(row: BatchSigningTaskRow): BatchSigningTaskRow {
  if (row.status === 'pending') {
    return { ...row, status: 'signing', updatedAt: Date.now() };
  }
  if (row.status === 'signing') {
    return { ...row, status: 'broadcasting', updatedAt: Date.now() };
  }
  if (row.status === 'broadcasting') {
    const terminal = resolveDemoRowTerminalState(row.rowIndex);
    return {
      ...row,
      status: terminal.status,
      failReason: terminal.failReason,
      txHash: terminal.txHash,
      updatedAt: Date.now(),
    };
  }
  return row;
}

function commitRowSuccess(task: BatchSigningTask, row: BatchSigningTaskRow) {
  const password = task.verifyPassword;
  if (!password) return;
  submitSigningAction(row.signingId, row.rowIndex, 'pass', password);
}

function countRowsByStatus(rows: BatchSigningTaskRow[], status: BatchSigningRowStatus) {
  return rows.filter((row) => row.status === status).length;
}

function recomputeTaskStatus(task: BatchSigningTask) {
  const pending = countRowsByStatus(task.rows, 'pending');
  const signing = countRowsByStatus(task.rows, 'signing');
  const broadcasting = countRowsByStatus(task.rows, 'broadcasting');

  if (task.status === 'stopped') {
    return;
  }

  if (pending + signing + broadcasting === 0) {
    const failed = countRowsByStatus(task.rows, 'failed');
    task.status = failed > 0 && failed === task.rows.length ? 'abnormal' : 'ended';
    task.endedAt = Date.now();
    clearRowTimers();
  }
}

function publishTaskUpdate(task: BatchSigningTask) {
  activeTask.value = {
    ...task,
    rows: [...task.rows],
  };
}

function applyRowAdvance(task: BatchSigningTask, rowIndexInArray: number) {
  if (task.status !== 'running') return;

  const rows = [...task.rows];
  const current = rows[rowIndexInArray];
  if (!current) return;

  rows[rowIndexInArray] = advanceRowStatus(current);
  const updated = rows[rowIndexInArray]!;
  if (updated.status === 'success') {
    commitRowSuccess(task, updated);
  }
  task.rows = rows;
  recomputeTaskStatus(task);
  publishTaskUpdate(task);
}

function completeRowWithDuration(
  task: BatchSigningTask,
  rowIndexInArray: number,
  totalMs: number,
) {
  const row = task.rows[rowIndexInArray];
  if (!row || row.status === 'success' || row.status === 'failed') return;

  if (totalMs <= 0) {
    for (let step = 0; step < BATCH_PROGRESS_STEPS_PER_ROW; step += 1) {
      const current = task.rows[rowIndexInArray];
      if (
        !current
        || current.status === 'success'
        || current.status === 'failed'
        || task.status !== 'running'
      ) {
        break;
      }
      applyRowAdvance(task, rowIndexInArray);
    }
    return;
  }

  const stepMs = Math.max(1, Math.floor(totalMs / BATCH_PROGRESS_STEPS_PER_ROW));
  for (let step = 1; step <= BATCH_PROGRESS_STEPS_PER_ROW; step += 1) {
    scheduleRowTimeout(() => {
      applyRowAdvance(task, rowIndexInArray);
    }, stepMs * step);
  }
}

function startRowSchedulers(task: BatchSigningTask) {
  const totalRows = task.rows.length;
  task.rows.forEach((_row, index) => {
    completeRowWithDuration(task, index, resolveRowDurationMs(index, totalRows));
  });
}

export function getActiveBatchSigningTask() {
  return activeTask;
}

export function createBatchSigningTask(options: {
  rows: SigningBatchRowModel[];
  remark: string;
  minerFeeDisplay: string | null;
  verifyPassword: string;
}): BatchSigningTask {
  clearRowTimers();
  const sample = options.rows[0];
  const task: BatchSigningTask = {
    id: `batch-${Date.now()}`,
    currencyKey: sample?.currencyKey ?? 'unknown',
    currencyLabel: sample?.currencyLabel ?? '',
    status: 'running',
    startedAt: Date.now(),
    remark: options.remark,
    minerFeeDisplay: options.minerFeeDisplay,
    verifyPassword: options.verifyPassword,
    rows: options.rows.map((row) => ({
      signingId: row.signingId,
      rowIndex: row.rowIndex,
      status: 'pending' as const,
      minerFeeDisplay: options.minerFeeDisplay ?? undefined,
      updatedAt: Date.now(),
    })),
  };

  activeTask.value = task;
  startRowSchedulers(task);
  return task;
}

export function stopBatchSigningTask() {
  const task = activeTask.value;
  if (!task || task.status !== 'running') return;
  clearRowTimers();
  task.rows = task.rows.map((row) => {
    if (row.status === 'signing' || row.status === 'broadcasting') {
      return {
        ...row,
        status: 'failed' as const,
        failReason: 'sign-failed' as const,
        updatedAt: Date.now(),
      };
    }
    return row;
  });
  task.status = 'stopped';
  task.endedAt = Date.now();
  publishTaskUpdate(task);
}

export function clearBatchSigningTask() {
  clearRowTimers();
  activeTask.value = null;
}

export function commitBatchRejectResults(
  ids: string[],
  password: string,
) {
  if (ids.length === 0) return { ok: false as const, reason: 'processed' as const };
  return submitBatchSigningAction(ids, 'reject', password);
}

export function resolveProgressRowModel(row: BatchSigningTaskRow) {
  return buildBatchSigningRowModel(row.rowIndex);
}

export function formatElapsedDuration(startedAt: number, endedAt?: number): string {
  const totalSeconds = Math.max(
    0,
    Math.floor(((endedAt ?? Date.now()) - startedAt) / 1000),
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function countTaskStats(task: BatchSigningTask) {
  const pending = task.rows.filter((row) => row.status === 'pending').length;
  const success = task.rows.filter((row) => row.status === 'success').length;
  const failed = task.rows.filter((row) => row.status === 'failed').length;
  const inFlight = task.rows.filter(
    (row) => row.status === 'signing' || row.status === 'broadcasting',
  ).length;
  return { pending, success, failed, inFlight };
}

export function computeProgressPercent(task: BatchSigningTask): number {
  if (task.rows.length === 0) return 0;
  const done = task.rows.filter(
    (row) => row.status === 'success' || row.status === 'failed',
  ).length;
  return Math.round((done / task.rows.length) * 100);
}

export function isBatchSigningTaskIncomplete(task: BatchSigningTask): boolean {
  if (task.status !== 'running') {
    return false;
  }
  return task.rows.some(
    (row) =>
      row.status === 'pending'
      || row.status === 'signing'
      || row.status === 'broadcasting',
  );
}

export function isBatchSigningTaskRunning(task: BatchSigningTask): boolean {
  return task.status === 'running';
}
