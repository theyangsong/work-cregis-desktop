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
    | 'string';
  text: string;
};

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

function tokenizeCssValue(value: string): InspectCodeToken[] {
  const tokens: InspectCodeToken[] = [];
  let rest = value;

  while (rest.length > 0) {
    const varMatch = rest.match(/^var\(\s*(--[\w-]+)\s*\)/);
    if (varMatch) {
      tokens.push({ kind: 'function', text: 'var' });
      tokens.push({ kind: 'punct', text: '(' });
      tokens.push({ kind: 'variable', text: varMatch[1] });
      tokens.push({ kind: 'punct', text: ')' });
      rest = rest.slice(varMatch[0].length);
      continue;
    }

    const cssVarMatch = rest.match(/^(--[\w-]+)/);
    if (cssVarMatch) {
      tokens.push({ kind: 'variable', text: cssVarMatch[1] });
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
  const match = line.match(CSS_LINE);
  if (!match) return [{ kind: 'plain', text: line }];

  const [, prop, colon, value, tail] = match;
  return [
    { kind: 'prop', text: prop },
    { kind: 'punct', text: colon },
    ...tokenizeCssValue(value),
    ...(tail ? [{ kind: 'punct', text: tail } as InspectCodeToken] : []),
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
    { regex: /\/?>/, kind: 'punct' },
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

export function resolveCodeLineMode(sectionTitle: string): 'css' | 'svg' {
  return sectionTitle === 'SVG' ? 'svg' : 'css';
}
