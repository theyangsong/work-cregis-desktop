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

const APPROVED_STATUS_PASSED: TasksListFieldStatusRow = {
  status: 'success',
  label: 'Approval Passed',
};

const APPROVED_STATUS_REJECT: TasksListFieldStatusRow = {
  status: 'danger',
  label: 'Approval Reject',
};

/** 已审批模块：固定第 2 行演示审批驳回。 */
const APPROVED_REJECT_DEMO_ROW_INDEX = 1;

/** 已审批列表：仅审批通过 / 审批驳回。 */
function buildApprovedModuleStatusRowValues(rowIndex: number): TasksListFieldStatusRow {
  if (rowIndex === APPROVED_REJECT_DEMO_ROW_INDEX) {
    return APPROVED_STATUS_REJECT;
  }
  return APPROVED_STATUS_PASSED;
}

const APPROVED_DETAIL_WAITING_SIGNATURE: TasksListFieldStatusRow = {
  status: 'warning',
  label: 'Waiting for signature',
};

/** 已审批详情：第 1、3、4 条（index 0、2、3）分别演示签名三态。 */
const APPROVED_DETAIL_SIGNATURE_DEMO_ROWS = new Map<number, TasksListFieldStatusRow>([
  [0, APPROVED_DETAIL_WAITING_SIGNATURE],
  [2, { status: 'danger', label: 'Signature Reject' }],
  [3, { status: 'success', label: 'Signature Passed' }],
]);

/** 已审批详情进度：与列表 Status 列解耦，保留签名链路演示。 */
export function buildApprovedModuleDetailStatusRowValues(
  rowIndex: number,
): TasksListFieldStatusRow {
  if (rowIndex === APPROVED_REJECT_DEMO_ROW_INDEX) {
    return APPROVED_STATUS_REJECT;
  }
  return APPROVED_DETAIL_SIGNATURE_DEMO_ROWS.get(rowIndex) ?? APPROVED_DETAIL_WAITING_SIGNATURE;
}

const SIGNATURE_PASSED_STATUS: TasksListFieldStatusRow = {
  status: 'success',
  label: 'Signature Passed',
};

/** All Records / Sent Request 等模块默认行状态。 */
const APPROVED_STATUS_SIGNED = SIGNATURE_PASSED_STATUS;

/** All Records / Sent Request 前四行演示各状态；第 5 行（index 4）演示已撤回。 */
const APPROVED_STATUS_DEMO_ROWS: ReadonlyArray<TasksListFieldStatusRow> = [
  { status: 'warning', label: 'Pending Approval' },
  { status: 'danger', label: 'Approval Reject' },
  { status: 'warning', label: 'Waiting for signature' },
  { status: 'danger', label: 'Signature Reject' },
  { status: 'invalid', label: 'Withdrawn' },
];

/** All Records / Sent Request：第 5 行（index 4）固定已撤回。 */
export const WITHDRAWN_DEMO_ROW_INDEX = 4;

const SIGNED_STATUS_PASSED = SIGNATURE_PASSED_STATUS;

const SIGNED_STATUS_REJECT: TasksListFieldStatusRow = {
  status: 'danger',
  label: 'Signature Reject',
};

/** 已签名模块：固定第 2 行演示签名驳回。 */
const SIGNED_REJECT_DEMO_ROW_INDEX = 1;

/** All Records / Sent Request / 已签名：固定第 8 行（index 7）演示系统签名驳回。 */
export const SYSTEM_SIGNATURE_REJECT_ROW_INDEX = 7;

function buildApprovedStatusRowValues(rowIndex: number): TasksListFieldStatusRow {
  if (rowIndex === SYSTEM_SIGNATURE_REJECT_ROW_INDEX) {
    return SIGNED_STATUS_REJECT;
  }
  return APPROVED_STATUS_DEMO_ROWS[rowIndex] ?? APPROVED_STATUS_SIGNED;
}

function usesApprovedStatusData(menuItem?: string): boolean {
  return menuItem === 'Approved' || menuItem === 'All Records' || menuItem === 'Sent Request';
}

function buildSignedStatusRowValues(rowIndex: number): TasksListFieldStatusRow {
  if (
    rowIndex === SIGNED_REJECT_DEMO_ROW_INDEX
    || rowIndex === SYSTEM_SIGNATURE_REJECT_ROW_INDEX
  ) {
    return SIGNED_STATUS_REJECT;
  }
  return SIGNED_STATUS_PASSED;
}

function buildGenericStatusRowValues(rowIndex: number): TasksListFieldStatusRow {
  return GENERIC_STATUS_ROW_VALUES[rowIndex % GENERIC_STATUS_ROW_VALUES.length] ?? GENERIC_STATUS_ROW_VALUES[0];
}

export function buildStatusRowValues(
  rowIndex: number,
  menuItem?: string,
): TasksListFieldStatusRow {
  if (menuItem === 'Approved') {
    return buildApprovedModuleStatusRowValues(rowIndex);
  }
  if (usesApprovedStatusData(menuItem)) {
    return buildApprovedStatusRowValues(rowIndex);
  }
  if (menuItem === 'Signed') {
    return buildSignedStatusRowValues(rowIndex);
  }
  return buildGenericStatusRowValues(rowIndex);
}

export function defaultStatusRowValues(menuItem?: string): TasksListFieldStatusRow {
  if (menuItem === 'Approved') {
    return APPROVED_STATUS_PASSED;
  }
  if (usesApprovedStatusData(menuItem)) {
    return APPROVED_STATUS_SIGNED;
  }
  if (menuItem === 'Signed') {
    return SIGNED_STATUS_PASSED;
  }
  return GENERIC_STATUS_ROW_VALUES[0];
}
