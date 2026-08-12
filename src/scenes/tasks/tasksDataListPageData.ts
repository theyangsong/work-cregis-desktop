/** Tasks Data List 页面数据 — 对齐 eds-desktop Showcase DataListPagePreview。 */

/** 首列 min-width（含 cell 左右 padding）；EgCryptoCombo min-width 与之同步。 */
export const CURRENCY_DATA_LIST_COLUMN_MIN_WIDTH = '210px';

/** 第二列 Submitter：较高 min-width，在 DataList 均分 extra 时占据更多列宽。 */
export const GENERAL_STRUCTURE_DATA_LIST_COLUMN_MIN_WIDTH = '190px';

/** 第三列 Payout Wallets min-width（含 cell 左右 padding）。 */
export const BUSINESS_TYPE_DATA_LIST_COLUMN_MIN_WIDTH = '160px';

/** Status 列 min-width（含 cell padding；EgTag lg + truncate 展示 Approved 长文案）。 */
export const STATUS_DATA_LIST_COLUMN_MIN_WIDTH = '120px';

/** Status 列 display-order：高于 Payout Wallets，避免响应式缩列时被隐藏。 */
export const STATUS_DATA_LIST_COLUMN_DISPLAY_ORDER = 2;

/** Payout Wallets 列 display-order：Status 展示时降低优先级。 */
export const BUSINESS_TYPE_DATA_LIST_COLUMN_DISPLAY_ORDER = 5;

/** 第四列金额列 min-width（含 cell 左右 padding）。 */
export const AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH = '160px';

/** 记录类模块（含 Status 列）第二列 min-width：原 190px − 20。 */
export const RECORDS_GENERAL_STRUCTURE_DATA_LIST_COLUMN_MIN_WIDTH = '170px';

/** 记录类模块（含 Status 列）金额列 min-width：原 160px + 20。 */
export const RECORDS_AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH = '180px';

/** 尾列操作列 min-width（含 cell 左右 padding）。 */
export const ACTION_DATA_LIST_COLUMN_MIN_WIDTH = '120px';

/** ListFieldAction 主按钮 i18n key（英文展示 Approval；侧栏菜单项 Approval 仍为待审批）。 */
export const DATA_LIST_PRIMARY_ACTION_LABEL = 'Approval action';
export const DATA_LIST_PRIMARY_ACTION_LABEL_EN = 'Approval';

export const DATA_LIST_APPROVAL_ROW_COUNT = 68;
export const DATA_LIST_SIGNING_ROW_COUNT = 128;

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
  dataVolumeResults: 'Results',
  showStatistics: false,
  statisticsCount: 2,
  statText: 'Item',
  statNumber: '0',
} as const;

