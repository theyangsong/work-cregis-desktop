import type { InspectPropertyItem } from './buildElementInspectInfo';
import {
  collectDeclaredCssValues,
  formatAuthoredInspectValue,
  isAnyCssPropertyDeclared,
  pickDeclaredCssValue,
  type DeclaredCssValues,
} from './inspectDeclaredStyles';
import {
  inspectTokenFilters,
  requireInspectCssLine,
  resolveInspectToken,
  type TokenProbeStyleProperty,
} from './resolveDesignToken';

const LAYOUT_ORDER = [
  'display',
  'flex-direction',
  'flex-wrap',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'padding',
  'margin',
  'gap',
  'row-gap',
  'column-gap',
  'flex',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'align-items',
  'justify-content',
  'align-self',
  'justify-self',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'overflow',
  'overflow-x',
  'overflow-y',
  'grid-template-columns',
  'grid-template-rows',
  'grid-column',
  'grid-row',
] as const;

const STYLE_ORDER = [
  'background',
  'background-color',
  'border',
  'border-radius',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'box-shadow',
  'opacity',
  'filter',
  'backdrop-filter',
  'mix-blend-mode',
] as const;

const CHROME_SURFACE_STYLE_LABELS = new Set(['background', 'background-color', 'backdrop-filter']);

const BACKDROP_FILTER_DECLARED_KEYS = ['backdrop-filter', '-webkit-backdrop-filter'] as const;

function backgroundTokenFilter(name: string): boolean {
  return inspectTokenFilters.material(name)
    || name.startsWith('--eds-avatar-')
    || name.startsWith('--effect-');
}

const PADDING_PROPS = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'] as const;
const MARGIN_PROPS = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'] as const;

const PADDING_COMPUTED_KEYS = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const;
const MARGIN_COMPUTED_KEYS = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const;

type SpacingComputedKey = 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'
  | 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft'
  | 'rowGap' | 'columnGap';

