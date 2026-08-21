const TOKEN_PREFIXES = [
  '--spacing-',
  '--radius-',
  '--text-',
  '--material-',
  '--event-',
  '--status-',
  '--eds-',
  '--icon-',
  '--avatar-',
  '--graphic-',
  '--weight-',
  '--box-',
  '--effect-',
  '--motion-',
  '--stroke-',
  '--scale-',
  '--blur-',
  '--depth-',
  '--corner-',
] as const;

/** Inspect 面板：出现 computed 硬编码值表示业务侧未用语义 token。 */
export const INSPECT_NON_TOKEN_COMMENT = '非 token';

export type TokenProbeStyleProperty =
  | 'width'
  | 'height'
  | 'color'
  | 'backgroundColor'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'borderRadius'
  | 'gap'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'backdropFilter'
  | 'boxShadow'
  | 'transition';

export const inspectTokenFilters = {
  spacing: (name: string) => name.startsWith('--spacing-'),
  radius: (name: string) => name.startsWith('--radius-'),
  stroke: (name: string) => name.startsWith('--stroke-'),
  textColor: (name: string) => name.startsWith('--text-'),
  material: (name: string) =>
    name.startsWith('--material-') || name.startsWith('--box-') || name.startsWith('--event-'),
  typographySize: (name: string) => name.startsWith('--eds-') && name.endsWith('-size'),
  typographyWeight: (name: string) =>
    (name.startsWith('--eds-') && name.endsWith('-weight')) || name.startsWith('--weight-'),
  typographyLineHeight: (name: string) => name.startsWith('--eds-') && name.endsWith('-line-height'),
  fontFamily: (name: string) => name.startsWith('--eds-family-'),
  icon: (name: string) => name.startsWith('--icon-'),
  avatar: (name: string) => name.startsWith('--avatar-'),
  graphic: (name: string) =>
    name.startsWith('--icon-') || name.startsWith('--avatar-') || name.startsWith('--graphic-'),
  scale: (name: string) => name.startsWith('--scale-'),
  motion: (name: string) => name.startsWith('--motion-recipe-'),
  motionRecipe: (name: string) => name.startsWith('--motion-recipe-'),
  blur: (name: string) => name.startsWith('--blur-') || name.startsWith('--eds-blur-'),
  depth: (name: string) => name.startsWith('--depth-'),
  cornerSmoothing: (name: string) => name.startsWith('--corner-'),
} as const;

export type InspectTokenResolveResult = {
  token: string | null;
  tokenVar: string | null;
  raw: string;
  isToken: boolean;
};

let cachedRoot: Element | null = null;
let cachedTokenNames: string[] | null = null;
const computedTokenCache = new Map<string, string>();

function resolveTokenRoot(preview: Element): Element {
  return preview.querySelector('.desktopTokens') ?? preview;
}

export function listDesignTokenNames(preview: Element): string[] {
  const root = resolveTokenRoot(preview);
  if (cachedRoot === root && cachedTokenNames) {
    return cachedTokenNames;
  }

  const style = getComputedStyle(root);
  const names: string[] = [];
  for (let index = 0; index < style.length; index += 1) {
    const name = style[index];
    if (!name.startsWith('--')) continue;
    if (!TOKEN_PREFIXES.some((prefix) => name.startsWith(prefix))) continue;
    names.push(name);
  }

  cachedRoot = root;
  cachedTokenNames = names.sort((left, right) => left.localeCompare(right));
  computedTokenCache.clear();
  return cachedTokenNames;
}

function normalizeCssValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeComparableStyleValue(
  preview: Element,
  rawValue: string,
  styleProperty: TokenProbeStyleProperty,
): string {
  const normalized = normalizeCssValue(rawValue);
  if (!normalized || normalized === 'none' || normalized === 'normal') {
    return normalized;
  }

  if (styleProperty === 'width') {
    return normalized;
  }

  const root = resolveTokenRoot(preview);
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.top = '0';
  probe.style.left = '0';
  probe.style[styleProperty] = normalized;
  root.appendChild(probe);
  const computed = normalizeCssValue(getComputedStyle(probe)[styleProperty]);
  root.removeChild(probe);
  return computed;
}

/** 将 token 解析为 computed 值（支持 var 链），用于与 getComputedStyle 结果比对。 */
function getComputedTokenValue(
  preview: Element,
  tokenName: string,
  styleProperty: TokenProbeStyleProperty = 'width',
): string {
  const cacheKey = `${preview.isConnected ? 'live' : 'detached'}::${styleProperty}::${tokenName}`;
  const cached = computedTokenCache.get(cacheKey);
  if (cached) return cached;

  const root = resolveTokenRoot(preview);
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.top = '0';
  probe.style.left = '0';
  probe.style[styleProperty] = `var(${tokenName})`;
  root.appendChild(probe);
  const computed = normalizeCssValue(getComputedStyle(probe)[styleProperty]);
  root.removeChild(probe);
  computedTokenCache.set(cacheKey, computed);
  return computed;
}

