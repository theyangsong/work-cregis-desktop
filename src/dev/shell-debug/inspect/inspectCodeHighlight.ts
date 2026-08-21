import { TYPOGRAPHY_TEXT_STYLE_ROLES } from './typographyTextStyles';

export type InspectCodeToken = {
  kind:
    | 'plain'
    | 'prop'
    | 'punct'
    | 'value'
    | 'keyword'
    | 'function'
    | 'variable'
    | 'tag'
    | 'attr'
    | 'string'
    | 'comment';
  text: string;
};

const TYPOGRAPHY_STYLE_LABELS = new Set(
  TYPOGRAPHY_TEXT_STYLE_ROLES.map((role) => role.label),
);

const CSS_LINE = /^([\w-]+)(\s*:\s*)(.+?)(;?\s*)$/;

const CSS_KEYWORDS = new Set([
  'absolute',
  'auto',
  'baseline',
  'block',
  'center',
  'column',
  'column-reverse',
  'contents',
  'dashed',
  'dotted',
  'end',
  'fixed',
  'flex',
  'flex-end',
  'flex-start',
  'grid',
  'hidden',
  'inherit',
  'initial',
  'inline',
  'inline-block',
  'inline-flex',
  'inline-grid',
  'none',
  'normal',
  'nowrap',
  'relative',
  'row',
  'row-reverse',
  'scroll',
  'self-end',
  'self-start',
  'solid',
  'space-around',
  'space-between',
  'space-evenly',
  'start',
  'static',
  'sticky',
  'stretch',
  'transparent',
  'unset',
  'visible',
  'wrap',
  'wrap-reverse',
]);

export function splitInspectCodeLines(content: string): string[] {
  return content.split('\n').filter((line) => line.length > 0);
}

function pushVarTokenReference(tokens: InspectCodeToken[], tokenName: string) {
  tokens.push({ kind: 'function', text: 'var' });
  tokens.push({ kind: 'punct', text: '(' });
  tokens.push({ kind: 'variable', text: tokenName });
  tokens.push({ kind: 'punct', text: ')' });
}

function splitTrailingCssComment(text: string): { body: string; comment: string | null } {
  const index = text.indexOf('/*');
  if (index < 0) return { body: text, comment: null };

  const commentPart = text.slice(index);
  const endMatch = commentPart.match(/^\/\*[\s\S]*?\*\//);
  if (!endMatch) return { body: text, comment: null };

  return {
    body: text.slice(0, index).trimEnd(),
    comment: text.slice(index, index + endMatch[0].length),
  };
}

function tokenizeCssValue(value: string): InspectCodeToken[] {
  const tokens: InspectCodeToken[] = [];
  let rest = value;

  while (rest.length > 0) {
    const inlineComment = splitTrailingCssComment(rest);
    if (inlineComment.comment && inlineComment.body.length < rest.length) {
      if (inlineComment.body.length > 0) {
        tokens.push(...tokenizeCssValue(inlineComment.body));
      }
      tokens.push({ kind: 'comment', text: inlineComment.comment });
      rest = rest.slice(inlineComment.body.length + inlineComment.comment.length);
      continue;
    }

    const varMatch = rest.match(/^var\(\s*(--[\w-]+)\s*\)/);
    if (varMatch) {
      pushVarTokenReference(tokens, varMatch[1]);
      rest = rest.slice(varMatch[0].length);
      continue;
    }

    const cssVarMatch = rest.match(/^(--[\w-]+)/);
    if (cssVarMatch) {
      pushVarTokenReference(tokens, cssVarMatch[1]);
      rest = rest.slice(cssVarMatch[0].length);
      continue;
    }

    const wordMatch = rest.match(/^([a-zA-Z-]+)/);
    if (wordMatch) {
      const word = wordMatch[1];
      tokens.push({
        kind: CSS_KEYWORDS.has(word) ? 'keyword' : 'value',
        text: word,
      });
      rest = rest.slice(word.length);
      continue;
    }

    const numberMatch = rest.match(/^(\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|fr)?)/);
    if (numberMatch) {
      tokens.push({ kind: 'value', text: numberMatch[1] });
      rest = rest.slice(numberMatch[0].length);
      continue;
    }

    const punctMatch = rest.match(/^([(),;\s]+)/);
    if (punctMatch) {
      tokens.push({ kind: 'punct', text: punctMatch[1] });
      rest = rest.slice(punctMatch[0].length);
      continue;
    }

    tokens.push({ kind: 'plain', text: rest[0] });
    rest = rest.slice(1);
  }

  return tokens;
}

export function tokenizeCssLine(line: string): InspectCodeToken[] {
  const trailingComment = splitTrailingCssComment(line.trimEnd());
  const source = trailingComment.body;
  const comment = trailingComment.comment;

  const match = source.match(CSS_LINE);
  if (!match) {
    return comment
      ? [
          { kind: 'plain', text: source },
          { kind: 'comment', text: comment },
        ]
      : [{ kind: 'plain', text: line }];
  }

  const [, prop, colon, rawValue, tail] = match;
  const valueParts = splitTrailingCssComment(rawValue);
  const value = valueParts.body;
  const inlineComment = valueParts.comment;

  return [
    { kind: 'prop', text: prop },
    { kind: 'punct', text: colon },
    ...tokenizeCssValue(value),
    ...(tail ? [{ kind: 'punct', text: tail } as InspectCodeToken] : []),
    ...(inlineComment ? [{ kind: 'comment', text: inlineComment } as InspectCodeToken] : []),
    ...(comment ? [{ kind: 'comment', text: comment } as InspectCodeToken] : []),
  ];
}