function normalizeCss(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function isZeroSpacing(value: string): boolean {
  const normalized = normalizeCss(value).toLowerCase();
  return !normalized || normalized === '0' || normalized === '0px' || normalized === '0%';
}

function isInactiveGap(value: string): boolean {
  const normalized = normalizeCss(value).toLowerCase();
  return isZeroSpacing(value) || normalized === 'normal';
}

function isNoiseMinMaxConstraint(
  property: 'min-width' | 'min-height' | 'max-width' | 'max-height',
  value: string,
): boolean {
  const normalized = normalizeCss(value).toLowerCase();
  if (property.startsWith('min-')) {
    return isZeroSpacing(normalized)
      || normalized === 'var(--scale-0)'
      || normalized === 'auto';
  }
  return normalized === 'none' || normalized === 'auto';
}

function isInsideDataListBodyCell(element: Element): boolean {
  const td = element.closest('.eds-data-list tbody td');
  if (!(td instanceof HTMLElement)) return false;
  return !td.className.includes('columnSelect');
}

function isDataListColumnBodyCell(element: Element): boolean {
  const td = element.closest('.eds-data-list tbody td');
  if (!(td instanceof HTMLElement) || td.className.includes('columnSelect')) return false;
  return element === td || td.contains(element);
}

function isMeaninglessBorder(value: string): boolean {
  const normalized = normalizeCss(value).toLowerCase();
  return normalized === 'none' || normalized === '0' || normalized.startsWith('0px');
}

function propertyRank(property: string, order: readonly string[]): number {
  const index = order.indexOf(property as (typeof order)[number]);
  return index >= 0 ? index : order.length + 1;
}

function makeItem(property: string, value: string, copyNote?: string): InspectPropertyItem {
  const { display, token } = formatAuthoredInspectValue(value);
  const note = copyNote ? ` /* ${copyNote} */` : '';
  return {
    label: property,
    value: display,
    token,
    copyLine: `${property}: ${display};${note}`,
  };
}

function pushUnique(items: InspectPropertyItem[], item: InspectPropertyItem) {
  if (items.some((entry) => entry.label === item.label)) return;
  items.push(item);
}

function extractCSSValue(cssLine: string): string {
  const match = cssLine.match(/:\s*([^;]+)/);
  return match?.[1]?.trim() ?? cssLine;
}

function resolveSpacingCSSValue(
  preview: Element,
  raw: string,
  styleProperty: SpacingComputedKey,
): string {
  const authored = formatAuthoredInspectValue(raw);
  if (authored.token) return authored.display;

  const cssProperty = styleProperty.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
  const line = requireInspectCssLine(
    preview,
    cssProperty,
    raw,
    inspectTokenFilters.spacing,
    styleProperty as TokenProbeStyleProperty,
    { allowLiteral: true },
  );
  if (line) return extractCSSValue(line);
  return normalizeCss(raw);
}

function buildBoxShorthand(
  declared: DeclaredCssValues,
  style: CSSStyleDeclaration,
  preview: Element,
  kind: 'padding' | 'margin',
): string | null {
  const longhands = kind === 'padding' ? PADDING_PROPS : MARGIN_PROPS;
  const computedKeys = kind === 'padding' ? PADDING_COMPUTED_KEYS : MARGIN_COMPUTED_KEYS;

  const shorthand = pickDeclaredCssValue(declared, [kind]);
  if (shorthand) return shorthand;

  const declaredSides = longhands.map((property) => declared.get(property) ?? null);
  const hasDeclared = declaredSides.some(Boolean);

  if (hasDeclared) {
    const sides = longhands.map((property, index) => {
      const declaredValue = declared.get(property);
      if (declaredValue) return declaredValue;
      const computed = style[computedKeys[index]!];
      return computed && !isZeroSpacing(computed)
        ? resolveSpacingCSSValue(preview, computed, computedKeys[index]!)
        : '0';
    });
    return joinBoxShorthand(sides[0]!, sides[1]!, sides[2]!, sides[3]!);
  }

  const computedSides = computedKeys.map((key) => {
    const value = style[key];
    return value && !isZeroSpacing(value) ? resolveSpacingCSSValue(preview, value, key) : null;
  });
  if (computedSides.every((value) => !value)) return null;

  const t = computedSides[0] ?? '0';
  const r = computedSides[1] ?? t;
  const b = computedSides[2] ?? t;
  const l = computedSides[3] ?? r;
  return joinBoxShorthand(t, r, b, l);
}

function joinBoxShorthand(top: string, right: string, bottom: string, left: string): string {
  if (top === right && right === bottom && bottom === left) return top;
  if (top === bottom && right === left) return `${top} ${right}`;
  if (right === left) return `${top} ${right} ${bottom}`;
  return `${top} ${right} ${bottom} ${left}`;
}

function buildGapShorthand(
  declared: DeclaredCssValues,
  style: CSSStyleDeclaration,
  preview: Element,
): { gap?: string; rowGap?: string; columnGap?: string } {
  const gap = pickDeclaredCssValue(declared, ['gap']);
  if (gap) return { gap };

  const rowDeclared = declared.get('row-gap');
  const columnDeclared = declared.get('column-gap');
  if (rowDeclared || columnDeclared) {
    if (rowDeclared && columnDeclared) {
      if (rowDeclared === columnDeclared) return { gap: rowDeclared };
      return { rowGap: rowDeclared, columnGap: columnDeclared };
    }
    if (rowDeclared) return { rowGap: rowDeclared };
    if (columnDeclared) return { columnGap: columnDeclared };
  }

  const rowComputed = style.rowGap;
  const columnComputed = style.columnGap;
  const hasRow = rowComputed && !isInactiveGap(rowComputed);
  const hasColumn = columnComputed && !isInactiveGap(columnComputed);

  if (hasRow && hasColumn) {
    const row = resolveSpacingCSSValue(preview, rowComputed, 'rowGap');
    const column = resolveSpacingCSSValue(preview, columnComputed, 'columnGap');
    if (row === column) return { gap: row };
    return { rowGap: row, columnGap: column };
  }
  if (hasRow) return { rowGap: resolveSpacingCSSValue(preview, rowComputed, 'rowGap') };
  if (hasColumn) return { columnGap: resolveSpacingCSSValue(preview, columnComputed, 'columnGap') };

  const legacyGap = style.gap;
  if (legacyGap && !isInactiveGap(legacyGap)) {
    return { gap: resolveSpacingCSSValue(preview, legacyGap, 'rowGap') };
  }

  return {};
}

type LayoutContext = {
  display: string;
  isFlexContainer: boolean;
  isGridContainer: boolean;
  isFlexOrGridContainer: boolean;
  isFlexChild: boolean;
  isGridChild: boolean;
  parentAlignItems: string | null;
};

function resolveLayoutContext(element: Element, style: CSSStyleDeclaration): LayoutContext {
  const display = normalizeCss(style.display);
  const isFlexContainer = display === 'flex' || display === 'inline-flex';
  const isGridContainer = display === 'grid' || display === 'inline-grid';
  const parent = element.parentElement;
  const parentStyle = parent ? getComputedStyle(parent) : null;
  const parentDisplay = parentStyle ? normalizeCss(parentStyle.display) : '';
  const parentIsFlex = parentDisplay === 'flex' || parentDisplay === 'inline-flex';
  const parentIsGrid = parentDisplay === 'grid' || parentDisplay === 'inline-grid';

  return {
    display,
    isFlexContainer,
    isGridContainer,
    isFlexOrGridContainer: isFlexContainer || isGridContainer,
    isFlexChild: parentIsFlex,
    isGridChild: parentIsGrid,
    parentAlignItems: parentStyle ? normalizeCss(parentStyle.alignItems) : null,
  };
}

function buildFlexShorthand(declared: DeclaredCssValues): string | null {
  const flex = pickDeclaredCssValue(declared, ['flex']);
  if (flex) return flex;

  const grow = declared.get('flex-grow');
  const shrink = declared.get('flex-shrink');
  const basis = declared.get('flex-basis');
  if (grow == null && shrink == null && basis == null) return null;
  if (grow === '1' && (shrink === '1' || shrink == null) && (basis === '0%' || basis === '0px' || basis === '0')) {
    return '1';
  }
  return null;
}

function shouldShowDisplay(declared: DeclaredCssValues, ctx: LayoutContext): boolean {
  if (pickDeclaredCssValue(declared, ['display'])) return true;
  return ctx.isFlexOrGridContainer || ctx.display === 'inline-block' || ctx.display === 'inline-flex' || ctx.display === 'none';
}

function shouldShowFlexAxis(
  property: 'align-items' | 'justify-content' | 'flex-direction' | 'flex-wrap',
  declared: DeclaredCssValues,
  style: CSSStyleDeclaration,
  ctx: LayoutContext,
): boolean {
  if (!ctx.isFlexOrGridContainer) return false;
  if (pickDeclaredCssValue(declared, [property])) return true;

  const value = normalizeCss(
    property === 'flex-direction'
      ? style.flexDirection
      : property === 'flex-wrap'
        ? style.flexWrap
        : property === 'align-items'
          ? style.alignItems
          : style.justifyContent,
  );

  if (property === 'flex-direction' && value !== 'row') return true;
  if (property === 'flex-wrap' && value !== 'nowrap') return true;
  if (property === 'align-items' && value !== 'normal' && value !== 'stretch') return true;
  if (property === 'justify-content' && value !== 'normal' && value !== 'flex-start') return true;
  return false;
}

function shouldShowAlignSelf(declared: DeclaredCssValues, style: CSSStyleDeclaration, ctx: LayoutContext): boolean {
  if (!ctx.isFlexChild && !ctx.isGridChild) return false;
  if (pickDeclaredCssValue(declared, ['align-self'])) return true;

  const self = normalizeCss(style.alignSelf);
  if (self === 'auto' || self === 'normal') return false;
  if (!ctx.parentAlignItems) return self !== 'stretch';
  return self !== ctx.parentAlignItems;
}

function resolveSizeCSSValue(
  preview: Element,
  property: 'width' | 'height' | 'min-width' | 'min-height' | 'max-width' | 'max-height',
  raw: string,
): string | null {
  const authored = formatAuthoredInspectValue(raw);
  if (authored.token) return authored.display;

  const styleProperty = property.includes('width') ? 'width' : 'height';
  const resolved = resolveInspectToken(
    preview,
    raw,
    (name) =>
      inspectTokenFilters.avatar(name)
      || inspectTokenFilters.spacing(name)
      || inspectTokenFilters.scale(name),
    styleProperty,
  );
  if (resolved.isToken && resolved.tokenVar) return resolved.tokenVar;
  if (property.startsWith('min-') || property.startsWith('max-')) {
    return normalizeCss(raw);
  }
  return null;
}

function resolveSizeConstraintValue(
  property: 'width' | 'height' | 'min-width' | 'min-height' | 'max-width' | 'max-height',
  declared: DeclaredCssValues,
  style: CSSStyleDeclaration,
  preview: Element,
  element: Element,
): string | null {
  const declaredValue = pickDeclaredCssValue(declared, [property]);
  if (declaredValue) return declaredValue;

  if (property === 'width' || property === 'height') {
    const camel = property === 'width' ? 'width' : 'height';
    const computed = style[camel];
    if (!computed || computed === 'auto') return null;
    return resolveSizeCSSValue(preview, property, computed);
  }

  if (
    isInsideDataListBodyCell(element)
    && (property === 'min-width' || property === 'min-height')
  ) {
    return null;
  }

  const camel = property.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()) as keyof CSSStyleDeclaration;
  const computed = String(style[camel] ?? '');
  if (!computed || computed === 'none' || computed === 'auto') return null;

  const resolved = resolveSizeCSSValue(preview, property, computed) ?? computed;
  if (isNoiseMinMaxConstraint(property, resolved)) return null;
  return resolved;
}

