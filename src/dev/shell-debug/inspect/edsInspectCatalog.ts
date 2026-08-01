import {
  deriveIconName,
  deriveIconSize,
  formatIconSizeToken,
  deriveIconColorToken,
} from './buildIconInspect';

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
  props: EdsPropSpec[];
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
        key: 'size',
        label: '尺寸',
        defaultValue: 'md',
        derive: deriveIconSize,
        format: (value) => formatIconSizeToken(value),
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
    displayName: 'Tooltip',
    priority: 60,
    vueNames: ['Tooltip', 'EgTooltip', 'AnchoredTooltip', 'EgAnchoredTooltip'],
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
    priority: 50,
    vueNames: ['Avatar', 'EgAvatar'],
    domClass: 'eds-avatar',
    props: [
      { key: 'size', label: '尺寸', defaultValue: 'md' },
      { key: 'name', label: '名称', format: formatOptionalText },
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
