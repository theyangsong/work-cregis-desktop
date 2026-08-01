import { buildTransferTypeRowValues } from '../list-field/tasksListFieldBusinessTypeRowData';
import { isWaasPayoutTransferType } from './waasProjectNames';

export type InitiationSourceKind = 'wallet' | 'application' | 'waas-project';

export type InitiationSourceRowModel = {
  kind: InitiationSourceKind;
};

/** 与列表发起方列同源：钱包（头像成员）/ Swap 应用 / WaaS 项目。 */
export function resolveInitiationSourceForRow(rowIndex: number): InitiationSourceRowModel {
  const transferType = buildTransferTypeRowValues(rowIndex);

  if (transferType.value === 'Swap') {
    return { kind: 'application' };
  }

  if (isWaasPayoutTransferType(transferType.value)) {
    return { kind: 'waas-project' };
  }

  return { kind: 'wallet' };
}