function shouldShowOverflow(declared: DeclaredCssValues, style: CSSStyleDeclaration): boolean {
  if (pickDeclaredCssValue(declared, ['overflow', 'overflow-x', 'overflow-y'])) return true;
  return normalizeCss(style.overflow) !== 'visible';
}

function shouldShowPosition(declared: DeclaredCssValues, style: CSSStyleDeclaration): boolean {
  const position = pickDeclaredCssValue(declared, ['position']) ?? normalizeCss(style.position);
  return position !== 'static' && position !== '';
}

function pickPositionOffsets(declared: DeclaredCssValues): InspectPropertyItem[] {
  const items: InspectPropertyItem[] = [];
  for (const property of ['top', 'right', 'bottom', 'left'] as const) {
    const value = pickDeclaredCssValue(declared, [property]);
    if (!value || value === 'auto') continue;
    pushUnique(items, makeItem(property, value));
  }
  return items;
}

type BuildLayoutOptions = {
  dataListColumnMinWidth?: string | null;
};

function buildLayoutItems(
  element: Element,
  preview: Element,
  style: CSSStyleDeclaration,
  declared: DeclaredCssValues,
  ctx: LayoutContext,
  options: BuildLayoutOptions = {},
): InspectPropertyItem[] {
  const items: InspectPropertyItem[] = [];

  if (shouldShowDisplay(declared, ctx)) {
    const display = pickDeclaredCssValue(declared, ['display']) ?? ctx.display;
    pushUnique(items, makeItem('display', display));
  }

  if (shouldShowFlexAxis('flex-direction', declared, style, ctx)) {
    pushUnique(items, makeItem('flex-direction', pickDeclaredCssValue(declared, ['flex-direction']) ?? style.flexDirection));
  }
  if (shouldShowFlexAxis('flex-wrap', declared, style, ctx)) {
    pushUnique(items, makeItem('flex-wrap', pickDeclaredCssValue(declared, ['flex-wrap']) ?? style.flexWrap));
  }

  for (const property of ['min-width', 'max-width', 'min-height', 'max-height', 'width', 'height'] as const) {
    const value = resolveSizeConstraintValue(property, declared, style, preview, element);
    if (!value) continue;
    if (
      property === 'max-width'
      && isDataListColumnBodyCell(element)
      && (value === '0' || value === '0px')
    ) {
      pushUnique(items, makeItem(property, value, 'table 列 flex ellipsis'));
      continue;
    }
    pushUnique(items, makeItem(property, value));
  }

  if (options.dataListColumnMinWidth) {
    const withoutMinWidth = items.filter((item) => item.label !== 'min-width');
    items.length = 0;
    items.push(...withoutMinWidth);
    pushUnique(items, makeItem('min-width', options.dataListColumnMinWidth, 'EgDataListColumn prop'));
  }

  const padding = buildBoxShorthand(declared, style, preview, 'padding');
  if (padding && !isZeroSpacing(padding)) {
    pushUnique(items, makeItem('padding', padding));
  }

  const margin = buildBoxShorthand(declared, style, preview, 'margin');
  if (margin && !isZeroSpacing(margin)) {
    pushUnique(items, makeItem('margin', margin));
  }

  const gapValues = buildGapShorthand(declared, style, preview);
  if (gapValues.gap) {
    pushUnique(items, makeItem('gap', gapValues.gap));
  } else {
    if (gapValues.rowGap) pushUnique(items, makeItem('row-gap', gapValues.rowGap));
    if (gapValues.columnGap) pushUnique(items, makeItem('column-gap', gapValues.columnGap));
  }

  const flex = buildFlexShorthand(declared);
  if (flex && (ctx.isFlexChild || pickDeclaredCssValue(declared, ['flex', 'flex-grow', 'flex-shrink', 'flex-basis']))) {
    pushUnique(items, makeItem('flex', flex));
  } else {
    for (const property of ['flex-grow', 'flex-shrink', 'flex-basis'] as const) {
      const value = pickDeclaredCssValue(declared, [property]);
      if (value) pushUnique(items, makeItem(property, value));
    }
  }

  if (shouldShowFlexAxis('align-items', declared, style, ctx)) {
    pushUnique(items, makeItem('align-items', pickDeclaredCssValue(declared, ['align-items']) ?? style.alignItems));
  }
  if (shouldShowFlexAxis('justify-content', declared, style, ctx)) {
    pushUnique(items, makeItem('justify-content', pickDeclaredCssValue(declared, ['justify-content']) ?? style.justifyContent));
  }
  if (shouldShowAlignSelf(declared, style, ctx)) {
    pushUnique(items, makeItem('align-self', pickDeclaredCssValue(declared, ['align-self']) ?? style.alignSelf));
  }

  if (shouldShowPosition(declared, style)) {
    const position = pickDeclaredCssValue(declared, ['position']) ?? style.position;
    pushUnique(items, makeItem('position', position));
    for (const item of pickPositionOffsets(declared)) {
      pushUnique(items, item);
    }
  }

  if (shouldShowOverflow(declared, style)) {
    const overflow = pickDeclaredCssValue(declared, ['overflow']);
    if (overflow && overflow !== 'visible') {
      pushUnique(items, makeItem('overflow', overflow));
    } else {
      let addedOverflowLonghand = false;
      for (const property of ['overflow-x', 'overflow-y'] as const) {
        const value = pickDeclaredCssValue(declared, [property]);
        if (value && value !== 'visible') {
          pushUnique(items, makeItem(property, value));
          addedOverflowLonghand = true;
        }
      }
      if (!addedOverflowLonghand) {
        const computedOverflow = normalizeCss(style.overflow);
        if (computedOverflow !== 'visible') {
          pushUnique(items, makeItem('overflow', computedOverflow));
        }
      }
    }
  }

  for (const property of ['grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row'] as const) {
    const value = pickDeclaredCssValue(declared, [property]);
    if (value) pushUnique(items, makeItem(property, value));
  }

  items.sort((left, right) => propertyRank(left.label, LAYOUT_ORDER) - propertyRank(right.label, LAYOUT_ORDER));
  return items;
}

