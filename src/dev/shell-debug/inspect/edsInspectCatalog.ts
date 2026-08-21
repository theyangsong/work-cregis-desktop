import {
  deriveIconName,
  deriveIconBorderToken,
  deriveIconColorToken,
} from './buildIconInspect';
import {
  deriveCryptoDisplayName,
  deriveCryptoType,
} from './buildCryptoInspect';
import { deriveAvatarName, deriveAvatarSize } from './buildAvatarInspect';
import {
  deriveDividerDirection,
  deriveDividerType,
} from './buildDividerInspect';
import { resolveInspectPropLabel } from './inspectPropLabels';

export type EdsPropSpec = {
  key: string;
  label: string;
  /** Figma / DS API 字段说明 */
  figmaLabel?: string;
  defaultValue?: unknown;
  when?: (props: Record<string, unknown>) => boolean;
  format?: (value: unknown, props: Record<string, unknown>) => string;
  derive?: (ctx: EdsPropExtractContext) => unknown;
};

export type EdsPropExtractContext = {
  props: Record<string, unknown>;
  element: Element;
  rootElement: Element | null;
};

export type EdsInspectCatalogEntry = {
  displayName: string;
  priority: number;
  /** Vue `type.name` / `__name` */
  vueNames: string[];
  /** eds-* root class on rendered DOM */
  domClass?: string;
  /**
   * 同一 DS 组件承担多个 Figma 角色时按 props 派生名字（如 Tooltip 的 `panelKind`）。
   * 返回 null 用 `displayName`。**【禁止】** 在 resolver 里写逐组件 `if` 代替本 hook。
   */
  resolveDisplayName?: (props: Record<string, unknown>) => string | null;
  props: EdsPropSpec[];
};

/**
 * Tooltip 的 `panelKind` 决定它在 Figma 里的角色 —— EgPopup / 预览壳复用了同一组件，
 * 都叫 Tooltip 会让弹窗壳与内容层重名。
 *
 * 真源：eds-desktop `Tooltip.vue` 的 `EFFECT_PANEL_CLASS`
 * + `packages/tokens/spec/effect/semantic.json` 的 `title`（Popup Box / Container Box）。
 * 仅收录「盒子」角色；flotation / subtle / molde 仍是 Tooltip 本职。
 */
const TOOLTIP_PANEL_ROLE_NAMES: Readonly<Record<string, string>> = {
  popup: 'PopupBox',
  container: 'ContainerBox',
};

function formatBoolean(value: unknown): string {
  return value === true ? '是' : '否';
}

function formatOptionalText(value: unknown): string {
  if (value == null || value === '') return '—';
  return String(value);
}

export function formatIconName(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  return raw.startsWith('eds-') ? raw : `eds-${raw}`;
}

