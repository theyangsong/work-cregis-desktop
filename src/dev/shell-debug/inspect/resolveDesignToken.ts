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
  return cachedTokenNames;
}

function normalizeCssValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** 将 computed 值反查为 Desktop token 名（精确匹配）。 */
export function resolveTokenNameForValue(
  preview: Element,
  rawValue: string,
  filter?: (name: string) => boolean,
): string | null {
  const normalized = normalizeCssValue(rawValue);
  if (!normalized || normalized === 'none' || normalized === 'normal') {
    return null;
  }

  const rootStyle = getComputedStyle(resolveTokenRoot(preview));
  for (const name of listDesignTokenNames(preview)) {
    if (filter && !filter(name)) continue;
    const tokenValue = normalizeCssValue(rootStyle.getPropertyValue(name));
    if (tokenValue && tokenValue === normalized) {
      return name;
    }
  }
  return null;
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
  return { display: `${token} · ${value}`, token };
}

export function invalidateDesignTokenCache() {
  cachedRoot = null;
  cachedTokenNames = null;
}
