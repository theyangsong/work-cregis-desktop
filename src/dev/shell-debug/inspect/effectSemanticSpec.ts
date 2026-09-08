/** Effect 语义类真源：eds-desktop packages/tokens/spec/effect/semantic.json */

export type EffectSemanticSpec = {
  title: string;
  className: string;
  /** 样式区一行引用：class · token */
  primaryToken: string;
  /** 布局区关键片段（不含 box-sizing / overflow 等次要项） */
  layoutSnippet: readonly string[];
  properties: Record<string, string>;
  notes?: readonly string[];
};

const EFFECT_CSS_PROPERTY_ORDER = [
  'box-sizing',
  'display',
  'flex-direction',
  'align-items',
  'width',
  'min-width',
  'height',
  'min-height',
  'overflow',
  'padding',
  'border-radius',
  'border',
  'background',
  'background-blend-mode',
  'box-shadow',
  'backdrop-filter',
  '-webkit-backdrop-filter',
] as const;

export const EFFECT_SEMANTIC_SPECS: readonly EffectSemanticSpec[] = [
  {
    title: 'Container Box（容器面板）',
    className: 'effect-container-box',
    primaryToken: '--box-container',
    layoutSnippet: ['display: flex', 'flex-direction: column', 'width: 100%'],
    properties: {
      'box-sizing': 'border-box',
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'flex-start',
      width: '100%',
      'min-width': '960px',
      height: '100%',
      'min-height': '720px',
      overflow: 'visible',
      'border-radius': 'var(--radius-md)',
      border: 'var(--stroke-xs) solid var(--material-same-white-quaternary)',
      background: 'var(--box-container)',
      'box-shadow': 'var(--eds-shadow-deep)',
      'backdrop-filter': 'var(--eds-blur-bg)',
      '-webkit-backdrop-filter': 'var(--eds-blur-bg)',
    },
    notes: [
      '圆角 var(--radius-md) + 全局 --corner-smoothing 60% squircle',
      '默认参考画布 1280×800；客户端最小 960×720；同白 border 与 eds-shadow-deep 并存',
    ],
  },
  {
    title: 'Flotation Box（浮层面板）',
    className: 'effect-flotation-box',
    primaryToken: '--effect-flotation-box',
    layoutSnippet: ['display: flex', 'flex-direction: column', 'width: max-content', 'padding: var(--spacing-1)'],
    properties: {
      'box-sizing': 'border-box',
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'flex-start',
      width: 'max-content',
      overflow: 'visible',
      padding: 'var(--spacing-1)',
      'border-radius': 'var(--radius-md)',
      border: 'var(--stroke-xs) solid var(--material-same-white-quaternary)',
      background:
        'linear-gradient(0deg, var(--material-same-white-quaternary) 0%, var(--material-same-white-quaternary) 100%), var(--effect-flotation-box)',
      'background-blend-mode': 'normal, luminosity',
      'box-shadow': 'var(--eds-shadow-light)',
      'backdrop-filter': 'var(--eds-blur-bg)',
      '-webkit-backdrop-filter': 'var(--eds-blur-bg)',
    },
    notes: [
      '圆角 var(--radius-md) + 全局 --corner-smoothing 60% squircle',
      '同白 border（material-same-white-quaternary）与 eds-shadow-light 并存',
    ],
  },
  {
    title: 'Popover Box（Popover 面板）',
    className: 'effect-popover-box',
    primaryToken: '--effect-popover-box',
    layoutSnippet: ['display: flex', 'flex-direction: column', 'width: max-content', 'padding: var(--spacing-1)'],
    properties: {
      'box-sizing': 'border-box',
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'flex-start',
      width: 'max-content',
      overflow: 'visible',
      padding: 'var(--spacing-1)',
      'border-radius': 'var(--radius-md)',
      border: 'none',
      background:
        'linear-gradient(0deg, var(--material-same-white-quaternary) 0%, var(--material-same-white-quaternary) 100%), var(--effect-popover-box)',
      'background-blend-mode': 'normal, luminosity',
      'box-shadow': 'var(--eds-shadow-light)',
      'backdrop-filter': 'var(--eds-blur-bg)',
      '-webkit-backdrop-filter': 'var(--eds-blur-bg)',
    },
    notes: [
      '圆角 var(--radius-md) + 全局 --corner-smoothing 60% squircle',
      '底层 effect-popover-box（eds-popup @ 85%）+ 同白 luminosity 叠色；无边框',
    ],
  },
  {
    title: 'Popup Box（弹窗面板）',
    className: 'effect-popup-box',
    primaryToken: '--eds-flotation',
    layoutSnippet: ['display: flex', 'flex-direction: column', 'width: max-content'],
    properties: {
      'box-sizing': 'border-box',
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'flex-start',
      width: 'max-content',
      overflow: 'visible',
      padding: 'var(--spacing-0)',
      'border-radius': 'var(--radius-lg)',
      border: 'var(--stroke-xs) solid var(--material-same-white-quaternary)',
      background:
        'linear-gradient(0deg, var(--box-flotation) 0%, var(--box-flotation) 100%), var(--eds-flotation)',
      'background-blend-mode': 'normal, luminosity',
      'box-shadow': 'var(--eds-shadow-light)',
      'backdrop-filter': 'var(--eds-blur-bg)',
      '-webkit-backdrop-filter': 'var(--eds-blur-bg)',
    },
    notes: [
      '圆角 var(--radius-lg) + 全局 --corner-smoothing 60% squircle',
      'Popup 浮层一体场景',
    ],
  },
  {
    title: 'Subtle Card（页面面板）',
    className: 'effect-subtle-card',
    primaryToken: '--box-page',
    layoutSnippet: ['display: flex', 'flex-direction: column', 'width: 100%'],
    properties: {
      'box-sizing': 'border-box',
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'flex-start',
      width: '100%',
      overflow: 'visible',
      'border-radius': 'var(--radius-md)',
      border: 'var(--stroke-xs) solid var(--material-same-white-quaternary)',
      background: 'var(--box-page)',
      'box-shadow': 'var(--eds-shadow-subtle)',
    },
    notes: ['组成：Fill + 同白 Border + Shadow；width 100% 铺满页面区域，非 max-content'],
  },
  {
    title: 'Molde Level（模块层级）',
    className: 'effect-molde-level',
    primaryToken: '--eds-shadow-molde',
    layoutSnippet: [],
    properties: {
      'box-shadow': 'var(--eds-shadow-molde)',
    },
    notes: ['组成：Shadow', '用于模块左弱阴影'],
  },
] as const;

