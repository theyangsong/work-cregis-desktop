import { buildAmountRowValues } from '../../list-field/tasksListFieldAmountRowData';
import { buildTasksListFieldCurrencyCustomize } from '../../list-field/tasksListFieldCurrencyDefaults';

/** 进度弹层金额行：数量 + 币种符号 + 网络 Tag（对齐主列表币种列 EgCryptoCombo）。 */
export function buildProgressAmountCurrencyCustomize(rowIndex: number) {
  const amount = buildAmountRowValues(rowIndex);
  const base = buildTasksListFieldCurrencyCustomize(rowIndex);

  return {
    ...base,
    comboMode: 'currency-only',
    symbol: `${amount.cryptoValue} ${amount.cryptoSymbol}`,
    minWidth: '',
  };
}
