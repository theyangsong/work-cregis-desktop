import { cryptoNames, formatCryptoDisplayName, getProcessedCrypto, type CryptoName } from '@eds/desktop-components';

function registeredCryptoNames(): CryptoName[] {
  return cryptoNames.filter((name) => Boolean(getProcessedCrypto(name))) as CryptoName[];
}

function tickerScore(name: string, query: string): number {
  const lower = name.toLowerCase();
  const parts = lower.split('-');
  if (parts[1] === query) return 0;
  if (parts[1]?.startsWith(query)) return 1;
  if (lower.startsWith(`eds-${query}`)) return 2;
  if (lower.includes(query)) return 3;
  return 4;
}

/** 按币种符号或关键字模糊匹配 Crypto 图标（与 /components/crypto 搜索一致）。 */
export function resolveCryptoNameFromSymbol(symbol: string): CryptoName | undefined {
  const query = symbol.trim().toLowerCase();
  if (!query) return undefined;

  const registered = registeredCryptoNames();
  const matches = registered.filter((name) => name.toLowerCase().includes(query));
  if (matches.length === 0) return undefined;

  matches.sort((a, b) => {
    const scoreDiff = tickerScore(a, query) - tickerScore(b, query);
    if (scoreDiff !== 0) return scoreDiff;
    return a.length - b.length || a.localeCompare(b);
  });

  return matches[0];
}

/** 文档 / 用法片段用业务名（无 `eds-` 前缀）。 */
export function resolveCryptoBusinessNameFromSymbol(symbol: string): string {
  const resolved = resolveCryptoNameFromSymbol(symbol);
  return resolved ? formatCryptoDisplayName(resolved) : 'btc-bitcoin';
}