export function tokenizeSvgLine(line: string): InspectCodeToken[] {
  const trimmed = line.trim();
  if (!trimmed) return [{ kind: 'plain', text: line }];

  const tokens: InspectCodeToken[] = [];
  let rest = line;

  const patterns: Array<{ regex: RegExp; kind: InspectCodeToken['kind'] }> = [
    { regex: /<\/?[\w:-]+/, kind: 'tag' },
    { regex: /[\w:-]+(?==)/, kind: 'attr' },
    { regex: /"[^"]*"/, kind: 'string' },
    { regex: /'[^']*'/, kind: 'string' },
    { regex: /=\s*/, kind: 'punct' },
    { regex: /\/?>/, kind: 'tag' },
  ];

  while (rest.length > 0) {
    let earliest: { index: number; length: number; kind: InspectCodeToken['kind']; text: string } | null =
      null;

    for (const pattern of patterns) {
      const match = rest.match(pattern.regex);
      if (!match || match.index == null) continue;
      if (!earliest || match.index < earliest.index) {
        earliest = {
          index: match.index,
          length: match[0].length,
          kind: pattern.kind,
          text: match[0],
        };
      }
    }

    if (!earliest) {
      tokens.push({ kind: 'plain', text: rest });
      break;
    }

    if (earliest.index > 0) {
      tokens.push({ kind: 'plain', text: rest.slice(0, earliest.index) });
    }
    tokens.push({ kind: earliest.kind, text: earliest.text });
    rest = rest.slice(earliest.index + earliest.length);
  }

  return tokens.length > 0 ? tokens : [{ kind: 'plain', text: line }];
}

export function tokenizeCodeLine(line: string, mode: 'css' | 'svg'): InspectCodeToken[] {
  return mode === 'css' ? tokenizeCssLine(line) : tokenizeSvgLine(line);
}

/** Dev Inspect 属性值 / 用法片段：按内容选择 CSS 或 markup 高亮。 */
export function tokenizeInspectValue(value: string): InspectCodeToken[] {
  const trimmed = value.trim();
  if (!trimmed) return [{ kind: 'plain', text: value }];

  if (trimmed.startsWith('<')) {
    return tokenizeSvgLine(trimmed);
  }

  const cssLine = trimmed.includes(':') && !trimmed.endsWith(';') ? `${trimmed};` : trimmed;
  if (CSS_LINE.test(cssLine)) {
    return tokenizeCssLine(cssLine);
  }

  if (trimmed.startsWith('var(')) {
    return tokenizeCssValue(trimmed);
  }

  return [{ kind: 'string', text: trimmed }];
}

export function resolveCodeLineMode(sectionTitle: string): 'css' | 'svg' {
  return sectionTitle === 'SVG' ? 'svg' : 'css';
}

const CSS_VALUE_LITERAL =
  /^\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|fr|ms|s|deg)?$/;
const CSS_COLOR_FUNCTION = /^(?:rgb|rgba|hsl|hsla|color)\(/i;
const CSS_HEX_COLOR = /^#[\da-fA-F]{3,8}$/;
const CSS_CLASS_CHAIN = /^\.[\w-]+(?:\.[\w-]+)*$/;
const CSS_VAR_REFERENCE = /^var\(\s*--[\w-]+\s*\)$/;
const CSS_TOKEN_NAME = /^--[\w-]+$/;
const CSS_VAR_EMBEDDED = /var\(\s*--[\w-]+\s*\)/;
const MOTION_SEMANTIC_CLASS =
  /^\.motion-(?:ease|flotation|layout|deform|page|layout-deform|none)(?:\.(?:is-(?:hover|focus|asym|hover-enter-only|active)))*$/;
const EDS_DOM_CLASS_VALUE = /^(?:eds-[\w-]+(?:\s+eds-[\w-]+)*)$/;

function isMotionSemanticClassChain(value: string): boolean {
  return MOTION_SEMANTIC_CLASS.test(value.trim());
}

function isEdsDomClassValue(value: string): boolean {
  return EDS_DOM_CLASS_VALUE.test(value.trim());
}

function referencesDesignToken(value: string, context?: InspectPropertyValueContext): boolean {
  const trimmed = value.trim();
  if (context?.token) return true;
  if (isMotionSemanticClassChain(trimmed)) return true;
  if (isEdsDomClassValue(trimmed)) return true;
  if (trimmed.startsWith('var(') || CSS_VAR_REFERENCE.test(trimmed)) return true;
  if (CSS_TOKEN_NAME.test(trimmed)) return true;
  if (CSS_VAR_EMBEDDED.test(trimmed)) return true;
  if (isTypographyStyleLabel(trimmed)) return true;
  return false;
}

function isHardcodedCodeValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('<')) return true;
  if (CSS_CLASS_CHAIN.test(trimmed) && !isMotionSemanticClassChain(trimmed)) return true;
  if (CSS_COLOR_FUNCTION.test(trimmed)) return true;
  if (CSS_HEX_COLOR.test(trimmed)) return true;
  if (CSS_KEYWORDS.has(trimmed)) return true;
  if (CSS_VALUE_LITERAL.test(trimmed)) return true;

  const cssLine = trimmed.includes(':') && !trimmed.endsWith(';') ? `${trimmed};` : trimmed;
  return CSS_LINE.test(cssLine);
}

