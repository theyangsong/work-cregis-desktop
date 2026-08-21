import {
  getComputedDesignTokenValue,
  normalizeStyleValueForCompare,
} from './resolveDesignToken';
import { TYPOGRAPHY_TEXT_STYLE_ROLES, type TypographyTextStyleRole } from './typographyTextStyles';

export type EffectiveTypographyMetrics = {
  fontSizePx: number;
  fontWeight: string;
  lineHeightPx: number;
};

export const BAR_TYPOGRAPHY_ROLE =
  TYPOGRAPHY_TEXT_STYLE_ROLES.find((role) => role.label === 'Bar') ?? TYPOGRAPHY_TEXT_STYLE_ROLES.at(-1)!;

const BAR_SUBPIXEL_HOST_CLASS_HINTS = [
  'moduleLabel',
  'moduleLabelPaint',
  'moduleLabelSizer',
  'labelWrap',
  'labelPaint',
  'labelSizer',
] as const;

const METRIC_EPSILON_PX = 0.61;

function parseTransformScale(transform: string): number | null {
  if (!transform || transform === 'none') return null;

  const matrixMatch = transform.match(/^matrix\(([^)]+)\)$/);
  if (matrixMatch) {
    const parts = matrixMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (parts.length >= 4 && parts[0] > 0 && parts[1] === 0 && parts[2] === 0) {
      return parts[0];
    }
  }

  const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
  if (scaleMatch) {
    const scale = Number.parseFloat(scaleMatch[1]);
    return Number.isFinite(scale) && scale > 0 ? scale : null;
  }

  return null;
}

/** 视觉字号：Bar 2× + scale(0.5) / zoom(0.5) 等子像素技术处理后的有效值。 */
export function resolveEffectiveTypographyMetrics(style: CSSStyleDeclaration): EffectiveTypographyMetrics {
  const transformScale = parseTransformScale(style.transform) ?? 1;
  const zoomRaw = style.zoom.trim();
  const zoom = zoomRaw && zoomRaw !== 'normal' ? Number.parseFloat(zoomRaw) : 1;
  const zoomFactor = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const factor = transformScale * zoomFactor;

  const fontSizePx = Number.parseFloat(style.fontSize) * factor;
  const lineHeightPx = Number.parseFloat(style.lineHeight) * factor;

  return {
    fontSizePx,
    fontWeight: style.fontWeight,
    lineHeightPx,
  };
}

function isNear(value: number, target: number): boolean {
  return Number.isFinite(value) && Number.isFinite(target) && Math.abs(value - target) < METRIC_EPSILON_PX;
}

function roleMatchesEffectiveMetrics(
  preview: Element,
  role: TypographyTextStyleRole,
  metrics: EffectiveTypographyMetrics,
): boolean {
  const roleSizePx = Number.parseFloat(getComputedDesignTokenValue(preview, role.sizeToken, 'fontSize'));
  const roleLineHeightPx = Number.parseFloat(
    getComputedDesignTokenValue(preview, role.lineHeightToken, 'lineHeight'),
  );
  const roleWeight = getComputedDesignTokenValue(preview, role.weightToken, 'fontWeight');
  const elementWeight = normalizeStyleValueForCompare(preview, metrics.fontWeight, 'fontWeight');

  return (
    isNear(metrics.fontSizePx, roleSizePx)
    && isNear(metrics.lineHeightPx, roleLineHeightPx)
    && roleWeight === elementWeight
  );
}

export function isBarSubpixelTextHost(element: Element): boolean {
  if (element.classList.contains('eds-bar-text-subpixel')) return true;

  for (const className of element.classList) {
    if (BAR_SUBPIXEL_HOST_CLASS_HINTS.some((hint) => className.includes(hint))) {
      return true;
    }
  }

  const host = element.closest('[class*="moduleLabel"], [class*="labelWrap"]');
  return host instanceof Element;
}

export function isBarSubpixelTextElement(element: Element, style: CSSStyleDeclaration): boolean {
  return isBarSubpixelTextHost(element) || parseTransformScale(style.transform) === 0.5;
}

export function resolveBarTypographyMetrics(preview: Element): EffectiveTypographyMetrics {
  const role = BAR_TYPOGRAPHY_ROLE;
  return {
    fontSizePx: Number.parseFloat(getComputedDesignTokenValue(preview, role.sizeToken, 'fontSize')),
    fontWeight: getComputedDesignTokenValue(preview, role.weightToken, 'fontWeight'),
    lineHeightPx: Number.parseFloat(
      getComputedDesignTokenValue(preview, role.lineHeightToken, 'lineHeight'),
    ),
  };
}

export function resolveTypographyMetricsForRole(
  preview: Element,
  role: TypographyTextStyleRole,
  style: CSSStyleDeclaration,
): EffectiveTypographyMetrics {
  if (role.label === 'Bar') {
    return resolveBarTypographyMetrics(preview);
  }
  return resolveEffectiveTypographyMetrics(style);
}

export function matchTypographyRole(
  preview: Element,
  element: Element,
  style: CSSStyleDeclaration,
): TypographyTextStyleRole | null {
  if (isBarSubpixelTextHost(element)) {
    return BAR_TYPOGRAPHY_ROLE;
  }

  const metrics = resolveEffectiveTypographyMetrics(style);
  const candidates = TYPOGRAPHY_TEXT_STYLE_ROLES.filter((role) =>
    roleMatchesEffectiveMetrics(preview, role, metrics),
  );

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  if (isBarSubpixelTextElement(element, style)) {
    const bar = candidates.find((role) => role.label === 'Bar');
    if (bar) return bar;
  }

  const strongCandidates = candidates.filter((role) => role.label.endsWith(' Strong'));
  if (strongCandidates.length === 1) return strongCandidates[0];

  return candidates[0];
}

export function resolveTypographyLineHeightComment(metrics: EffectiveTypographyMetrics): string | null {
  if (!Number.isFinite(metrics.fontSizePx) || !Number.isFinite(metrics.lineHeightPx) || metrics.fontSizePx <= 0) {
    return null;
  }
  const percent = Math.round((metrics.lineHeightPx / metrics.fontSizePx) * 1000) / 10;
  return `${percent}%`;
}