function readRootText(ctx: EdsPropExtractContext): string {
  const root = ctx.rootElement;
  if (!root) return '';
  return root.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function readHasIcon(ctx: EdsPropExtractContext): boolean {
  const root = ctx.rootElement;
  if (!root) return false;
  return Boolean(root.querySelector('.eds-icon'));
}

function normalizeButtonVariant(value: unknown): string {
  switch (value) {
    case 'primary':
      return 'solid';
    case 'secondary':
      return 'outline';
    case 'ghost':
      return 'text';
    default:
      return String(value ?? 'solid');
  }
}

/** DS 组件 inspect 目录 — 对齐 eds-desktop props / Figma 变体命名。 */
export const EDS_INSPECT_CATALOG: EdsInspectCatalogEntry[] = [
  {
    displayName: 'Icon',
    priority: 100,
    vueNames: ['Icon', 'EgIcon'],
    domClass: 'eds-icon',
    props: [
      { key: 'name', label: '名称', derive: deriveIconName, format: formatIconName },
      {
        key: 'border',
        label: '边框',
        derive: deriveIconBorderToken,
        format: (value) => String(value ?? '—'),
      },
      {
        key: 'color',
        label: '颜色',
        derive: deriveIconColorToken,
        format: (value) => String(value ?? 'var(--stroke-base-secondary)'),
      },
    ],
  },
  {
    displayName: 'Crypto',
    priority: 99,
    vueNames: ['Crypto', 'EgCrypto'],
    domClass: 'eds-crypto',
    props: [
      {
        key: 'type',
        label: '类型',
        derive: deriveCryptoType,
        format: (value) => String(value ?? 'Crypto'),
      },
      {
        key: 'name',
        label: '名称',
        derive: deriveCryptoDisplayName,
        format: (value) => String(value ?? '—'),
      },
    ],
  },
  {
    displayName: 'IconButton',
    priority: 90,
    vueNames: ['IconButton', 'EgIconButton'],
    domClass: 'eds-icon-button',
    props: [
      { key: 'shape', label: '形状', defaultValue: 'rectangular' },
      { key: 'size', label: '尺寸', defaultValue: 'lg' },
      { key: 'motion', label: '动效', defaultValue: 'ease' },
      { key: 'label', label: '无障碍标签' },
      { key: 'disabled', label: '禁用', defaultValue: false, format: formatBoolean },
      { key: 'as', label: '元素类型', defaultValue: 'button' },
    ],
  },
  {
    displayName: 'IconButtonPro',
    priority: 85,
    vueNames: ['IconButtonPro', 'EgIconButtonPro'],
    domClass: 'eds-icon-button-pro',
    props: [
      { key: 'label', label: '标签' },
      { key: 'showBadge', label: '显示角标', defaultValue: false, format: formatBoolean },
      { key: 'badge', label: '角标', defaultValue: 0 },
      { key: 'showReddot', label: '显示红点', defaultValue: false, format: formatBoolean },
      { key: 'disabled', label: '禁用', defaultValue: false, format: formatBoolean },
    ],
  },
  {
    displayName: 'Button',
    priority: 80,
    vueNames: ['Button', 'EgButton'],
    domClass: 'eds-button',
    props: [
      {
        key: 'variant',
        label: '样式',
        figmaLabel: 'Style',
        defaultValue: 'solid',
        format: (value) => normalizeButtonVariant(value),
      },
      { key: 'tone', label: '色调', figmaLabel: 'Event', defaultValue: 'brand' },
      { key: 'size', label: '尺寸', defaultValue: 'lg' },
      { key: 'disabled', label: '禁用', defaultValue: false, format: formatBoolean },
      { key: 'loading', label: '加载中', defaultValue: false, format: formatBoolean },
      { key: 'active', label: '选中', defaultValue: false, format: formatBoolean },
      {
        key: 'hasIcon',
        label: '显示图标',
        derive: (ctx) => readHasIcon(ctx),
        format: formatBoolean,
      },
      {
        key: 'text',
        label: '文本',
        derive: (ctx) => readRootText(ctx),
        format: formatOptionalText,
      },
      { key: 'iconPosition', label: '图标位置', defaultValue: 'leading' },
    ],
  },
  {
    displayName: 'Link',
    priority: 70,
    vueNames: ['Link', 'EgLink'],
    domClass: 'eds-link',
    props: [
      { key: 'tone', label: '色调', defaultValue: 'brand' },
      { key: 'size', label: '尺寸', defaultValue: 'lg' },
      { key: 'disabled', label: '禁用', defaultValue: false, format: formatBoolean },
      { key: 'href', label: '链接', format: formatOptionalText },
      {
        key: 'text',
        label: '文本',
        derive: (ctx) => readRootText(ctx),
        format: formatOptionalText,
      },
    ],
  },
  {
    displayName: 'Tag',
    priority: 70,
    vueNames: ['Tag', 'EgTag'],
    domClass: 'eds-tag',
    props: [
      { key: 'size', label: '尺寸', defaultValue: 'md' },
      { key: 'family', label: '系列', defaultValue: 'system' },
      {
        key: 'systemType',
        label: '系统类型',
        defaultValue: 'subtle',
        when: (props) => props.family === 'system' || props.family == null,
      },
      {
        key: 'status',
        label: '状态',
        defaultValue: 'danger',
        when: (props) => props.family === 'status',
      },
      {
        key: 'colorfulStyle',
        label: '彩色样式',
        defaultValue: 'apricot',
        when: (props) => props.family === 'colorful',
      },
      {
        key: 'customStyle',
        label: '自定义样式',
        defaultValue: 'vermilion',
        when: (props) => props.family === 'custom',
      },
      { key: 'truncate', label: '截断', defaultValue: false, format: formatBoolean },
      {
        key: 'text',
        label: '文本',
        derive: (ctx) => readRootText(ctx),
        format: formatOptionalText,
      },
    ],
  },
  {
    displayName: 'Popup',
    priority: 74,
    vueNames: ['Popup', 'EgPopup'],
    domClass: 'eds-popup',
    props: [
      { key: 'uses', label: '用途', defaultValue: 'dialog' },
      { key: 'dialogType', label: 'Dialog 类型', defaultValue: 'symbol' },
      { key: 'verifyType', label: '验证类型', defaultValue: 'single-email' },
      { key: 'microFloat', label: '微浮动', defaultValue: true, format: formatBoolean },
    ],
  },
  {
    displayName: 'Detail',
    priority: 75,
    vueNames: ['Detail', 'EgDetail'],
    domClass: 'eds-detail',
    props: [
      { key: 'headline', label: '标题', format: formatOptionalText },
      { key: 'eyebrow', label: '眉头', format: formatOptionalText },
      { key: 'showToolbar', label: '显示工具栏', defaultValue: true, format: formatBoolean },
      { key: 'showTabs', label: '显示标签', defaultValue: false, format: formatBoolean },
      { key: 'toolbarConfirmLabel', label: '确认按钮', format: formatOptionalText },
      { key: 'toolbarCancelLabel', label: '取消按钮', format: formatOptionalText },
    ],
  },
  {
    displayName: 'Popover',
    priority: 74,
    vueNames: ['Popover', 'EgPopover'],
    domClass: 'eds-popover',
    props: [
      { key: 'placement', label: '位置', defaultValue: 'top' },
      { key: 'align', label: '对齐', defaultValue: 'center' },
      { key: 'widthMode', label: '宽度模式', defaultValue: 'fixed' },
      { key: 'heightMode', label: '高度模式', defaultValue: 'adaptive' },
      { key: 'width', label: '宽度', format: formatOptionalText },
      { key: 'maxHeight', label: '最大高度', format: formatOptionalText },
      { key: 'topTool', label: '顶栏', defaultValue: false, format: formatBoolean },
      { key: 'topToolTitle', label: '顶栏标题', format: formatOptionalText },
      { key: 'topToolClosable', label: '顶栏可关闭', defaultValue: false, format: formatBoolean },
    ],
  },
  {
    displayName: 'RemarkPopoverPanel',
    priority: 73,
    vueNames: ['RemarkPopoverPanel', 'EgRemarkPopoverPanel'],
    props: [
      { key: 'label', label: '标签', format: formatOptionalText },
      { key: 'hideLabel', label: '隐藏标签', defaultValue: true, format: formatBoolean },
      { key: 'maxLength', label: '最大长度' },
      { key: 'hideConfirm', label: '隐藏确认', defaultValue: false, format: formatBoolean },
      { key: 'confirmLabel', label: '确认文案', format: formatOptionalText },
    ],
  },
  {
    displayName: 'RemarkPopover',
    priority: 72,
    vueNames: ['RemarkPopover', 'EgRemarkPopover'],
    props: [],
  },
  {
    displayName: 'AnchoredPopover',
    priority: 71,
    vueNames: ['AnchoredPopover', 'EgAnchoredPopover'],
    props: [
      { key: 'placement', label: '位置', defaultValue: 'top' },
      { key: 'align', label: '对齐', defaultValue: 'center' },
      { key: 'widthMode', label: '宽度模式', defaultValue: 'fixed' },
      { key: 'closeOnScroll', label: '滚动关闭', defaultValue: true, format: formatBoolean },
    ],
  },
  {
    displayName: 'ComboTextareaItem',
    priority: 68,
    vueNames: ['ComboTextareaItem', 'EgComboTextareaItem'],
    props: [
      { key: 'label', label: '标签', format: formatOptionalText },
      { key: 'feedback', label: '反馈区', defaultValue: false, format: formatBoolean },
      { key: 'placeholder', label: '占位符', format: formatOptionalText },
    ],
  },
  {
    displayName: 'Textarea',
    priority: 67,
    vueNames: ['Textarea', 'EgTextarea'],
    domClass: 'eds-textarea-control',
    props: [
      { key: 'placeholder', label: '占位符', format: formatOptionalText },
      { key: 'disabled', label: '禁用', defaultValue: false, format: formatBoolean },
      { key: 'readonly', label: '只读', defaultValue: false, format: formatBoolean },
      { key: 'widthMode', label: '宽度模式', defaultValue: 'fixed' },
      { key: 'pasteLabel', label: '粘贴文案', format: formatOptionalText },
      { key: 'clearLabel', label: '清空文案', format: formatOptionalText },
    ],
  },
  {
    displayName: 'FormSubmission',
    priority: 66,
    vueNames: ['FormSubmission', 'EgFormSubmission'],
    domClass: 'eds-form-submission',
    props: [
      { key: 'type', label: '类型', defaultValue: 'notes' },
      { key: 'text', label: '文本', format: formatOptionalText },
      { key: 'showLink', label: '显示链接', defaultValue: true, format: formatBoolean },
    ],
  },
  {
    displayName: 'Checkbox',
    priority: 65,
    vueNames: ['Checkbox', 'EgCheckbox'],
    domClass: 'eds-checkbox',
    props: [
      { key: 'disabled', label: '禁用', defaultValue: false, format: formatBoolean },
      { key: 'indeterminate', label: '半选', defaultValue: false, format: formatBoolean },
    ],
  },
  {
    displayName: 'Tooltip',
    priority: 60,
    vueNames: ['Tooltip', 'EgTooltip', 'AnchoredTooltip', 'EgAnchoredTooltip'],
    resolveDisplayName: (props) =>
      TOOLTIP_PANEL_ROLE_NAMES[String(props.panelKind ?? '')] ?? null,
    props: [
      { key: 'panelKind', label: '面板类型', defaultValue: 'flotation' },
      { key: 'panelRadius', label: '面板圆角' },
      { key: 'widthMode', label: '宽度模式', defaultValue: 'adaptive' },
      { key: 'width', label: '宽度' },
      { key: 'heightMode', label: '高度模式', defaultValue: 'adaptive' },
      { key: 'scrollable', label: '可滚动', defaultValue: true, format: formatBoolean },
      { key: 'panelMicroFloat', label: '微浮动', defaultValue: false, format: formatBoolean },
    ],
  },
  {
    displayName: 'TextOverflowTooltip',
    priority: 55,
    vueNames: ['TextOverflowTooltip', 'EgTextOverflowTooltip'],
    props: [
      { key: 'content', label: '内容', format: formatOptionalText },
      { key: 'placement', label: '位置' },
    ],
  },
  {
    displayName: 'ListFieldOverflowText',
    priority: 50,
    vueNames: ['ListFieldOverflowText', 'EgListFieldOverflowText'],
    props: [
      { key: 'text', label: '文本', format: formatOptionalText },
      { key: 'displayText', label: '展示文本', format: formatOptionalText },
      { key: 'variant', label: '变体', defaultValue: 'primary' },
      { key: 'size', label: '尺寸', defaultValue: 'medium' },
      { key: 'tabular', label: '等宽数字', defaultValue: false, format: formatBoolean },
    ],
  },
  {
    displayName: 'Avatar',
    priority: 98,
    vueNames: ['Avatar', 'EgAvatar'],
    domClass: 'eds-avatar',
    props: [
      {
        key: 'name',
        label: '名称',
        derive: deriveAvatarName,
        format: (value) => String(value ?? '—'),
      },
      {
        key: 'size',
        label: '尺寸',
        defaultValue: 'lg',
        derive: deriveAvatarSize,
      },
    ],
  },
  {
    displayName: 'Divider',
    priority: 90,
    vueNames: ['Divider', 'EgDivider'],
    domClass: 'eds-divider',
    props: [
      {
        key: 'type',
        label: '类型',
        derive: deriveDividerType,
        format: (value) => String(value ?? 'module'),
      },
      {
        key: 'direction',
        label: '方向',
        derive: deriveDividerDirection,
        format: (value) => String(value ?? 'horizontal'),
      },
    ],
  },
  {
    displayName: 'DataList',
    priority: 82,
    vueNames: ['DataList', 'EgDataList'],
    domClass: 'eds-data-list',
    props: [
      { key: 'loading', label: resolveInspectPropLabel('loading'), defaultValue: false, format: formatBoolean },
      { key: 'initing', label: resolveInspectPropLabel('initing'), defaultValue: false, format: formatBoolean },
      { key: 'selectMode', label: resolveInspectPropLabel('selectMode'), defaultValue: false, format: formatBoolean },
      { key: 'emptyText', label: resolveInspectPropLabel('emptyText'), format: formatOptionalText },
      { key: 'skidOpen', label: resolveInspectPropLabel('skidOpen'), defaultValue: false, format: formatBoolean },
      { key: 'batchCountSuffix', label: resolveInspectPropLabel('batchCountSuffix'), format: formatOptionalText },
      { key: 'batchPopoverWidthMode', label: resolveInspectPropLabel('batchPopoverWidthMode'), format: formatOptionalText },
      { key: 'batchPopoverWidth', label: resolveInspectPropLabel('batchPopoverWidth'), format: formatOptionalText },
      { key: 'batchPopoverTopTool', label: resolveInspectPropLabel('batchPopoverTopTool'), defaultValue: false, format: formatBoolean },
      { key: 'batchPopoverTopToolTitle', label: resolveInspectPropLabel('batchPopoverTopToolTitle'), format: formatOptionalText },
      { key: 'batchPopoverTopToolClosable', label: resolveInspectPropLabel('batchPopoverTopToolClosable'), defaultValue: false, format: formatBoolean },
    ],
  },
  {
    displayName: 'DataListColumn',
    priority: 83,
    vueNames: ['DataListColumn', 'EgDataListColumn'],
    props: [
      { key: 'prop', label: resolveInspectPropLabel('prop'), format: formatOptionalText },
      { key: 'label', label: resolveInspectPropLabel('label'), format: formatOptionalText },
      { key: 'type', label: resolveInspectPropLabel('type'), defaultValue: 'default' },
      { key: 'selected', label: resolveInspectPropLabel('selected'), defaultValue: false, format: formatBoolean },
      { key: 'blank', label: resolveInspectPropLabel('blank'), defaultValue: false, format: formatBoolean },
      { key: 'hidden', label: resolveInspectPropLabel('hidden'), defaultValue: false, format: formatBoolean },
      { key: 'sortable', label: resolveInspectPropLabel('sortable'), defaultValue: false, format: formatBoolean },
      { key: 'displayOrder', label: resolveInspectPropLabel('displayOrder'), format: formatOptionalText },
      { key: 'isAction', label: resolveInspectPropLabel('isAction'), defaultValue: false, format: formatBoolean },
      { key: 'hideActions', label: resolveInspectPropLabel('hideActions'), defaultValue: false, format: formatBoolean },
      { key: 'showOverflowTooltip', label: resolveInspectPropLabel('showOverflowTooltip'), defaultValue: true, format: formatBoolean },
      { key: 'index', label: resolveInspectPropLabel('index'), format: formatOptionalText },
    ],
  },
  {
    displayName: 'Paginer',
    priority: 38,
    vueNames: ['Paginer', 'EgPaginer'],
    domClass: 'eds-paginer',
    props: [
      { key: 'showScrollbar', label: '显示滚动条', defaultValue: false, format: formatBoolean },
      { key: 'showStatistics', label: '显示统计', defaultValue: true, format: formatBoolean },
      { key: 'statisticsCollapse', label: '统计可折叠', defaultValue: false, format: formatBoolean },
      { key: 'scrollbarSize', label: '滚动条尺寸', defaultValue: 'many' },
      { key: 'dataVolumeTotal', label: '数据总量标签', format: formatOptionalText },
      { key: 'dataVolumeCount', label: '数据总量', format: formatOptionalText },
      { key: 'dataVolumeResults', label: '结果标签', format: formatOptionalText },
      { key: 'showDataVolumeDropdown', label: '数据量下拉', defaultValue: true, format: formatBoolean },
    ],
  },
  {
    displayName: 'ToolBar',
    priority: 54,
    vueNames: ['ToolBar', 'EgToolBar'],
    domClass: 'eds-tool-bar',
    props: [
      { key: 'title', label: '标题', format: formatOptionalText },
      { key: 'showBack', label: '显示返回', defaultValue: false, format: formatBoolean },
      { key: 'showOperation', label: '显示操作区', defaultValue: true, format: formatBoolean },
      { key: 'showDivider', label: '显示分隔线', defaultValue: false, format: formatBoolean },
      { key: 'showSection', label: '显示分区', defaultValue: false, format: formatBoolean },
    ],
  },
  {
    displayName: 'PaginationItem',
    priority: 39,
    vueNames: ['PaginationItem', 'EgPaginationItem'],
    domClass: 'eds-pagination-item',
    props: [
      { key: 'kind', label: '类型', defaultValue: 'number' },
      { key: 'tone', label: '色调', defaultValue: 'decor' },
      { key: 'label', label: '标签', format: formatOptionalText },
      { key: 'disabled', label: '禁用', defaultValue: false, format: formatBoolean },
      { key: 'interactive', label: '可交互', defaultValue: true, format: formatBoolean },
      { key: 'visualActive', label: '视觉激活', defaultValue: false, format: formatBoolean },
      { key: 'selected', label: '选中', defaultValue: false, format: formatBoolean },
      { key: 'type', label: '按钮类型', defaultValue: 'button' },
    ],
  },
  {
    displayName: 'Progress',
    priority: 45,
    vueNames: ['Progress', 'EgProgress'],
    domClass: 'eds-progress',
    props: [
      { key: 'value', label: '数值' },
      { key: 'max', label: '最大值', defaultValue: 100 },
    ],
  },
  {
    displayName: 'SegmentedControl',
    priority: 40,
    vueNames: ['SegmentedControl', 'EgSegmentedControl'],
    domClass: 'eds-segmented-control',
    props: [{ key: 'size', label: '尺寸', defaultValue: 'md' }],
  },
  {
    displayName: 'TabItem',
    priority: 40,
    vueNames: ['TabItem', 'EgTabItem'],
    domClass: 'eds-tab',
    props: [
      { key: 'active', label: '选中', defaultValue: false, format: formatBoolean },
      { key: 'disabled', label: '禁用', defaultValue: false, format: formatBoolean },
    ],
  },
  {
    displayName: 'Layout',
    priority: 70,
    vueNames: ['Layout', 'EgLayout'],
    domClass: 'eds-layout',
    props: [],
  },
  {
    displayName: 'Skid',
    priority: 68,
    vueNames: ['Skid', 'EgSkid'],
    domClass: 'eds-skid',
    props: [],
  },
  {
    displayName: 'Container',
    priority: 72,
    vueNames: ['Container', 'EgContainer'],
    domClass: 'eds-container',
    props: [],
  },
  {
    displayName: 'BatchBar',
    priority: 55,
    vueNames: ['BatchBar', 'EgBatchBar'],
    domClass: 'eds-batch-bar',
    props: [],
  },
  {
    displayName: 'ModuleMenu',
    priority: 60,
    vueNames: ['ModuleMenu', 'EgModuleMenu'],
    domClass: 'eds-module-menu',
    props: [],
  },
  {
    displayName: 'NavBar',
    priority: 65,
    vueNames: ['NavBar', 'EgNavBar'],
    domClass: 'eds-nav-bar',
    props: [],
  },
  {
    displayName: 'Flotation',
    priority: 73,
    vueNames: ['Flotation', 'EgFlotation'],
    domClass: 'eds-flotation',
    props: [],
  },
  {
    displayName: 'Dialog',
    priority: 74,
    vueNames: ['Dialog', 'EgDialog'],
    domClass: 'eds-dialog',
    props: [],
  },
  {
    displayName: 'ModuleMenuItem',
    priority: 58,
    vueNames: ['ModuleMenuItem', 'EgModuleMenuItem'],
    domClass: 'eds-module-menu-item',
    props: [],
  },
  {
    displayName: 'ModuleMenuGroup',
    priority: 57,
    vueNames: ['ModuleMenuGroup', 'EgModuleMenuGroup'],
    domClass: 'eds-module-menu-group',
    props: [],
  },
  {
    displayName: 'ModuleMenuSection',
    priority: 57,
    vueNames: ['ModuleMenuSection', 'EgModuleMenuSection'],
    domClass: 'eds-module-menu-section',
    props: [],
  },
  {
    displayName: 'ModuleMenuSectionTitle',
    priority: 56,
    vueNames: ['ModuleMenuSectionTitle', 'EgModuleMenuSectionTitle'],
    domClass: 'eds-module-menu-section-title',
    props: [],
  },
  {
    displayName: 'ToolBarTitle',
    priority: 53,
    vueNames: ['ToolBarTitle', 'EgToolBarTitle'],
    domClass: 'eds-tool-bar-title',
    props: [],
  },
  {
    displayName: 'PaginerSettings',
    priority: 37,
    vueNames: ['PaginerSettings', 'EgPaginerSettings'],
    domClass: 'eds-paginer-settings',
    props: [],
  },
  {
    displayName: 'PaginerStatistics',
    priority: 37,
    vueNames: ['PaginerStatistics', 'EgPaginerStatistics'],
    domClass: 'eds-paginer-statistics',
    props: [],
  },
  {
    displayName: 'PaginerDataVolume',
    priority: 37,
    vueNames: ['PaginerDataVolume', 'EgPaginerDataVolume'],
    domClass: 'eds-paginer-data-volume',
    props: [],
  },
  {
    displayName: 'PaginerSetInput',
    priority: 37,
    vueNames: ['PaginerSetInput', 'EgPaginerSetInput'],
    domClass: 'eds-paginer-set-input',
    props: [],
  },
  {
    displayName: 'NavBarModuleItem',
    priority: 64,
    vueNames: ['NavBarModuleItem', 'EgNavBarModuleItem'],
    domClass: 'eds-nav-bar-module',
    props: [],
  },
  {
    displayName: 'NavBarAvatar',
    priority: 63,
    vueNames: ['NavBarAvatar', 'EgNavBarAvatar'],
    domClass: 'eds-nav-bar-avatar',
    props: [],
  },
  {
    displayName: 'NavBarCorporation',
    priority: 63,
    vueNames: ['NavBarCorporation', 'EgNavBarCorporation'],
    domClass: 'eds-nav-bar-corporation',
    props: [],
  },
  {
    displayName: 'NavBarBottomIcon',
    priority: 62,
    vueNames: ['NavBarBottomIcon', 'EgNavBarBottomIcon'],
    domClass: 'eds-nav-bar-bottom-icon',
    props: [],
  },
  {
    displayName: 'FlotationTrigger',
    priority: 72,
    vueNames: ['FlotationTrigger', 'EgFlotationTrigger'],
    domClass: 'eds-flotation-trigger',
    props: [],
  },
  {
    displayName: 'FlotationMenu',
    priority: 71,
    vueNames: ['FlotationMenu', 'EgFlotationMenu'],
    domClass: 'eds-flotation-menu',
    props: [],
  },
  {
    displayName: 'FlotationMenuItem',
    priority: 71,
    vueNames: ['FlotationMenuItem', 'EgFlotationMenuItem'],
    domClass: 'eds-flotation-menu-item',
    props: [],
  },
  {
    displayName: 'DataListCellOverflow',
    priority: 84,
    vueNames: ['DataListCellOverflow', 'EgDataListCellOverflow'],
    props: [
      { key: 'text', label: '文本', format: formatOptionalText },
      { key: 'context', label: '上下文', defaultValue: 'cell' },
    ],
  },
  {
    displayName: 'ModuleMenuTitle',
    priority: 56,
    vueNames: ['ModuleMenuTitle', 'EgModuleMenuTitle'],
    props: [
      { key: 'title', label: '标题', format: formatOptionalText },
      { key: 'titleMode', label: '标题模式', defaultValue: 'text' },
    ],
  },
  {
    displayName: 'NavBarSystemButtons',
    priority: 62,
    vueNames: ['NavBarSystemButtons', 'EgNavBarSystemButtons'],
    domClass: 'eds-nav-bar-system-buttons',
    props: [],
  },
  {
    displayName: 'PaginerStatisticsCollapse',
    priority: 37,
    vueNames: ['PaginerStatisticsCollapse', 'EgPaginerStatisticsCollapse'],
    props: [],
  },
  {
    displayName: 'BatchBarActionItem',
    priority: 54,
    vueNames: ['BatchBarActionItem', 'EgBatchBarActionItem'],
    domClass: 'eds-batch-bar-action-item',
    props: [],
  },
  {
    displayName: 'Input',
    priority: 68,
    vueNames: ['Input', 'EgInput'],
    domClass: 'eds-input-field',
    props: [],
  },
  {
    displayName: 'VerifyInput',
    priority: 67,
    vueNames: ['VerifyInput', 'EgVerifyInput'],
    domClass: 'eds-verify-input',
    props: [],
  },
  {
    displayName: 'Radio',
    priority: 64,
    vueNames: ['Radio', 'EgRadio'],
    domClass: 'eds-radio',
    props: [],
  },
  {
    displayName: 'Switch',
    priority: 64,
    vueNames: ['Switch', 'EgSwitch'],
    domClass: 'eds-switch',
    props: [],
  },
  {
    displayName: 'Decide',
    priority: 64,
    vueNames: ['Decide', 'EgDecide'],
    domClass: 'eds-decide',
    props: [],
  },
  {
    displayName: 'Tabs',
    priority: 41,
    vueNames: ['Tabs', 'EgTabs'],
    domClass: 'eds-tabs',
    props: [],
  },
  {
    displayName: 'Toast',
    priority: 46,
    vueNames: ['Toast', 'EgToast'],
    domClass: 'eds-toast',
    props: [],
  },
  {
    displayName: 'Message',
    priority: 46,
    vueNames: ['Message', 'EgMessage'],
    domClass: 'eds-message',
    props: [],
  },
  {
    displayName: 'Reddot',
    priority: 46,
    vueNames: ['Reddot', 'EgReddot'],
    domClass: 'eds-reddot',
    props: [],
  },
  {
    displayName: 'Streamer',
    priority: 46,
    vueNames: ['Streamer', 'EgStreamer'],
    domClass: 'eds-streamer',
    props: [],
  },
  {
    displayName: 'EndFeedbackCard',
    priority: 46,
    vueNames: ['EndFeedbackCard', 'EgEndFeedbackCard'],
    domClass: 'eds-end-feedback-card',
    props: [],
  },
  {
    displayName: 'MotionHoverEnter',
    priority: 44,
    vueNames: ['MotionHoverEnter', 'EgMotionHoverEnter'],
    domClass: 'eds-motion-hover-enter',
    props: [],
  },
];

const catalogByVueName = new Map<string, EdsInspectCatalogEntry>();
const catalogByDomClass = new Map<string, EdsInspectCatalogEntry>();

for (const entry of EDS_INSPECT_CATALOG) {
  for (const name of entry.vueNames) {
    catalogByVueName.set(name, entry);
  }
  if (entry.domClass) {
    catalogByDomClass.set(entry.domClass, entry);
  }
}

export function lookupEdsCatalogByVueName(name: string | null | undefined): EdsInspectCatalogEntry | null {
  if (!name) return null;
  return catalogByVueName.get(name) ?? null;
}

export function lookupEdsCatalogByDomClass(className: string): EdsInspectCatalogEntry | null {
  return catalogByDomClass.get(className) ?? null;
}

export function lookupEdsPropSpec(
  entry: EdsInspectCatalogEntry,
  label: string,
): EdsPropSpec | undefined {
  return entry.props.find((spec) => spec.label === label);
}
