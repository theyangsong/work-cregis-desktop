/** Tasks Data List 页面数据 — 对齐 eds-desktop Showcase DataListPagePreview。 */

import type { AppLocale } from '@/composables/useAppLocale';
import { I18N_DOC_EN_LABELS } from '@/i18n/i18nDocEnLabels';
import { resolveEnglishUiText } from '@/i18n/translateUiText';
import { UI_TEXT_ZH_CN } from '@/i18n/uiTextZhCN';
import { UI_TEXT_ZH_TW } from '@/i18n/uiTextZhTW';
import { buildStatusRowValues } from './list-field/tasksListFieldStatusRowData';

/** 发送方列 min-width（含 cell 左右 padding）。 */
export const SENDER_DATA_LIST_COLUMN_MIN_WIDTH = '170px';

/** 接收方列 min-width（含 cell 左右 padding）。 */
export const RECEIVER_DATA_LIST_COLUMN_MIN_WIDTH = '180px';

/** @deprecated 使用 SENDER_DATA_LIST_COLUMN_MIN_WIDTH / RECEIVER_DATA_LIST_COLUMN_MIN_WIDTH */
export const SENDER_RECEIVER_DATA_LIST_COLUMN_MIN_WIDTH = SENDER_DATA_LIST_COLUMN_MIN_WIDTH;

/** 接收方列 min-width（含 cell 左右 padding）。 */
export const CURRENCY_DATA_LIST_COLUMN_MIN_WIDTH = RECEIVER_DATA_LIST_COLUMN_MIN_WIDTH;

/** 第一列 Submitter：较高 min-width，在 DataList 均分 extra 时占据更多列宽。 */
export const GENERAL_STRUCTURE_DATA_LIST_COLUMN_MIN_WIDTH = '190px';

/** 发送方列 min-width（含 cell 左右 padding）。 */
export const BUSINESS_TYPE_DATA_LIST_COLUMN_MIN_WIDTH = SENDER_DATA_LIST_COLUMN_MIN_WIDTH;

/** Status 列 min-width（含 cell padding；EgTag lg + truncate 展示 Approved 长文案）。 */
export const STATUS_DATA_LIST_COLUMN_MIN_WIDTH = '120px';

/** Status 列 display-order：高于 Payout Wallets，避免响应式缩列时被隐藏。 */
export const STATUS_DATA_LIST_COLUMN_DISPLAY_ORDER = 2;

/** Payout Wallets 列 display-order：Status 展示时降低优先级。 */
export const BUSINESS_TYPE_DATA_LIST_COLUMN_DISPLAY_ORDER = 5;

/** 第二列金额列 min-width（含 cell 左右 padding）。 */
export const AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH = '200px';

/** 记录类模块（含 Status 列）第二列 min-width：原 190px − 20。 */
export const RECORDS_GENERAL_STRUCTURE_DATA_LIST_COLUMN_MIN_WIDTH = '170px';

/** 记录类模块（含 Status 列）金额列 min-width：200px + 20。 */
export const RECORDS_AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH = '220px';

/** 尾列操作列 min-width（含 cell 左右 padding）。 */
export const ACTION_DATA_LIST_COLUMN_MIN_WIDTH = '120px';

/** ListFieldAction 主按钮 i18n key（待审批 / 待签名操作列统一为「处理」）。 */
export const DATA_LIST_PRIMARY_ACTION_LABEL = 'Process';
export const DATA_LIST_PRIMARY_ACTION_LABEL_EN = 'Process';

export const DATA_LIST_APPROVAL_ROW_COUNT = 68;
export const DATA_LIST_SIGNING_ROW_COUNT = 134;

/** Approval 默认条数；其它待办列表未单独配置时同此值。 */
export const DATA_LIST_FIGMA_ROW_COUNT = DATA_LIST_APPROVAL_ROW_COUNT;

export const DATA_LIST_FIGMA_PAGE_SIZE_OPTIONS = ['20', '50', '100'] as const;

export const DATA_LIST_FIGMA_HEADER_HEIGHT = 32;

export const DATA_LIST_FIGMA_TOOLBAR = {
  title: 'Item',
  showOperation: true,
  showSection: true,
  showDivider: true,
  showBack: false,
} as const;

export const DATA_LIST_FIGMA_PAGINER = {
  dataVolumeCount: '68',
  dataVolumeTotal: 'Total',
  dataVolumeResults: 'Items',
  showStatistics: false,
  statisticsCount: 2,
  statText: 'Item',
  statNumber: '0',
} as const;

export const DATA_LIST_FIGMA_COLUMNS = {
  combo: {
    label: 'Token',
    secondaryLabel: 'Receiver',
    minWidth: '168px',
  },
  sortable: {
    label: 'Initiating party',
    secondaryLabel: 'Operation Type',
    minWidth: '190px',
    align: 'left' as const,
  },
  businessType: {
    label: 'Outbound Wallet',
    minWidth: '170px',
    align: 'left' as const,
  },
  amount: {
    label: 'Amount',
    secondaryLabel: 'Created Time',
    minWidth: '200px',
    align: 'left' as const,
  },
  plain: {
    label: 'Header',
    minWidth: '240px',
    align: 'center' as const,
  },
  actions: {
    label: 'Action',
    minWidth: '120px',
    align: 'right' as const,
  },
} as const;

export const DATA_LIST_PREVIEW_COLUMN_COUNT = 5;