export function getComputedDesignTokenValue(
  preview: Element,
  tokenName: string,
  styleProperty: TokenProbeStyleProperty = 'width',
): string {
  return getComputedTokenValue(preview, tokenName, styleProperty);
}

export function normalizeStyleValueForCompare(
  preview: Element,
  rawValue: string,
  styleProperty: TokenProbeStyleProperty,
): string {
  return normalizeComparableStyleValue(preview, rawValue, styleProperty);
}

/** 将 computed 值反查为 Desktop token 名（精确匹配 computed 值）。 */
export function resolveTokenNameForValue(
  preview: Element,
  rawValue: string,
  filter?: (name: string) => boolean,
  styleProperty: TokenProbeStyleProperty = 'width',
): string | null {
  const normalized = normalizeComparableStyleValue(preview, rawValue, styleProperty);
  if (!normalized || normalized === 'none' || normalized === 'normal') {
    return null;
  }

  for (const name of listDesignTokenNames(preview)) {
    if (filter && !filter(name)) continue;
    const tokenValue = getComputedTokenValue(preview, name, styleProperty);
    if (tokenValue && tokenValue === normalized) {
      return name;
    }
  }
  return null;
}

export function formatTokenVar(token: string): string {
  return `var(${token})`;
}

export function resolveInspectToken(
  preview: Element,
  rawValue: string,
  filter: (name: string) => boolean,
  styleProperty: TokenProbeStyleProperty = 'width',
): InspectTokenResolveResult {
  const raw = normalizeCssValue(rawValue);
  if (!raw || raw === 'none' || raw === 'normal' || raw === 'auto') {
    return { token: null, tokenVar: null, raw, isToken: false };
  }

  const token = resolveTokenNameForValue(preview, raw, filter, styleProperty);
  if (token) {
    return { token, tokenVar: formatTokenVar(token), raw, isToken: true };
  }

  return { token: null, tokenVar: null, raw, isToken: false };
}

export function resolveInspectCssTokenVar(
  preview: Element,
  rawValue: string,
  filter: (name: string) => boolean,
  styleProperty: TokenProbeStyleProperty = 'width',
): string | null {
  return resolveInspectToken(preview, rawValue, filter, styleProperty).tokenVar;
}

export function formatInspectCssLine(
  property: string,
  resolved: InspectTokenResolveResult,
  options?: { allowLiteral?: boolean; comment?: string | null; extraComment?: string | null },
): string | null {
  if (!resolved.raw && !resolved.tokenVar) return null;

  if (resolved.isToken && resolved.tokenVar) {
    const comment = options?.extraComment ?? options?.comment;
    if (comment) return `${property}: ${resolved.tokenVar}; /* ${comment} */`;
    return `${property}: ${resolved.tokenVar};`;
  }

  if (options?.allowLiteral) {
    const comment = options.extraComment ?? options.comment;
    if (comment) return `${property}: ${resolved.raw}; /* ${comment} */`;
    return `${property}: ${resolved.raw};`;
  }

  const comment = options?.comment ?? INSPECT_NON_TOKEN_COMMENT;
  return `${property}: ${resolved.raw}; /* ${comment} */`;
}

export function requireInspectCssLine(
  preview: Element,
  property: string,
  rawValue: string,
  filter: (name: string) => boolean,
  styleProperty: TokenProbeStyleProperty = 'width',
  options?: { allowLiteral?: boolean; comment?: string | null; extraComment?: string | null },
): string | null {
  const resolved = resolveInspectToken(preview, rawValue, filter, styleProperty);
  if (!resolved.raw) return null;
  return formatInspectCssLine(property, resolved, options);
}

export function formatValueWithToken(
  preview: Element,
  rawValue: string,
  filter?: (name: string) => boolean,
  styleProperty: TokenProbeStyleProperty = 'width',
): { display: string; token: string | null; isToken: boolean } {
  const value = normalizeCssValue(rawValue);
  if (!value) {
    return { display: value, token: null, isToken: false };
  }

  const resolved = resolveInspectToken(
    preview,
    value,
    filter ?? (() => true),
    styleProperty,
  );

  if (resolved.isToken && resolved.tokenVar && resolved.token) {
    return { display: resolved.tokenVar, token: resolved.token, isToken: true };
  }

  return { display: value, token: null, isToken: false };
}

export function invalidateDesignTokenCache() {
  cachedRoot = null;
  cachedTokenNames = null;
  computedTokenCache.clear();
}