const EFFECT_SPEC_BY_CLASS = new Map(
  EFFECT_SEMANTIC_SPECS.map((spec) => [spec.className, spec]),
);

export function lookupEffectSemanticSpec(className: string): EffectSemanticSpec | null {
  return EFFECT_SPEC_BY_CLASS.get(className) ?? null;
}

export function resolveEffectSemanticClass(element: Element): string | null {
  for (const className of element.classList) {
    if (EFFECT_SPEC_BY_CLASS.has(className)) return className;
  }
  return null;
}

/** Tooltip panelKind → effect 类（eds-desktop Tooltip.vue EFFECT_PANEL_CLASS） */
export const TOOLTIP_PANEL_KIND_EFFECT_CLASS: Readonly<Record<string, string>> = {
  container: 'effect-container-box',
  flotation: 'effect-flotation-box',
  popup: 'effect-popup-box',
  subtle: 'effect-subtle-card',
  molde: 'effect-molde-level',
};

export function formatEffectSemanticStyleLine(spec: EffectSemanticSpec): string {
  return `class=".${spec.className}"`;
}

export function formatEffectSemanticLayoutLines(
  spec: EffectSemanticSpec,
  options: { batchBarInnerPanel?: boolean } = {},
): string[] {
  const lines = spec.layoutSnippet.map((line) => (line.endsWith(';') ? line : `${line};`));
  if (options.batchBarInnerPanel) {
    lines.push('flex-direction: row;', 'height: var(--scale-8);');
  }
  return lines;
}

const EFFECT_SEMANTIC_CLASS_ATTR_LINE = /^class="(\.effect-[\w-]+)"$/;
const EFFECT_SEMANTIC_CLASS_LINE = /^\.effect-[\w-]+$/;
const EFFECT_SEMANTIC_CLASS_LEGACY_LINE = /^class:\s*(\.effect-[\w-]+)$/;

/** 样式区 `class=".effect-*"` 行 → 无点 className。 */
export function parseEffectSemanticClassFromStyleLine(line: string): string | null {
  const trimmed = line.trim();
  const attrMatch = trimmed.match(EFFECT_SEMANTIC_CLASS_ATTR_LINE);
  if (attrMatch) return attrMatch[1].slice(1);
  if (EFFECT_SEMANTIC_CLASS_LINE.test(trimmed)) return trimmed.slice(1);
  const legacy = trimmed.match(EFFECT_SEMANTIC_CLASS_LEGACY_LINE);
  return legacy ? legacy[1].slice(1) : null;
}

/** Tooltip 内展示的完整 Effect 语义类代码块。 */
export function formatEffectSemanticCssBlock(spec: EffectSemanticSpec): string {
  const lines: string[] = [`.${spec.className} {`];

  for (const property of EFFECT_CSS_PROPERTY_ORDER) {
    const value = spec.properties[property];
    if (!value) continue;
    lines.push(`  ${property}: ${value};`);
  }

  for (const note of spec.notes ?? []) {
    lines.push(`  /* ${note} */`);
  }

  lines.push('}');
  return lines.join('\n');
}

export function buildEffectSemanticCssBlock(className: string): string | null {
  const spec = lookupEffectSemanticSpec(className);
  if (!spec) return null;
  return formatEffectSemanticCssBlock(spec);
}