export type DataListColumnAlign = 'left' | 'center' | 'right';

export type DataListColumnDataSource =
  | 'placeholder'
  | 'currency'
  | 'general-structure'
  | 'operation-type'
  | 'business-type'
  | 'status'
  | 'amount'
  | 'receiver'
  | 'created-time'
  | 'action';

export type DataListPreviewColumnSetting = {
  minWidth: string;
  align: DataListColumnAlign;
  sortable: boolean;
  dataSource: DataListColumnDataSource;
  label: string;
  secondaryLabel?: string;
  secondarySortable?: boolean;
};

export type IconButtonProItemState = {
  label: string;
  icon: string;
  showBadge: boolean;
  badge: string;
  showReddot: boolean;
  disabled: boolean;
};

export type PaginerPaginationSlotKey = 'first' | 'prev' | 'page' | 'next' | 'last';

export type PaginerPaginationItemState = {
  kind: 'symbol' | 'number' | 'button';
  tone: 'brand' | 'decor';
  label: string;
  disabled: boolean;
};

export const TASKS_MODULE_MENU_ITEMS_WITH_DATA_LIST = [
  'Approval',
  'Signing',
  'Approved',
  'Signed',
  'All Records',
  'Sent Request',
] as const;

export type TasksDataListMenuItemLabel = (typeof TASKS_MODULE_MENU_ITEMS_WITH_DATA_LIST)[number];

/** 模块菜单展示 key：路由仍用 `Approval`，中文展示对齐 `Pending Approval` → 待审批。 */
export const TASKS_MODULE_MENU_DISPLAY_LABEL: Partial<
  Record<TasksDataListMenuItemLabel, string>
> = {
  Approval: 'Pending Approval',
};

export function resolveTasksModuleMenuDisplayLabel(
  menuItem: string | undefined,
  locale: AppLocale = 'en',
): string {
  if (!menuItem) return menuItem ?? '';
  if (locale === 'en') return menuItem;
  return (
    TASKS_MODULE_MENU_DISPLAY_LABEL[menuItem as TasksDataListMenuItemLabel] ?? menuItem
  );
}

export const DEFAULT_TASKS_DATA_LIST_MENU_ITEM: TasksDataListMenuItemLabel = 'Approval';

export function tasksDataListDefaultRowCount(menuItem: string | undefined): number {
  if (menuItem === 'Signing') return DATA_LIST_SIGNING_ROW_COUNT;
  if (menuItem === 'Approval') return DATA_LIST_APPROVAL_ROW_COUNT;
  return DATA_LIST_APPROVAL_ROW_COUNT;
}

export function isTasksDataListMenuItem(label: string): label is TasksDataListMenuItemLabel {
  return (TASKS_MODULE_MENU_ITEMS_WITH_DATA_LIST as readonly string[]).includes(label);
}