function resolveStyleCSSValue(
  preview: Element,
  property: string,
  raw: string,
  styleProperty: TokenProbeStyleProperty,
  filter: (name: string) => boolean,
): string | null {
  const authored = formatAuthoredInspectValue(raw);
  if (authored.token) return authored.display;

  const line = requireInspectCssLine(preview, property, raw, filter, styleProperty, { allowLiteral: true });
  if (line) return extractCSSValue(line);
  return normalizeCss(raw);
}

function buildBackgroundStyleItem(
  preview: Element,
  style: CSSStyleDeclaration,
  declared: DeclaredCssValues,
): InspectPropertyItem | null {
  const backgroundDeclared = pickDeclaredCssValue(declared, ['background', 'background-color']);
  if (backgroundDeclared && !isMeaninglessBorder(backgroundDeclared)) {
    const property = declared.has('background') ? 'background' : 'background-color';
    return makeItem(property, backgroundDeclared);
  }

  const backgroundComputed = style.backgroundColor;
  if (!backgroundComputed || isMeaninglessBorder(backgroundComputed) || backgroundComputed === 'rgba(0, 0, 0, 0)') {
    return null;
  }

  const resolved = resolveStyleCSSValue(
    preview,
    'background',
    backgroundComputed,
    'backgroundColor',
    backgroundTokenFilter,
  );
  return resolved ? makeItem('background', resolved) : null;
}

