import { DATA_LIST_FIGMA_HEADER_HEIGHT } from '../../tasksDataListPageData';

export const BATCH_DATA_LIST_COLUMN_HEIGHT = 66;
export const BATCH_DATA_LIST_ROW_GAP_PX = 1;
/** 批签详情/原因子页：付款钱包 + 发送方 + 接收方组合列最小宽度。 */
export const BATCH_WALLET_COMBO_COLUMN_MIN_WIDTH = '340px';
/** 批签详情/原因子页：金额 + 业务类型列最小宽度。 */
export const BATCH_AMOUNT_COLUMN_MIN_WIDTH = '160px';
/** 不可签名原因列最小宽度。 */
export const BATCH_INELIGIBLE_REASON_COLUMN_MIN_WIDTH = '130px';

export function computeBatchDataListHeight(
  rowCount: number,
  headerHeight = DATA_LIST_FIGMA_HEADER_HEIGHT,
  columnHeight = BATCH_DATA_LIST_COLUMN_HEIGHT,
): number {
  if (rowCount <= 0) {
    return headerHeight;
  }

  return (
    headerHeight
    + rowCount * (columnHeight + BATCH_DATA_LIST_ROW_GAP_PX)
    + BATCH_DATA_LIST_ROW_GAP_PX
  );
}