/** 模块菜单文案去掉末尾计数角标（如「待签名99+」→「待签名」）。 */
export function normalizeTasksMenuLabel(raw: string): string {
  return raw
    .replace(/(?:\s*\d+\+?\s*)+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 将模块菜单 / ToolBar 展示文案还原为英文菜单 key（如「我发起的」→ Sent Request）。
 * 供 DataList 列配置与 Shell Debug 页键解析共用。
 */
export function resolveTasksDataListMenuItem(
  raw: string | undefined,
  locale: AppLocale = 'en',
): TasksDataListMenuItemLabel | null {
  if (!raw) return null;

  const normalized = normalizeTasksMenuLabel(raw);
  if (!normalized) return null;

  if (isTasksDataListMenuItem(normalized)) {
    return normalized;
  }

  const english = resolveEnglishUiText(locale, normalized);
  if (isTasksDataListMenuItem(english)) {
    return english;
  }

  for (const item of TASKS_MODULE_MENU_ITEMS_WITH_DATA_LIST) {
    const displayKey = resolveTasksModuleMenuDisplayLabel(item, locale);
    const catalogZh = UI_TEXT_ZH_CN[displayKey] ?? UI_TEXT_ZH_CN[item];
    if (typeof catalogZh === 'string' && normalizeTasksMenuLabel(catalogZh) === normalized) {
      return item;
    }

    if (locale === 'zh-TW') {
      const catalogTw = UI_TEXT_ZH_TW[displayKey] ?? UI_TEXT_ZH_TW[item];
      if (typeof catalogTw === 'string' && normalizeTasksMenuLabel(catalogTw) === normalized) {
        return item;
      }
    }

    if (locale === 'en') {
      if (
        normalizeTasksMenuLabel(displayKey) === normalized
        || normalizeTasksMenuLabel(item) === normalized
      ) {
        return item;
      }
      const docEn = I18N_DOC_EN_LABELS[displayKey] ?? I18N_DOC_EN_LABELS[item];
      if (typeof docEn === 'string' && normalizeTasksMenuLabel(docEn) === normalized) {
        return item;
      }
    }
  }

  return null;
}

/** 菜单项是否为「我发起的 / Sent Request」（兼容 ToolBar / 菜单展示文案）。 */
export function isSentRequestDataListMenu(
  menuItem: string | undefined,
  locale: AppLocale = 'en',
): boolean {
  if (!menuItem) return false;
  if (menuItem === 'Sent Request') return true;
  return resolveTasksDataListMenuItem(menuItem, locale) === 'Sent Request';
}

/** 仅 All Records 展示 ToolBar Export。 */
export function tasksDataListShowsExport(menuItem: string | undefined): boolean {
  return menuItem === 'All Records';
}

/** 待办类菜单保留 Action 列；已办 / 记录类不展示。 */
export function tasksDataListShowsActionColumn(menuItem: string | undefined): boolean {
  return menuItem === 'Approval' || menuItem === 'Signing';
}

/** 我发起的 · 待审批行操作列主按钮文案。 */
export const SENT_REQUEST_WITHDRAW_ACTION_LABEL = 'Withdraw Application';

/** 我发起的 · 「待审批」「待签名」行展示撤回申请。 */
export const SENT_REQUEST_WITHDRAWABLE_STATUS_LABELS = new Set([
  'Pending Approval',
  'Waiting for signature',
]);

export function sentRequestRowShowsWithdrawAction(
  rowIndex: number,
  menuItem?: string,
  locale: AppLocale = 'en',
): boolean {
  if (!isSentRequestDataListMenu(menuItem, locale)) {
    return false;
  }
  return SENT_REQUEST_WITHDRAWABLE_STATUS_LABELS.has(
    buildStatusRowValues(rowIndex, menuItem).label,
  );
}

/** 我发起的 Detail 底部是否展示撤回（menu + 列表行 status label / rowIndex）。 */
export function sentRequestDetailShowsWithdrawToolbar(options: {
  menuItem?: string;
  listStatusLabel?: string;
  rowIndex?: number;
  locale?: AppLocale;
}): boolean {
  const locale = options.locale ?? 'en';
  if (!isSentRequestDataListMenu(options.menuItem, locale)) {
    return false;
  }
  if (
    options.listStatusLabel
    && SENT_REQUEST_WITHDRAWABLE_STATUS_LABELS.has(options.listStatusLabel)
  ) {
    return true;
  }
  if (options.rowIndex !== undefined) {
    return sentRequestRowShowsWithdrawAction(
      options.rowIndex,
      options.menuItem,
      locale,
    );
  }
  return false;
}

/** 待办类菜单保留 Batch；已办 / 记录类不展示。 */
export function tasksDataListShowsBatch(menuItem: string | undefined): boolean {
  return menuItem === 'Approval' || menuItem === 'Signing';
}

/** 待签名工具栏「自动化」入口；仅 Signing。 */
export function tasksDataListShowsAutomation(menuItem: string | undefined): boolean {
  return menuItem === 'Signing';
}

/** Sent Request 金额列 min-width。 */
export const SENT_REQUEST_AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH = '200px';

/** Sent Request 申请时间列 min-width（第二列；空间不足时优先隐藏/缩窄）。 */
export const SENT_REQUEST_CREATED_TIME_DATA_LIST_COLUMN_MIN_WIDTH =
  GENERAL_STRUCTURE_DATA_LIST_COLUMN_MIN_WIDTH;

/** @deprecated 别名；Sent Request 业务类型已合并至金额组合列副行。 */
export const SENT_REQUEST_OPERATION_TYPE_DATA_LIST_COLUMN_MIN_WIDTH =
  SENT_REQUEST_CREATED_TIME_DATA_LIST_COLUMN_MIN_WIDTH;

/** @deprecated 别名；Sent Request 操作类型列不再固定 width。 */
export const SENT_REQUEST_CREATED_TIME_DATA_LIST_COLUMN_WIDTH =
  SENT_REQUEST_OPERATION_TYPE_DATA_LIST_COLUMN_MIN_WIDTH;

/** Sent Request 发送方列 min-width。 */
export const SENT_REQUEST_SENDER_DATA_LIST_COLUMN_MIN_WIDTH = SENDER_DATA_LIST_COLUMN_MIN_WIDTH;

/** Sent Request 接收方列 min-width。 */
export const SENT_REQUEST_RECEIVER_DATA_LIST_COLUMN_MIN_WIDTH = RECEIVER_DATA_LIST_COLUMN_MIN_WIDTH;

/** Sent Request 审批进度列 min-width。 */
export const SENT_REQUEST_STATUS_DATA_LIST_COLUMN_MIN_WIDTH = '150px';

/** Sent Request 响应式列优先级（display-order 越大越先隐藏；Action 须最大以钉住尾列）。 */
export const SENT_REQUEST_AMOUNT_DATA_LIST_COLUMN_DISPLAY_ORDER = 1;
export const SENT_REQUEST_CREATED_TIME_DATA_LIST_COLUMN_DISPLAY_ORDER = 2;
export const SENT_REQUEST_RECEIVER_DATA_LIST_COLUMN_DISPLAY_ORDER = 3;
export const SENT_REQUEST_SENDER_DATA_LIST_COLUMN_DISPLAY_ORDER = 4;
export const SENT_REQUEST_STATUS_DATA_LIST_COLUMN_DISPLAY_ORDER = 8;
export const SENT_REQUEST_ACTION_DATA_LIST_COLUMN_DISPLAY_ORDER = 10;

/** @deprecated Sent Request 接收方列已参与 flex 均分，不再固定 width。 */
export const SENT_REQUEST_CURRENCY_DATA_LIST_COLUMN_WIDTH = '240px';

/** @deprecated Sent Request 发送方列已参与 flex 均分，不再固定 width。 */
export const SENT_REQUEST_BUSINESS_TYPE_DATA_LIST_COLUMN_WIDTH = '260px';

/** Sent Request 不展示第一列（Initiator | Operation Type 组合）。 */
export function tasksDataListShowsGeneralStructureColumn(menuItem: string | undefined): boolean {
  return !isSentRequestDataListMenu(menuItem);
}

/** Sent Request 接收方列不设固定 width，与金额 / 业务类型 / 发送方均分剩余空间。 */
export function tasksDataListReceiverColumnWidth(menuItem: string | undefined): string | undefined {
  return undefined;
}

/** @deprecated 币种列已移除；保留别名供旧引用迁移。 */
export function tasksDataListCurrencyColumnWidth(menuItem: string | undefined): string | undefined {
  return tasksDataListReceiverColumnWidth(menuItem);
}

/** Sent Request 发送方列不设固定 width，与 1、2 列均分剩余空间。 */
export function tasksDataListBusinessTypeColumnWidth(
  _menuItem: string | undefined,
): string | undefined {
  return undefined;
}

/** Sent Request 操作类型列 min-width（list-field-general-structure · operationTypeOnly）。 */
export function tasksDataListBusinessTypeColumnMinWidth(
  menuItem: string | undefined,
  fallbackMinWidth: string,
): string {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_SENDER_DATA_LIST_COLUMN_MIN_WIDTH;
  return fallbackMinWidth;
}

export function tasksDataListReceiverColumnMinWidth(
  menuItem: string | undefined,
  fallbackMinWidth: string,
): string {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_RECEIVER_DATA_LIST_COLUMN_MIN_WIDTH;
  return fallbackMinWidth;
}

export function tasksDataListCreatedTimeColumnMinWidth(
  menuItem: string | undefined,
): string | undefined {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_CREATED_TIME_DATA_LIST_COLUMN_MIN_WIDTH;
  return undefined;
}

/** @deprecated 使用 tasksDataListCreatedTimeColumnMinWidth */
export function tasksDataListCreatedTimeColumnWidth(
  menuItem: string | undefined,
): string | undefined {
  return tasksDataListCreatedTimeColumnMinWidth(menuItem);
}

export function tasksDataListStatusColumnMinWidth(menuItem: string | undefined): string {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_STATUS_DATA_LIST_COLUMN_MIN_WIDTH;
  return STATUS_DATA_LIST_COLUMN_MIN_WIDTH;
}

/** Sent Request 审批进度列钉在 min-width（不参与 flex 均分）。 */
export function tasksDataListStatusColumnWidth(menuItem: string | undefined): string | undefined {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_STATUS_DATA_LIST_COLUMN_MIN_WIDTH;
  return undefined;
}

export function tasksDataListStatusColumnDisplayOrder(menuItem: string | undefined): number {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_STATUS_DATA_LIST_COLUMN_DISPLAY_ORDER;
  return STATUS_DATA_LIST_COLUMN_DISPLAY_ORDER;
}

export function tasksDataListCreatedTimeColumnDisplayOrder(
  menuItem: string | undefined,
): number | undefined {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_CREATED_TIME_DATA_LIST_COLUMN_DISPLAY_ORDER;
  return undefined;
}

export function tasksDataListBusinessTypeColumnDisplayOrder(
  menuItem: string | undefined,
  showStatusColumn: boolean,
): number {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_SENDER_DATA_LIST_COLUMN_DISPLAY_ORDER;
  return showStatusColumn ? BUSINESS_TYPE_DATA_LIST_COLUMN_DISPLAY_ORDER : 4;
}

export function tasksDataListReceiverColumnDisplayOrder(
  menuItem: string | undefined,
): number | undefined {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_RECEIVER_DATA_LIST_COLUMN_DISPLAY_ORDER;
  return 3;
}

export function tasksDataListAmountColumnDisplayOrder(
  menuItem: string | undefined,
): number | undefined {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_AMOUNT_DATA_LIST_COLUMN_DISPLAY_ORDER;
  return undefined;
}

export function tasksDataListActionColumnDisplayOrder(
  menuItem: string | undefined,
): number | undefined {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_ACTION_DATA_LIST_COLUMN_DISPLAY_ORDER;
  return undefined;
}

/** Sent Request 第二列：申请时间（独立列；业务类型在金额组合列副行）。 */
export function tasksDataListShowsCreatedTimeColumn(menuItem: string | undefined): boolean {
  return isSentRequestDataListMenu(menuItem);
}

/** @deprecated Sent Request 申请时间已独立为第二列；发送方列不再使用组合表头。 */
export function tasksDataListBusinessTypeColumnShowsComboHeader(
  _menuItem: string | undefined,
): boolean {
  return false;
}

export function tasksDataListBusinessTypeColumnSecondaryLabel(
  _menuItem: string | undefined,
): string {
  return '';
}

export function tasksDataListBusinessTypeColumnSecondarySortable(
  _menuItem: string | undefined,
): boolean {
  return false;
}

/** Sent Request 第 1–4 列（金额｜业务类型 / 申请时间 / 接收方 / 发送方）无固定 width，均分剩余空间。 */
export function tasksDataListAmountColumnFlexGrow(menuItem: string | undefined): boolean {
  return isSentRequestDataListMenu(menuItem);
}

/** 已办 / 记录类菜单展示 Status 列（位于 Amount 前）。 */
export function tasksDataListShowsStatusColumn(menuItem: string | undefined): boolean {
  return (
    menuItem === 'Approved' ||
    menuItem === 'Signed' ||
    menuItem === 'All Records' ||
    isSentRequestDataListMenu(menuItem)
  );
}

/** 已办 / 记录类菜单 Amount 列左对齐；批处理 selectMode 与常态一致。 */
export function tasksDataListAmountColumnAlign(
  _menuItem: string | undefined,
): DataListColumnAlign {
  return 'left';
}

/** Status 列表头：Approved → Approval Results；All Records / Sent Request → Approval Progress；Signed → Signing Results。 */
export function tasksDataListStatusColumnLabel(menuItem: string | undefined): string {
  if (menuItem === 'Signed') return 'Signing Results';
  if (menuItem === 'All Records' || isSentRequestDataListMenu(menuItem)) return 'Approval Progress';
  return 'Approval Results';
}

/** 记录类模块第二列 min-width（Initiator | Created Time）。 */
export function tasksDataListGeneralStructureColumnMinWidth(menuItem: string | undefined): string {
  if (tasksDataListShowsStatusColumn(menuItem)) {
    return RECORDS_GENERAL_STRUCTURE_DATA_LIST_COLUMN_MIN_WIDTH;
  }
  return GENERAL_STRUCTURE_DATA_LIST_COLUMN_MIN_WIDTH;
}

/** 记录类模块金额列 min-width。 */
export function tasksDataListAmountColumnMinWidth(menuItem: string | undefined): string {
  if (isSentRequestDataListMenu(menuItem)) return SENT_REQUEST_AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH;
  if (tasksDataListShowsStatusColumn(menuItem)) {
    return RECORDS_AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH;
  }
  return AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH;
}

/** Action 列主按钮文案：待审批 / 待签名统一为「处理」。 */
export function tasksDataListPrimaryActionLabel(_menuItem: string | undefined): string {
  return DATA_LIST_PRIMARY_ACTION_LABEL;
}

function defaultDataListColumnLabelForSource(dataSource: DataListColumnDataSource): string {
  switch (dataSource) {
    case 'general-structure':
      return DATA_LIST_FIGMA_COLUMNS.sortable.label;
    case 'amount':
      return DATA_LIST_FIGMA_COLUMNS.amount.label;
    case 'receiver':
      return 'Receiver';
    case 'currency':
      return DATA_LIST_FIGMA_COLUMNS.combo.label;
    case 'business-type':
      return 'Sender';
    case 'action':
      return DATA_LIST_FIGMA_COLUMNS.actions.label;
    default:
      return 'Header';
  }
}

function defaultDataListColumnSecondaryLabelForSource(
  dataSource: DataListColumnDataSource,
): string | undefined {
  switch (dataSource) {
    case 'general-structure':
      return DATA_LIST_FIGMA_COLUMNS.sortable.secondaryLabel;
    case 'amount':
      return DATA_LIST_FIGMA_COLUMNS.amount.secondaryLabel;
    case 'currency':
      return DATA_LIST_FIGMA_COLUMNS.combo.secondaryLabel;
    default:
      return undefined;
  }
}

function defaultDataListColumnAlign(index: number): DataListColumnAlign {
  if (index >= DATA_LIST_PREVIEW_COLUMN_COUNT) return 'right';
  return 'left';
}

function defaultDataListColumnLabel(index: number): string {
  return defaultDataListColumnLabelForSource(defaultDataListColumnDataSource(index));
}

function defaultDataListColumnDataSource(index: number): DataListColumnDataSource {
  if (index === 1) return 'general-structure';
  if (index === 2) return 'amount';
  if (index === 3) return 'receiver';
  if (index === 4) return 'business-type';
  if (index === 5) return 'action';
  return 'placeholder';
}

function defaultDataListColumnMinWidthForSource(
  dataSource: DataListColumnDataSource,
): string {
  if (dataSource === 'currency') return CURRENCY_DATA_LIST_COLUMN_MIN_WIDTH;
  if (dataSource === 'receiver') return CURRENCY_DATA_LIST_COLUMN_MIN_WIDTH;
  if (dataSource === 'general-structure') {
    return GENERAL_STRUCTURE_DATA_LIST_COLUMN_MIN_WIDTH;
  }
  if (dataSource === 'business-type') {
    return BUSINESS_TYPE_DATA_LIST_COLUMN_MIN_WIDTH;
  }
  if (dataSource === 'amount') return AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH;
  if (dataSource === 'action') return ACTION_DATA_LIST_COLUMN_MIN_WIDTH;
  return SENDER_DATA_LIST_COLUMN_MIN_WIDTH;
}

export function resolveDataListColumnMinWidthFromDataSource(
  dataSource: DataListColumnDataSource,
  _columnIndex?: number,
): string {
  return defaultDataListColumnMinWidthForSource(dataSource);
}

/** 按模块菜单解析 preview 列 min-width，与 EgDataListColumn 绑定值一致。 */
export function resolveTasksDataListPreviewColumnMinWidth(
  dataSource: DataListColumnDataSource,
  menuItem: string | undefined,
  storedMinWidth = '',
): string {
  const fallback = storedMinWidth.trim() || defaultDataListColumnMinWidthForSource(dataSource);

  if (dataSource === 'general-structure') {
    return tasksDataListGeneralStructureColumnMinWidth(menuItem);
  }
  if (dataSource === 'amount') {
    return tasksDataListAmountColumnMinWidth(menuItem);
  }
  if (dataSource === 'receiver') {
    return tasksDataListReceiverColumnMinWidth(menuItem, fallback);
  }
  if (dataSource === 'business-type') {
    return tasksDataListBusinessTypeColumnMinWidth(menuItem, fallback);
  }
  if (dataSource === 'status') {
    return tasksDataListStatusColumnMinWidth(menuItem);
  }
  if (dataSource === 'operation-type') {
    return tasksDataListCreatedTimeColumnMinWidth(menuItem) ?? fallback;
  }
  if (dataSource === 'action') {
    return ACTION_DATA_LIST_COLUMN_MIN_WIDTH;
  }

  return fallback;
}

/** 切换模块时同步 customize.columnMinWidth*，避免 dev 分配参数与 EgDataListColumn 实际 prop 不一致。 */
export function syncTasksDataListColumnMinWidths(
  state: Record<string, unknown>,
  menuItem: string | undefined,
  locale: AppLocale = 'en',
): void {
  if (isSentRequestDataListMenu(menuItem, locale)) {
    syncSentRequestDataListColumnSettings(state);
    return;
  }

  for (let index = 1; index <= DATA_LIST_PREVIEW_COLUMN_COUNT; index += 1) {
    const dataSourceRaw = String(state[`columnDataSource${index}`] ?? defaultDataListColumnDataSource(index));
    const dataSource: DataListColumnDataSource =
      dataSourceRaw === 'currency'
        ? 'currency'
        : dataSourceRaw === 'general-structure'
          ? 'general-structure'
          : dataSourceRaw === 'operation-type'
            ? 'operation-type'
            : dataSourceRaw === 'business-type'
              ? 'business-type'
              : dataSourceRaw === 'status'
                ? 'status'
                : dataSourceRaw === 'amount'
                  ? 'amount'
                  : dataSourceRaw === 'receiver'
                    ? 'receiver'
                    : dataSourceRaw === 'action'
                      ? 'action'
                      : 'placeholder';

    state[`columnMinWidth${index}`] = resolveTasksDataListPreviewColumnMinWidth(
      dataSource,
      menuItem,
      String(state[`columnMinWidth${index}`] ?? ''),
    );
  }
}

function defaultDataListColumnMinWidth(index: number): string {
  return defaultDataListColumnMinWidthForSource(defaultDataListColumnDataSource(index));
}

export function dataListColumnSettingDefaults(): Record<string, string | boolean> {
  const entries: Record<string, string | boolean> = {
    columnSettingIndex: '1',
  };

  for (let index = 1; index <= DATA_LIST_PREVIEW_COLUMN_COUNT; index += 1) {
    const dataSource = defaultDataListColumnDataSource(index);
    entries[`columnMinWidth${index}`] = defaultDataListColumnMinWidthForSource(dataSource);
    entries[`columnAlign${index}`] = defaultDataListColumnAlign(index);
    entries[`columnDataSource${index}`] = dataSource;
    entries[`columnLabel${index}`] = defaultDataListColumnLabelForSource(dataSource);
    const secondaryLabel = defaultDataListColumnSecondaryLabelForSource(dataSource);
    if (secondaryLabel) {
      entries[`columnSecondaryLabel${index}`] = secondaryLabel;
    }
    if (dataSource === 'amount') {
      entries[`columnSecondarySortable${index}`] = true;
    }
    entries[`columnSortable${index}`] = dataSource === 'amount';
  }

  return entries;
}

/**
 * HMR / 旧会话：currency 组合列 → 发起方｜业务类型 + 金额｜申请时间 + 接收方 + 发送方；
 * 或发送方/接收方列序颠倒（col3 发送方、col4 接收方）→ 交换为接收方第三、发送方第四。
 */
function swapDataListColumnSettings(
  state: Record<string, unknown>,
  indexA: number,
  indexB: number,
): void {
  const suffixes = [
    'DataSource',
    'MinWidth',
    'Align',
    'Label',
    'SecondaryLabel',
    'SecondarySortable',
    'Sortable',
  ] as const;

  for (const suffix of suffixes) {
    const keyA = `column${suffix}${indexA}`;
    const keyB = `column${suffix}${indexB}`;
    if (!(keyA in state) && !(keyB in state)) continue;
    const temp = state[keyA];
    state[keyA] = state[keyB];
    state[keyB] = temp;
  }
}

/** 我发起的：强制 preview 列 2–4 为金额 / 接收方 / 发送方（申请时间、审批进度为独立列）。 */
export function syncSentRequestDataListColumnSettings(state: Record<string, unknown>): void {
  for (let index = 2; index <= 4; index += 1) {
    const expectedSource = defaultDataListColumnDataSource(index);
    state[`columnDataSource${index}`] = expectedSource;
    state[`columnLabel${index}`] = defaultDataListColumnLabelForSource(expectedSource);
    state[`columnMinWidth${index}`] = defaultDataListColumnMinWidthForSource(expectedSource);
    state[`columnAlign${index}`] = defaultDataListColumnAlign(index);
  }
}

/** 我发起的：HMR / 旧会话若把 preview 列误设为 status 或 Operation Type 表头，恢复接收方/发送方。 */
export function repairSentRequestPreviewColumnSettings(state: Record<string, unknown>): boolean {
  let repaired = false;

  for (let index = 2; index <= 4; index += 1) {
    const dataSourceRaw = String(state[`columnDataSource${index}`] ?? '');
    const labelRaw = String(state[`columnLabel${index}`] ?? '');
    const corrupted =
      dataSourceRaw === 'status'
      || dataSourceRaw === 'operation-type'
      || labelRaw === 'Operation Type';
    if (!corrupted) continue;

    const expectedSource = defaultDataListColumnDataSource(index);
    state[`columnDataSource${index}`] = expectedSource;
    state[`columnLabel${index}`] = defaultDataListColumnLabelForSource(expectedSource);
    state[`columnMinWidth${index}`] = defaultDataListColumnMinWidthForSource(expectedSource);
    repaired = true;
  }

  return repaired;
}

export function migrateDataListColumnSettings(state: Record<string, unknown>): boolean {
  const firstSource = String(state.columnDataSource1 ?? '');
  const col3Source = String(state.columnDataSource3 ?? '');
  const col4Source = String(state.columnDataSource4 ?? '');

  if (firstSource === 'currency' || col4Source === 'amount') {
    Object.assign(state, dataListColumnSettingDefaults());
    return true;
  }

  if (col3Source === 'business-type' && col4Source === 'receiver') {
    swapDataListColumnSettings(state, 3, 4);
    return true;
  }

  if (repairSentRequestPreviewColumnSettings(state)) {
    return true;
  }

  const secondaryLabel1 = String(state.columnSecondaryLabel1 ?? '');
  const secondaryLabel2 = String(state.columnSecondaryLabel2 ?? '');
  if (secondaryLabel1 === 'Created Time' && secondaryLabel2 === 'Operation Type') {
    state.columnSecondaryLabel1 = 'Operation Type';
    state.columnSecondaryLabel2 = 'Created Time';
    state.columnSecondarySortable1 = false;
    state.columnSecondarySortable2 = true;
    return true;
  }

  if (secondaryLabel1 === 'Created Time' && secondaryLabel2 === 'Type of Business') {
    state.columnSecondaryLabel1 = 'Operation Type';
    state.columnSecondaryLabel2 = 'Created Time';
    state.columnSecondarySortable1 = false;
    state.columnSecondarySortable2 = true;
    return true;
  }

  if (String(state.columnSecondaryLabel1 ?? '') === 'Type of Business') {
    state.columnSecondaryLabel1 = 'Operation Type';
    return true;
  }

  if (
    String(state.columnSecondaryLabel1 ?? '') === 'Operation Type'
    && state.columnSecondarySortable1 !== false
  ) {
    state.columnSecondarySortable1 = false;
    return true;
  }

  let migrated = false;
  for (let index = 1; index <= DATA_LIST_PREVIEW_COLUMN_COUNT; index += 1) {
    const key = `columnDataSource${index}`;
    if (String(state[key] ?? '') !== 'currency') continue;
    state[key] = 'receiver';
    state[`columnMinWidth${index}`] = defaultDataListColumnMinWidthForSource('receiver');
    state[`columnLabel${index}`] = defaultDataListColumnLabelForSource('receiver');
    migrated = true;
  }

  return migrated;
}

export function iconButtonProItemDefaults(
  prefix: string,
  defaults: { label: string; icon: string },
): Record<string, string | boolean> {
  return {
    [`${prefix}Label`]: defaults.label,
    [`${prefix}Icon`]: defaults.icon,
    [`${prefix}ShowBadge`]: false,
    [`${prefix}Badge`]: '0',
    [`${prefix}ShowReddot`]: false,
    [`${prefix}Disabled`]: false,
  };
}

export function paginerPaginationDefaults(): Record<string, string | boolean> {
  const item = (prefix: PaginerPaginationSlotKey, kind: string, label = '1') => ({
    [`${prefix}Kind`]: kind,
    [`${prefix}Tone`]: 'decor',
    [`${prefix}Label`]: label,
    [`${prefix}Disabled`]: false,
  });

  return {
    dataListPaginationKey: 'first',
    ...item('first', 'symbol'),
    ...item('prev', 'symbol'),
    ...item('page', 'number', '1'),
    ...item('next', 'symbol'),
    ...item('last', 'symbol'),
  };
}

export const tasksDataListCustomizeDefaults = {
  columnHeight: '66',
  dataVolume: '68',
  loading: false,
  initing: false,
  empty: false,
  selectMode: false,
  showBatch: true,
  showExport: false,
  showBack: false,
  showStatistics: false,
  statisticsCount: '2',
  statisticsCollapse: false,
  stat1Text: 'Item',
  stat1Number: '0',
  stat2Text: 'Item',
  stat2Number: '0',
  ...iconButtonProItemDefaults('batch', { label: 'Batch Processing', icon: 'eds-batch' }),
  ...iconButtonProItemDefaults('automation', { label: 'Automation', icon: 'eds-automatic' }),
  ...iconButtonProItemDefaults('filter', { label: 'Filter', icon: 'eds-filter' }),
  ...iconButtonProItemDefaults('refresh', { label: 'Refresh', icon: 'eds-arrow-refresh' }),
  ...iconButtonProItemDefaults('export', { label: 'Export', icon: 'eds-arrow-download' }),
  ...paginerPaginationDefaults(),
  ...dataListColumnSettingDefaults(),
};

export type TasksDataListCustomizeState = typeof tasksDataListCustomizeDefaults;

export function readDataListColumnSettings(
  state: Record<string, unknown>,
  menuItem?: string,
): DataListPreviewColumnSetting[] {
  return Array.from({ length: DATA_LIST_PREVIEW_COLUMN_COUNT }, (_, offset) => {
    const index = offset + 1;
    const dataSourceRaw = String(state[`columnDataSource${index}`] ?? defaultDataListColumnDataSource(index));
    const dataSource: DataListColumnDataSource =
      dataSourceRaw === 'currency'
        ? 'currency'
        : dataSourceRaw === 'general-structure'
          ? 'general-structure'
          : dataSourceRaw === 'operation-type'
            ? 'operation-type'
            : dataSourceRaw === 'business-type'
              ? 'business-type'
              : dataSourceRaw === 'status'
                ? 'status'
                : dataSourceRaw === 'amount'
                  ? 'amount'
                  : dataSourceRaw === 'receiver'
                    ? 'receiver'
                    : dataSourceRaw === 'action'
                      ? 'action'
                      : 'placeholder';
    const minWidthRaw = resolveTasksDataListPreviewColumnMinWidth(
      dataSource,
      menuItem,
      String(state[`columnMinWidth${index}`] ?? defaultDataListColumnMinWidth(index)).trim(),
    ).trim();
    const alignRaw = String(state[`columnAlign${index}`] ?? defaultDataListColumnAlign(index));
    const align: DataListColumnAlign =
      alignRaw === 'left' || alignRaw === 'right' ? alignRaw : 'center';
    const labelRaw = String(
      state[`columnLabel${index}`] ?? defaultDataListColumnLabelForSource(dataSource),
    ).trim();
    const secondaryLabelDefault = defaultDataListColumnSecondaryLabelForSource(dataSource);
    const secondaryLabelRaw =
      state[`columnSecondaryLabel${index}`] != null
        ? String(state[`columnSecondaryLabel${index}`]).trim()
        : undefined;

    return {
      minWidth: minWidthRaw || defaultDataListColumnMinWidthForSource(dataSource),
      align,
      sortable:
        dataSource === 'amount'
          ? String(state[`columnSortable${index}`] ?? 'true') !== 'false'
          : Boolean(state[`columnSortable${index}`]),
      dataSource,
      label: labelRaw || defaultDataListColumnLabelForSource(dataSource),
      secondaryLabel: secondaryLabelRaw || secondaryLabelDefault,
      secondarySortable:
        dataSource === 'amount'
          ? Boolean(state[`columnSecondarySortable${index}`] ?? true)
          : dataSource === 'general-structure'
            ? Boolean(state[`columnSecondarySortable${index}`])
            : Boolean(state[`columnSecondarySortable${index}`]),
    };
  });
}

export function readIconButtonProItem(
  state: Record<string, unknown>,
  prefix: string,
): IconButtonProItemState {
  const label = state[`${prefix}Label`];
  const icon = state[`${prefix}Icon`];

  return {
    label: label != null && String(label).trim() ? String(label).trim() : 'Label',
    icon: icon != null && String(icon).trim() ? String(icon).trim() : 'eds-add',
    showBadge: Boolean(state[`${prefix}ShowBadge`]),
    badge: String(state[`${prefix}Badge`] ?? '0'),
    showReddot: Boolean(state[`${prefix}ShowReddot`]),
    disabled: Boolean(state[`${prefix}Disabled`]),
  };
}

export function readPaginerPaginationItem(
  state: Record<string, unknown>,
  prefix: PaginerPaginationSlotKey,
): PaginerPaginationItemState {
  const kind = String(state[`${prefix}Kind`] ?? 'symbol');
  const tone = String(state[`${prefix}Tone`] ?? 'decor');

  return {
    kind: kind === 'number' || kind === 'button' || kind === 'symbol' ? kind : 'symbol',
    tone: tone === 'brand' || tone === 'decor' ? tone : 'decor',
    label: String(state[`${prefix}Label`] ?? '1'),
    disabled: Boolean(state[`${prefix}Disabled`]),
  };
}

export function buildFigmaDataListRows(
  empty: boolean,
  rowCount: number = DATA_LIST_FIGMA_ROW_COUNT,
): Record<string, unknown>[] {
  if (empty) return [];
  return Array.from({ length: Math.max(0, rowCount) }, (_, index) => ({ id: index }));
}

export function parseDataListColumnHeight(state: Record<string, unknown>): 66 | 48 {
  return String(state.columnHeight) === '48' ? 48 : 66;
}

export function parseDataListRowCount(state: Record<string, unknown>): number {
  const parsed = Number.parseInt(String(state.dataVolume ?? DATA_LIST_FIGMA_ROW_COUNT), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DATA_LIST_FIGMA_ROW_COUNT;
  return parsed;
}

function parseDataListStatisticsCount(state: Record<string, unknown>): number {
  const count = Number.parseInt(String(state.statisticsCount ?? '2'), 10);
  return Number.isFinite(count) ? Math.min(5, Math.max(1, count)) : 2;
}

export function buildDataListStatisticsItems(
  state: Record<string, unknown>,
): { text: string; number: string }[] {
  const count = parseDataListStatisticsCount(state);
  return Array.from({ length: count }, (_, index) => {
    const itemIndex = index + 1;
    return {
      text: String(state[`stat${itemIndex}Text`] ?? 'Item'),
      number: String(state[`stat${itemIndex}Number`] ?? '0'),
    };
  });
}