function buildBackdropFilterStyleItem(
  preview: Element,
  style: CSSStyleDeclaration,
  declared: DeclaredCssValues,
): InspectPropertyItem | null {
  const declaredValue = pickDeclaredCssValue(declared, BACKDROP_FILTER_DECLARED_KEYS);
  if (declaredValue && declaredValue !== 'none') {
    return makeItem('backdrop-filter', declaredValue);
  }

  const computed = style.backdropFilter;
  if (!computed || computed === 'none') {
    return null;
  }

  const resolved = resolveStyleCSSValue(
    preview,
    'backdrop-filter',
    computed,
    'backdropFilter',
    inspectTokenFilters.blur,
  );
  return resolved ? makeItem('backdrop-filter', resolved) : null;
}

function buildFrostedChromeSurfaceStyleItems(
  preview: Element,
  element: Element,
): InspectPropertyItem[] {
  const declared = collectDeclaredCssValues(element, { excludeDevInspectRules: true });
  const style = getComputedStyle(element);
  const items: InspectPropertyItem[] = [];

  const background = buildBackgroundStyleItem(preview, style, declared);
  if (background) items.push(background);

  const backdrop = buildBackdropFilterStyleItem(preview, style, declared);
  if (backdrop) items.push(backdrop);

  return items;
}

