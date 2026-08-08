export type TasksListFieldStatusKind = 'danger' | 'warning' | 'success' | 'ready' | 'invalid';

export type TasksListFieldStatusRow = {
  status: TasksListFieldStatusKind;
  label: string;
};

/** 进行中类 → warning；等待中类 → ready；无效取消类 → invalid；成功类 → success；失败类 → danger。 */
const GENERIC_STATUS_ROW_VALUES: ReadonlyArray<TasksListFieldStatusRow> = [
  { status: 'success', label: 'Success' },
  { status: 'warning', label: 'Pending' },
  { status: 'danger', label: 'Failed' },
  { status: 'ready', label: 'Ready' },
  { status: 'invalid', label: 'Expired' },
];

const APPROVED_STATUS_SIGNED: TasksListFieldStatusRow = {
  status: 'success',
  label: 'Signed',
};

/** Approved 模块前五行演示各状态；其余行默认 Signed。 */
const APPROVED_STATUS_DEMO_ROWS: ReadonlyArray<TasksListFieldStatusRow> = [
  { status: 'warning', label: 'Approving' },
  { status: 'danger', label: 'Approval Reject' },
  { status: 'ready', label: 'Waiting for signature' },
  { status: 'danger', label: 'Signature Reject' },
  { status: 'invalid', label: 'Withdrawn' },
];

const SIGNED_STATUS_SUCCESS: TasksListFieldStatusRow = {
  status: 'success',
  label: 'Success',
};

/** Signed 模块前三行演示各状态；其余行默认 Success。 */
const SIGNED_STATUS_DEMO_ROWS: ReadonlyArray<TasksListFieldStatusRow> = [
  { status: 'ready', label: 'Pending' },
  { status: 'danger', label: 'Failed' },
  { status: 'invalid', label: 'Canceled' },
];

function buildApprovedStatusRowValues(rowIndex: number): TasksListFieldStatusRow {
  return APPROVED_STATUS_DEMO_ROWS[rowIndex] ?? APPROVED_STATUS_SIGNED;
}

function usesApprovedStatusData(menuItem?: string): boolean {
  return menuItem === 'Approved' || menuItem === 'All Records' || menuItem === 'Sent Request';
}

function buildSignedStatusRowValues(rowIndex: number): TasksListFieldStatusRow {
  return SIGNED_STATUS_DEMO_ROWS[rowIndex] ?? SIGNED_STATUS_SUCCESS;
}

function buildGenericStatusRowValues(rowIndex: number): TasksListFieldStatusRow {
  return GENERIC_STATUS_ROW_VALUES[rowIndex % GENERIC_STATUS_ROW_VALUES.length] ?? GENERIC_STATUS_ROW_VALUES[0];
}

export function buildStatusRowValues(
  rowIndex: number,
  menuItem?: string,
): TasksListFieldStatusRow {
  if (usesApprovedStatusData(menuItem)) {
    return buildApprovedStatusRowValues(rowIndex);
  }
  if (menuItem === 'Signed') {
    return buildSignedStatusRowValues(rowIndex);
  }
  return buildGenericStatusRowValues(rowIndex);
}

export function defaultStatusRowValues(menuItem?: string): TasksListFieldStatusRow {
  if (usesApprovedStatusData(menuItem)) {
    return APPROVED_STATUS_SIGNED;
  }
  if (menuItem === 'Signed') {
    return SIGNED_STATUS_SUCCESS;
  }
  return GENERIC_STATUS_ROW_VALUES[0];
}
