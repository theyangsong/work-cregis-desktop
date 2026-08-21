/** CSS 选择器拆分与特异性（用于 declared 样式级联合并）。 */

const INLINE_STYLE_SPECIFICITY = 2_000_000;

export function splitCssSelectors(selectorText: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of selectorText) {
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    } else if (char === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function computeSelectorSpecificity(selector: string): number {
  const withoutPseudoElements = selector.replace(/::[\w-]+/g, '');
  const idCount = (withoutPseudoElements.match(/#[\w-]+/g) ?? []).length;
  const classCount = (withoutPseudoElements.match(/\.[\w-]+/g) ?? []).length;
  const attrCount = (withoutPseudoElements.match(/\[[^\]]+\]/g) ?? []).length;
  const pseudoClassCount = (withoutPseudoElements.match(/:(?!:)[\w-]+(?:\([^)]*\))?/g) ?? []).length;

  const typeSelectorSource = withoutPseudoElements
    .replace(/#[\w-]+/g, ' ')
    .replace(/\.[\w-]+/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/:(?!:)[\w-]+(?:\([^)]*\))?/g, ' ');

  const typeCount = (typeSelectorSource.match(/(?:^|[\s>+~])([a-z][\w-]*)/gi) ?? []).length;

  return idCount * 1_000_000 + (classCount + attrCount + pseudoClassCount) * 1_000 + typeCount;
}

export function maxMatchingSelectorSpecificity(selectorText: string, element: Element): number | null {
  let max: number | null = null;

  for (const selector of splitCssSelectors(selectorText)) {
    try {
      if (!element.matches(selector)) continue;
      const specificity = computeSelectorSpecificity(selector);
      max = max === null ? specificity : Math.max(max, specificity);
    } catch {
      // 无效 selector
    }
  }

  return max;
}

export function inlineStyleSpecificity(): number {
  return INLINE_STYLE_SPECIFICITY;
}