function mergeFrostedChromeSurfaceStyles(
  primaryItems: InspectPropertyItem[],
  chromeItems: InspectPropertyItem[],
): InspectPropertyItem[] {
  if (chromeItems.length === 0) return primaryItems;

  const rest = primaryItems.filter((item) => !CHROME_SURFACE_STYLE_LABELS.has(item.label));
  const merged = [...chromeItems, ...rest];
  merged.sort((left, right) => propertyRank(left.label, STYLE_ORDER) - propertyRank(right.label, STYLE_ORDER));
  return merged;
}

function buildStyleItems(
  preview: Element,
  style: CSSStyleDeclaration,
  declared: DeclaredCssValues,
): InspectPropertyItem[] {
  const items: InspectPropertyItem[] = [];

  const background = buildBackgroundStyleItem(preview, style, declared);
  if (background) pushUnique(items, background);

  const border = pickDeclaredCssValue(declared, ['border']);
  if (border && !isMeaninglessBorder(border)) {
    pushUnique(items, makeItem('border', border));
  }

  const borderRadiusDeclared = pickDeclaredCssValue(declared, ['border-radius']);
  if (borderRadiusDeclared && !isMeaninglessBorder(borderRadiusDeclared)) {
    pushUnique(items, makeItem('border-radius', borderRadiusDeclared));
  } else {
    const radiusComputed = style.borderRadius;
    if (radiusComputed && !isMeaninglessBorder(radiusComputed)) {
      const resolved = resolveStyleCSSValue(
        preview,
        'border-radius',
        radiusComputed,
        'borderRadius',
        inspectTokenFilters.radius,
      );
      if (resolved) pushUnique(items, makeItem('border-radius', resolved));
    }
  }

  if (!declared.has('border')) {
    for (const property of ['border-top', 'border-right', 'border-bottom', 'border-left'] as const) {
      const value = pickDeclaredCssValue(declared, [property]);
      if (!value || isMeaninglessBorder(value)) continue;
      pushUnique(items, makeItem(property, value));
    }
  }

  const boxShadowDeclared = pickDeclaredCssValue(declared, ['box-shadow']);
  if (boxShadowDeclared && boxShadowDeclared !== 'none') {
    pushUnique(items, makeItem('box-shadow', boxShadowDeclared));
  } else {
    const shadowComputed = style.boxShadow;
    if (shadowComputed && shadowComputed !== 'none') {
      const resolved = resolveStyleCSSValue(
        preview,
        'box-shadow',
        shadowComputed,
        'boxShadow',
        inspectTokenFilters.depth,
      );
      if (resolved) pushUnique(items, makeItem('box-shadow', resolved));
    }
  }

  const opacityDeclared = pickDeclaredCssValue(declared, ['opacity']);
  if (opacityDeclared && opacityDeclared !== '1') {
    pushUnique(items, makeItem('opacity', opacityDeclared));
  } else if (!isAnyCssPropertyDeclared(declared, ['opacity']) && style.opacity && style.opacity !== '1') {
    pushUnique(items, makeItem('opacity', style.opacity));
  }

  for (const property of ['filter', 'mix-blend-mode'] as const) {
    const value = pickDeclaredCssValue(declared, [property]);
    if (!value || value === 'none' || value === 'normal') continue;
    pushUnique(items, makeItem(property, value));
  }

  const backdrop = buildBackdropFilterStyleItem(preview, style, declared);
  if (backdrop) pushUnique(items, backdrop);

  items.sort((left, right) => propertyRank(left.label, STYLE_ORDER) - propertyRank(right.label, STYLE_ORDER));
  return items;
}