export const DATA_LIST_FIGMA_COLUMNS = {
  combo: {
    label: 'Token',
    secondaryLabel: 'To Address',
    minWidth: '168px',
  },
  sortable: {
    label: 'Initiating party',
    secondaryLabel: 'Application Time',
    minWidth: '190px',
    align: 'left' as const,
  },
  businessType: {
    label: 'Outbound Wallet',
    minWidth: '160px',
    align: 'left' as const,
  },
  amount: {
    label: 'Amount',
    secondaryLabel: 'Type of Business',
    minWidth: '160px',
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
  | 'business-type'
  | 'status'
  | 'amount'
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

export const DEFAULT_TASKS_DATA_LIST_MENU_ITEM: TasksDataListMenuItemLabel = 'Approval';

export function tasksDataListDefaultRowCount(menuItem: string | undefined): number {
  if (menuItem === 'Signing') return DATA_LIST_SIGNING_ROW_COUNT;
  if (menuItem === 'Approval') return DATA_LIST_APPROVAL_ROW_COUNT;
  return DATA_LIST_APPROVAL_ROW_COUNT;
}

export function isTasksDataListMenuItem(label: string): label is TasksDataListMenuItemLabel {
  return (TASKS_MODULE_MENU_ITEMS_WITH_DATA_LIST as readonly string[]).includes(label);
}

/** 仅 All Records 展示 ToolBar Export。 */
export function tasksDataListShowsExport(menuItem: string | undefined): boolean {
  return menuItem === 'All Records';
}

/** 待办类菜单保留 Action 列；已办 / 记录类不展示。 */
export function tasksDataListShowsActionColumn(menuItem: string | undefined): boolean {
  return menuItem === 'Approval' || menuItem === 'Signing';
}

/** 待办类菜单保留 Batch；已办 / 记录类不展示。 */
export function tasksDataListShowsBatch(menuItem: string | undefined): boolean {
  return menuItem === 'Approval' || menuItem === 'Signing';
}

/** Sent Request 隐藏 Initiator 列后，首列额外分配 30px（210 → 240）。 */
export const SENT_REQUEST_CURRENCY_DATA_LIST_COLUMN_WIDTH = '240px';

/** Sent Request 第二列额外分配 100px（160 → 260；原 60 + 40）。 */
export const SENT_REQUEST_BUSINESS_TYPE_DATA_LIST_COLUMN_WIDTH = '260px';

/** Sent Request 不展示第二列（Initiator | Created Time）。 */
export function tasksDataListShowsGeneralStructureColumn(menuItem: string | undefined): boolean {
  return menuItem !== 'Sent Request';
}

/** Sent Request 首列固定 240px（min 210 + 分配 30），不参与 flex 均分。 */
export function tasksDataListCurrencyColumnWidth(menuItem: string | undefined): string | undefined {
  if (menuItem === 'Sent Request') return SENT_REQUEST_CURRENCY_DATA_LIST_COLUMN_WIDTH;
  return undefined;
}

/** Sent Request 第二列固定 260px（min 160 + 分配 100），不参与 flex 均分。 */
export function tasksDataListBusinessTypeColumnWidth(
  menuItem: string | undefined,
): string | undefined {
  if (menuItem === 'Sent Request') return SENT_REQUEST_BUSINESS_TYPE_DATA_LIST_COLUMN_WIDTH;
  return undefined;
}

/** Sent Request 第二列表头：Payout Wallets | Created Time combo。 */
export function tasksDataListBusinessTypeColumnShowsComboHeader(
  menuItem: string | undefined,
): boolean {
  return menuItem === 'Sent Request';
}

/** Sent Request 第二列副表头文案（Created Time）。 */
export function tasksDataListBusinessTypeColumnSecondaryLabel(
  menuItem: string | undefined,
): string {
  if (menuItem === 'Sent Request') return DATA_LIST_FIGMA_COLUMNS.sortable.secondaryLabel;
  return '';
}

/** Sent Request 第二列副表头 Created Time 可排序。 */
export function tasksDataListBusinessTypeColumnSecondarySortable(
  menuItem: string | undefined,
): boolean {
  return menuItem === 'Sent Request';
}

/** Sent Request 尾列 Amount 参与 flex 均分（与 Status 列共享多余空间）。 */
export function tasksDataListAmountColumnFlexGrow(menuItem: string | undefined): boolean {
  return menuItem === 'Sent Request';
}

/** 已办 / 记录类菜单展示 Status 列（位于 Amount 前）。 */
export function tasksDataListShowsStatusColumn(menuItem: string | undefined): boolean {
  return (
    menuItem === 'Approved' ||
    menuItem === 'Signed' ||
    menuItem === 'All Records' ||
    menuItem === 'Sent Request'
  );
}

/** 已办 / 记录类菜单 Amount 列右对齐；待办类左对齐。 */
export function tasksDataListAmountColumnAlign(
  menuItem: string | undefined,
): DataListColumnAlign {
  return tasksDataListShowsStatusColumn(menuItem) ? 'right' : 'left';
}

/** Status 列表头：Approved → Approval Results；All Records / Sent Request → Approval Progress；Signed → Signing Results。 */
export function tasksDataListStatusColumnLabel(menuItem: string | undefined): string {
  if (menuItem === 'Signed') return 'Signing Results';
  if (menuItem === 'All Records' || menuItem === 'Sent Request') return 'Approval Progress';
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
  if (tasksDataListShowsStatusColumn(menuItem)) {
    return RECORDS_AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH;
  }
  return AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH;
}

/** Action 列主按钮文案：随 Tasks 侧栏菜单项切换。 */
export function tasksDataListPrimaryActionLabel(menuItem: string | undefined): string {
  if (menuItem === 'Signing') return 'Sign';
  return DATA_LIST_PRIMARY_ACTION_LABEL;
}

function defaultDataListColumnAlign(index: number): DataListColumnAlign {
  if (index >= DATA_LIST_PREVIEW_COLUMN_COUNT) return 'right';
  return 'left';
}

function defaultDataListColumnLabel(index: number): string {
  const labels = [
    DATA_LIST_FIGMA_COLUMNS.combo.label,
    DATA_LIST_FIGMA_COLUMNS.sortable.label,
    DATA_LIST_FIGMA_COLUMNS.businessType.label,
    DATA_LIST_FIGMA_COLUMNS.amount.label,
    DATA_LIST_FIGMA_COLUMNS.actions.label,
  ];
  return labels[index - 1] ?? 'Header';
}

function defaultDataListColumnMinWidthForSource(
  dataSource: DataListColumnDataSource,
  index: number,
): string {
  if (dataSource === 'currency' && index === 1) return CURRENCY_DATA_LIST_COLUMN_MIN_WIDTH;
  if (dataSource === 'general-structure' && index === 2) {
    return GENERAL_STRUCTURE_DATA_LIST_COLUMN_MIN_WIDTH;
  }
  if (dataSource === 'business-type' && index === 3) {
    return BUSINESS_TYPE_DATA_LIST_COLUMN_MIN_WIDTH;
  }
  if (dataSource === 'amount' && index === 4) return AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH;
  if (dataSource === 'action' && index === 5) return ACTION_DATA_LIST_COLUMN_MIN_WIDTH;
  return defaultDataListColumnMinWidth(index);
}

export function resolveDataListColumnMinWidthFromDataSource(
  dataSource: DataListColumnDataSource,
  columnIndex: number,
): string {
  return defaultDataListColumnMinWidthForSource(dataSource, columnIndex);
}

function defaultDataListColumnMinWidth(index: number): string {
  const widths = [
    DATA_LIST_FIGMA_COLUMNS.combo.minWidth,
    DATA_LIST_FIGMA_COLUMNS.sortable.minWidth,
    DATA_LIST_FIGMA_COLUMNS.businessType.minWidth,
    AMOUNT_DATA_LIST_COLUMN_MIN_WIDTH,
    DATA_LIST_FIGMA_COLUMNS.actions.minWidth,
  ];
  return widths[index - 1] ?? '160px';
}

export function dataListColumnSettingDefaults(): Record<string, string | boolean> {
  const entries: Record<string, string | boolean> = {
    columnSettingIndex: '1',
  };

  for (let index = 1; index <= DATA_LIST_PREVIEW_COLUMN_COUNT; index += 1) {
    const dataSource: DataListColumnDataSource =
      index === 1
        ? 'currency'
        : index === 2
          ? 'general-structure'
          : index === 3
            ? 'business-type'
            : index === 4
              ? 'amount'
              : 'action';
    entries[`columnMinWidth${index}`] = defaultDataListColumnMinWidthForSource(dataSource, index);
    entries[`columnAlign${index}`] = defaultDataListColumnAlign(index);
    entries[`columnDataSource${index}`] = dataSource;
    entries[`columnLabel${index}`] = defaultDataListColumnLabel(index);
    if (index === 1) {
      entries.columnSecondaryLabel1 = DATA_LIST_FIGMA_COLUMNS.combo.secondaryLabel;
      entries.columnSecondarySortable1 = false;
    }
    if (index === 2) {
      entries.columnSecondaryLabel2 = DATA_LIST_FIGMA_COLUMNS.sortable.secondaryLabel;
      entries.columnSecondarySortable2 = true;
    }
    if (index === 4) {
      entries.columnSecondaryLabel4 = DATA_LIST_FIGMA_COLUMNS.amount.secondaryLabel;
      entries.columnSecondarySortable4 = false;
    }
    entries[`columnSortable${index}`] = index === 4;
  }

  return entries;
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
  ...iconButtonProItemDefaults('batch', { label: 'Batch', icon: 'eds-batch' }),
  ...iconButtonProItemDefaults('filter', { label: 'Filter', icon: 'eds-filter' }),
  ...iconButtonProItemDefaults('refresh', { label: 'Refresh', icon: 'eds-arrow-refresh' }),
  ...iconButtonProItemDefaults('export', { label: 'Export', icon: 'eds-arrow-download' }),
  ...paginerPaginationDefaults(),
  ...dataListColumnSettingDefaults(),
};

export type TasksDataListCustomizeState = typeof tasksDataListCustomizeDefaults;

export function readDataListColumnSettings(
  state: Record<string, unknown>,
): DataListPreviewColumnSetting[] {
  return Array.from({ length: DATA_LIST_PREVIEW_COLUMN_COUNT }, (_, offset) => {
    const index = offset + 1;
    const minWidthRaw = String(state[`columnMinWidth${index}`] ?? defaultDataListColumnMinWidth(index)).trim();
    const alignRaw = String(state[`columnAlign${index}`] ?? defaultDataListColumnAlign(index));
    const align: DataListColumnAlign =
      alignRaw === 'left' || alignRaw === 'right' ? alignRaw : 'center';
    const dataSourceRaw = String(state[`columnDataSource${index}`] ?? 'placeholder');
    const dataSource: DataListColumnDataSource =
      dataSourceRaw === 'currency'
        ? 'currency'
        : dataSourceRaw === 'general-structure'
          ? 'general-structure'
          : dataSourceRaw === 'business-type'
            ? 'business-type'
            : dataSourceRaw === 'amount'
              ? 'amount'
              : dataSourceRaw === 'action'
                ? 'action'
                : 'placeholder';
    const labelRaw = String(state[`columnLabel${index}`] ?? defaultDataListColumnLabel(index)).trim();
    const secondaryLabelRaw =
      index === 1
        ? String(
            state.columnSecondaryLabel1 ?? DATA_LIST_FIGMA_COLUMNS.combo.secondaryLabel,
          ).trim()
        : index === 2
          ? String(
              state.columnSecondaryLabel2 ?? DATA_LIST_FIGMA_COLUMNS.sortable.secondaryLabel,
            ).trim()
          : index === 4
            ? String(
                state.columnSecondaryLabel4 ?? DATA_LIST_FIGMA_COLUMNS.amount.secondaryLabel,
              ).trim()
            : undefined;

    return {
      minWidth: minWidthRaw || defaultDataListColumnMinWidthForSource(dataSource, index),
      align,
      sortable:
        index === 4
          ? String(state[`columnSortable${index}`] ?? 'true') !== 'false'
          : Boolean(state[`columnSortable${index}`]),
      dataSource,
      label: labelRaw || defaultDataListColumnLabel(index),
      secondaryLabel:
        index === 1
          ? secondaryLabelRaw || DATA_LIST_FIGMA_COLUMNS.combo.secondaryLabel
          : index === 2
            ? secondaryLabelRaw || DATA_LIST_FIGMA_COLUMNS.sortable.secondaryLabel
            : index === 4
              ? secondaryLabelRaw || DATA_LIST_FIGMA_COLUMNS.amount.secondaryLabel
              : undefined,
      secondarySortable:
        index === 1
          ? Boolean(state.columnSecondarySortable1)
          : index === 2
            ? Boolean(state.columnSecondarySortable2)
            : index === 4
              ? Boolean(state.columnSecondarySortable4)
              : undefined,
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
