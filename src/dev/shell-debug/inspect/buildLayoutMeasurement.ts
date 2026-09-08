export type InspectBoxRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type InspectPaddingZone = {
  side: 'top' | 'right' | 'bottom' | 'left';
  rect: InspectBoxRect;
  displayLabel: string;
};

export type InspectChildOutline = {
  rect: InspectBoxRect;
};

export type InspectChildGap = {
  rect: InspectBoxRect;
  displayLabel: string;
};

export type InspectEdgeMeasure = {
  axis: 'horizontal' | 'vertical';
  lineRect: InspectBoxRect;
  labelRect: InspectBoxRect;
  displayLabel: string;
};

export type InspectLayoutChromeModel = {
  selectionRect: InspectBoxRect;
  paddingZones: InspectPaddingZone[];
  childOutlines: InspectChildOutline[];
  childGaps: InspectChildGap[];
};

function px(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundPx(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatDistanceLabel(_preview: Element, distancePx: number): string {
  return `${roundPx(distancePx)}px`;
}

function toBoxRect(rect: DOMRect): InspectBoxRect {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function hasVisibleRect(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0.5 && rect.height > 0.5;
}

function buildPaddingZone(
  preview: Element,
  side: InspectPaddingZone['side'],
  hostRect: DOMRect,
  style: CSSStyleDeclaration,
): InspectPaddingZone | null {
  const raw =
    side === 'top'
      ? style.paddingTop
      : side === 'right'
        ? style.paddingRight
        : side === 'bottom'
          ? style.paddingBottom
          : style.paddingLeft;
  const thickness = px(raw);
  if (thickness <= 0.5) return null;

  const label = formatDistanceLabel(preview, thickness);
  let rect: InspectBoxRect;

  switch (side) {
    case 'top':
      rect = {
        top: hostRect.top,
        left: hostRect.left,
        width: hostRect.width,
        height: thickness,
      };
      break;
    case 'bottom':
      rect = {
        top: hostRect.bottom - thickness,
        left: hostRect.left,
        width: hostRect.width,
        height: thickness,
      };
      break;
    case 'left':
      rect = {
        top: hostRect.top,
        left: hostRect.left,
        width: thickness,
        height: hostRect.height,
      };
      break;
    case 'right':
      rect = {
        top: hostRect.top,
        left: hostRect.right - thickness,
        width: thickness,
        height: hostRect.height,
      };
      break;
  }

  return { side, rect, displayLabel: label };
}

function overlapOnAxis(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

function buildChildGaps(
  preview: Element,
  parentRect: DOMRect,
  children: HTMLElement[],
): InspectChildGap[] {
  const gaps: InspectChildGap[] = [];
  const sorted = [...children]
    .map((child) => ({ child, rect: child.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0.5 && rect.height > 0.5)
    .sort((left, right) => {
      if (Math.abs(left.rect.top - right.rect.top) > 1) {
        return left.rect.top - right.rect.top;
      }
      return left.rect.left - right.rect.left;
    });

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    const verticalOverlap = overlapOnAxis(
      current.rect.left,
      current.rect.right,
      next.rect.left,
      next.rect.right,
    );
    const horizontalOverlap = overlapOnAxis(
      current.rect.top,
      current.rect.bottom,
      next.rect.top,
      next.rect.bottom,
    );

    if (next.rect.top >= current.rect.bottom - 0.5 && verticalOverlap > 0.5) {
      const distance = next.rect.top - current.rect.bottom;
      if (distance <= 0.5) continue;
      const overlapLeft = Math.max(current.rect.left, next.rect.left);
      const overlapRight = Math.min(current.rect.right, next.rect.right);
      gaps.push({
        rect: {
          top: current.rect.bottom,
          left: overlapLeft,
          width: Math.max(overlapRight - overlapLeft, 1),
          height: distance,
        },
        displayLabel: formatDistanceLabel(preview, distance),
      });
      continue;
    }

    if (next.rect.left >= current.rect.right - 0.5 && horizontalOverlap > 0.5) {
      const distance = next.rect.left - current.rect.right;
      if (distance <= 0.5) continue;
      const overlapTop = Math.max(current.rect.top, next.rect.top);
      const overlapBottom = Math.min(current.rect.bottom, next.rect.bottom);
      gaps.push({
        rect: {
          top: overlapTop,
          left: current.rect.right,
          width: distance,
          height: Math.max(overlapBottom - overlapTop, 1),
        },
        displayLabel: formatDistanceLabel(preview, distance),
      });
    }
  }

  return gaps;
}

export function buildLayoutChromeModel(element: Element, preview: Element): InspectLayoutChromeModel {
  const hostRect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const paddingZones = (['top', 'right', 'bottom', 'left'] as const)
    .map((side) => buildPaddingZone(preview, side, hostRect, style))
    .filter((zone): zone is InspectPaddingZone => zone != null);

  const childOutlines = [...element.children]
    .filter(hasVisibleRect)
    .map((child) => ({ rect: toBoxRect(child.getBoundingClientRect()) }));

  const childElements = [...element.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement && hasVisibleRect(child),
  );

  return {
    selectionRect: toBoxRect(hostRect),
    paddingZones,
    childOutlines,
    childGaps: buildChildGaps(preview, hostRect, childElements),
  };
}

export function buildHoverMeasureModel(
  pinnedRect: DOMRect,
  targetRect: DOMRect,
  preview: Element,
): InspectEdgeMeasure[] {
  const measures: InspectEdgeMeasure[] = [];
  const gapBelow = targetRect.top - pinnedRect.bottom;
  const gapAbove = pinnedRect.top - targetRect.bottom;
  const gapRight = targetRect.left - pinnedRect.right;
  const gapLeft = pinnedRect.left - targetRect.right;

  if (gapBelow > 0.5) {
    measures.push({
      axis: 'vertical',
      lineRect: {
        top: pinnedRect.bottom,
        left: overlapCenterOnAxis(pinnedRect.left, pinnedRect.right, targetRect.left, targetRect.right) - 0.5,
        width: 1,
        height: Math.max(gapBelow, 1),
      },
      labelRect: { top: 0, left: 0, width: 0, height: 0 },
      displayLabel: formatDistanceLabel(preview, gapBelow),
    });
  } else if (gapAbove > 0.5) {
    measures.push({
      axis: 'vertical',
      lineRect: {
        top: targetRect.bottom,
        left: overlapCenterOnAxis(pinnedRect.left, pinnedRect.right, targetRect.left, targetRect.right) - 0.5,
        width: 1,
        height: Math.max(gapAbove, 1),
      },
      labelRect: { top: 0, left: 0, width: 0, height: 0 },
      displayLabel: formatDistanceLabel(preview, gapAbove),
    });
  }

  if (gapRight > 0.5) {
    measures.push({
      axis: 'horizontal',
      lineRect: {
        top: overlapCenterOnAxis(pinnedRect.top, pinnedRect.bottom, targetRect.top, targetRect.bottom) - 0.5,
        left: pinnedRect.right,
        width: Math.max(gapRight, 1),
        height: 1,
      },
      labelRect: { top: 0, left: 0, width: 0, height: 0 },
      displayLabel: formatDistanceLabel(preview, gapRight),
    });
  } else if (gapLeft > 0.5) {
    measures.push({
      axis: 'horizontal',
      lineRect: {
        top: overlapCenterOnAxis(pinnedRect.top, pinnedRect.bottom, targetRect.top, targetRect.bottom) - 0.5,
        left: targetRect.right,
        width: Math.max(gapLeft, 1),
        height: 1,
      },
      labelRect: { top: 0, left: 0, width: 0, height: 0 },
      displayLabel: formatDistanceLabel(preview, gapLeft),
    });
  }

  return resolveHoverMeasureLabels(measures);
}

/** 两区间水平/垂直重叠段的中点；无重叠时取四端点均值。 */
function overlapCenterOnAxis(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  if (end - start > 0.5) return (start + end) / 2;
  return (aStart + aEnd + bStart + bEnd) / 4;
}

const VERTICAL_LABEL_DOWN_NUDGE_PX = 8;
const HORIZONTAL_LABEL_UP_OFFSET_PX = 16;
const HORIZONTAL_LABEL_FROM_LEFT_PX = 2;

function measureLineCenter(rect: InspectBoxRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/** 双轴比对时沿各自测量线垂直错开标签，避免 L 形拐角处叠字。 */
export function resolveHoverMeasureLabels(measures: InspectEdgeMeasure[]): InspectEdgeMeasure[] {
  const vertical = measures.find((measure) => measure.axis === 'vertical');
  const horizontal = measures.find((measure) => measure.axis === 'horizontal');
  const hasBoth = vertical != null && horizontal != null;

  if (!hasBoth) {
    return measures.map((measure) => {
      const center = measureLineCenter(measure.lineRect);
      return {
        ...measure,
        labelRect: {
          top: center.y,
          left: center.x,
          width: 0,
          height: 0,
        },
      };
    });
  }

  return measures.map((measure) => {
    const center = measureLineCenter(measure.lineRect);

    if (measure.axis === 'vertical') {
      return {
        ...measure,
        labelRect: {
          top: center.y + VERTICAL_LABEL_DOWN_NUDGE_PX,
          left: center.x,
          width: 0,
          height: 0,
        },
      };
    }

    const lineRect = measure.lineRect;
    const lineCenter = measureLineCenter(lineRect);
    return {
      ...measure,
      labelRect: {
        top: lineCenter.y - HORIZONTAL_LABEL_UP_OFFSET_PX,
        left: lineRect.left + HORIZONTAL_LABEL_FROM_LEFT_PX,
        width: 0,
        height: 0,
      },
    };
  });
}

export function boxRectStyle(rect: InspectBoxRect): Record<string, string> {
  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
}
