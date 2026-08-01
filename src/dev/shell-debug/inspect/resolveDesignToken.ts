const TOKEN_PREFIXES = [
  '--spacing-',
  '--radius-',
  '--text-',
  '--material-',
  '--event-',
  '--status-',
  '--eds-',
  '--icon-',
  '--weight-',
  '--box-',
  '--effect-',
] as const;

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

/** 将 token 解析为 computed 值（支持 var 链），用于与 getComputedStyle 结果比对。 */
function getComputedTokenValue(preview: Element, tokenName: string): string {
  const cacheKey = `${preview.isConnected ? 'live' : 'detached'}::${tokenName}`;
  const cached = computedTokenCache.get(cacheKey);
  if (cached) return cached;

  const root = resolveTokenRoot(preview);
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.top = '0';
  probe.style.left = '0';
  probe.style.width = `var(${tokenName})`;
  root.appendChild(probe);
  const computed = normalizeCssValue(getComputedStyle(probe).width);
  root.removeChild(probe);
  computedTokenCache.set(cacheKey, computed);
  return computed;
}

/** 将 computed 值反查为 Desktop token 名（精确匹配 computed 值）。 */
export function resolveTokenNameForValue(
  preview: Element,
  rawValue: string,
  filter?: (name: string) => boolean,
): string | null {
  const normalized = normalizeCssValue(rawValue);
  if (!normalized || normalized === 'none' || normalized === 'normal') {
    return null;
  }

  for (const name of listDesignTokenNames(preview)) {
    if (filter && !filter(name)) continue;
    const tokenValue = getComputedTokenValue(preview, name);
    if (tokenValue && tokenValue === normalized) {
      return name;
    }
  }
  return null;
}

export function formatTokenVar(token: string): string {
  return `var(${token})`;
}

export function formatValueWithToken(
  preview: Element,
  rawValue: string,
  filter?: (name: string) => boolean,
): { display: string; token: string | null } {
  const value = normalizeCssValue(rawValue);
  const token = resolveTokenNameForValue(preview, value, filter);
  if (!token) {
    return { display: value, token: null };
  }
  return { display: `${formatTokenVar(token)} · ${value}`, token };
}

export function invalidateDesignTokenCache() {
  cachedRoot = null;
  cachedTokenNames = null;
  computedTokenCache.clear();
}