export type InspectPropertyValueContext = {
  label?: string;
  token?: string | null;
};

export type InspectPropertyValueTone = 'plain' | 'token' | 'code';

function isTypographyStyleLabel(value: string): boolean {
  return TYPOGRAPHY_STYLE_LABELS.has(value);
}

/** 属性值展示色调：plain 普通文案 / token 变量引用 / code 硬编码或非 token 代码值。 */
export function resolveInspectPropertyValueTone(
  value: string,
  context?: InspectPropertyValueContext,
): InspectPropertyValueTone {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '—' || trimmed === '无') return 'plain';
  if (trimmed === '是' || trimmed === '否') return 'plain';

  /** 祖先组件名走属性面板 token 黄色系，与 EDS 类名 / motion 等同列。 */
  if (context?.label === '祖先') return 'token';

  if (referencesDesignToken(trimmed, context)) return 'token';
  if (isHardcodedCodeValue(trimmed)) return 'code';
  return 'plain';
}

export function shouldHighlightInspectPropertyValue(
  value: string,
  context?: InspectPropertyValueContext,
): boolean {
  return resolveInspectPropertyValueTone(value, context) !== 'plain';
}

function tokenizeCssClassChain(value: string): InspectCodeToken[] {
  const tokens: InspectCodeToken[] = [];
  let rest = value;

  while (rest.length > 0) {
    const segment = rest.match(/^(\.)([\w-]+)/);
    if (segment) {
      tokens.push({ kind: 'punct', text: segment[1] });
      tokens.push({ kind: 'value', text: segment[2] });
      rest = rest.slice(segment[0].length);
      continue;
    }

    tokens.push({ kind: 'plain', text: rest[0] });
    rest = rest.slice(1);
  }

  return tokens;
}

/** 属性面板 token / 样式名等高亮（黄色系）。 */
export function tokenizeInspectPropertyTokenValue(value: string): InspectCodeToken[] {
  const trimmed = value.trim();

  if (isTypographyStyleLabel(trimmed)) {
    return [{ kind: 'string', text: trimmed }];
  }

  if (isMotionSemanticClassChain(trimmed)) {
    return [{ kind: 'string', text: trimmed }];
  }

  if (isEdsDomClassValue(trimmed)) {
    return [{ kind: 'string', text: trimmed }];
  }

  if (trimmed.startsWith('var(') || CSS_VAR_REFERENCE.test(trimmed) || CSS_VAR_EMBEDDED.test(trimmed)) {
    return tokenizeCssValue(trimmed);
  }

  if (CSS_TOKEN_NAME.test(trimmed)) {
    return [
      { kind: 'function', text: 'var' },
      { kind: 'punct', text: '(' },
      { kind: 'variable', text: trimmed },
      { kind: 'punct', text: ')' },
    ];
  }

  return [{ kind: 'string', text: trimmed }];
}

/** 属性面板硬编码 / 代码值高亮（品红系）。 */
export function tokenizeInspectPropertyCodeValue(value: string): InspectCodeToken[] {
  const trimmed = value.trim();
  if (resolveInspectPropertyValueTone(trimmed) !== 'code') {
    return [{ kind: 'plain', text: value }];
  }

  if (trimmed.startsWith('<')) {
    return tokenizeSvgLine(trimmed);
  }

  if (CSS_CLASS_CHAIN.test(trimmed)) {
    return tokenizeCssClassChain(trimmed);
  }

  if (CSS_KEYWORDS.has(trimmed)) {
    return [{ kind: 'keyword', text: trimmed }];
  }

  if (CSS_VALUE_LITERAL.test(trimmed)) {
    return [{ kind: 'value', text: trimmed }];
  }

  const cssLine = trimmed.includes(':') && !trimmed.endsWith(';') ? `${trimmed};` : trimmed;
  if (CSS_LINE.test(cssLine)) {
    return tokenizeCssLine(cssLine);
  }

  if (CSS_COLOR_FUNCTION.test(trimmed) || CSS_HEX_COLOR.test(trimmed)) {
    return tokenizeCssValue(trimmed);
  }

  return tokenizeCssValue(trimmed);
}

/** @deprecated Use tokenizeInspectPropertyCodeValue / tokenizeInspectPropertyTokenValue. */
export function tokenizeInspectPropertyValue(value: string): InspectCodeToken[] {
  return tokenizeInspectPropertyCodeValue(value);
}