export type BuildDeclaredInspectCodeOptions = {
  /** ToolBar / Paginer / Skid 内点不到 frosted 条时，background / backdrop-filter 从此层补全。 */
  frostedChromeStyleSource?: Element | null;
  /** DataList 列 min-width 来自 EgDataListColumn prop，与「适配」区一致。 */
  dataListColumnMinWidth?: string | null;
};

/** Dev Mode：布局 / 样式代码（declared 优先 + computed 非默认 + token 解析）。 */
export function buildDeclaredInspectCode(
  element: Element,
  preview: Element,
  options: BuildDeclaredInspectCodeOptions = {},
): { layout: InspectPropertyItem[]; styleItems: InspectPropertyItem[] } {
  const declared = collectDeclaredCssValues(element, { excludeDevInspectRules: true });
  const style = getComputedStyle(element);
  const ctx = resolveLayoutContext(element, style);

  let styleItems = buildStyleItems(preview, style, declared);
  const frostedSource = options.frostedChromeStyleSource;
  if (frostedSource && frostedSource !== element) {
    const chromeItems = buildFrostedChromeSurfaceStyleItems(preview, frostedSource);
    styleItems = mergeFrostedChromeSurfaceStyles(styleItems, chromeItems);
  }

  return {
    layout: buildLayoutItems(element, preview, style, declared, ctx, {
      dataListColumnMinWidth: options.dataListColumnMinWidth,
    }),
    styleItems,
  };
}
