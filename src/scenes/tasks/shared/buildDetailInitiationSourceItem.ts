import {
  createDetailApplyItemRow,
  type DetailItemData,
} from '@eds/desktop-components';
import {
  resolveInitiationSourceForRow,
  type InitiationSourceKind,
} from './resolveInitiationSourceForRow';

const INITIATION_SOURCE_TYPE_LABEL_KEYS: Record<InitiationSourceKind, string> = {
  wallet: 'Wallet',
  application: 'App',
  'waas-project': 'WaaS',
};

export function buildDetailInitiationSourceItem(
  rowIndex: number,
  translate: (key: string) => string,
): DetailItemData {
  const source = resolveInitiationSourceForRow(rowIndex);
  const title = translate('Initiation source');
  const typeLabel = translate(INITIATION_SOURCE_TYPE_LABEL_KEYS[source.kind]);

  return {
    ...createDetailApplyItemRow('initiated-by', {
      key: 'initiation-source',
      title,
      value: typeLabel,
    }),
    // initiated-by 默认 valueType=user 会渲染头像；显式关掉 value 侧 symbol，保留标题 eds-arrow-launch-circle。
    showValueSymbol: true,
    valueSymbolKind: undefined,
  };
}
