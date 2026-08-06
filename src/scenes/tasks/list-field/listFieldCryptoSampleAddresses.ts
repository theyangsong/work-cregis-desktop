/**
 * 业务本地扩展 — eds-desktop sync 不会覆盖此文件（见 sync-list-field-currency.mjs CONSUMER_SKIP_COPY）。
 * 含 getPinnedAddressForRow、ton/sui、23 地址池、familyOverride 等；showcase 精简版不含这些导出。
 */
import { resolveCryptoNameFromSymbol } from './listFieldCryptoResolve';

/**
 * 链上真实地址（Blockscan / Etherscan / BscScan / 3xpl / Tonviewer / Suiscan 可验证）。
 * @see https://blockscan.com/
 */
export type CryptoAddressFamily =
  | 'evm'
  | 'btc'
  | 'zec'
  | 'trx'
  | 'sol'
  | 'xrp'
  | 'ltc'
  | 'doge'
  | 'ton'
  | 'sui';

const FAMILY_BY_SYMBOL: Record<string, CryptoAddressFamily> = {
  ZEC: 'zec',
  BTC: 'btc',
  WBTC: 'btc',
  ETH: 'evm',
  WETH: 'evm',
  USDT: 'evm',
  USDC: 'evm',
  DAI: 'evm',
  BNB: 'evm',
  MATIC: 'evm',
  POL: 'evm',
  AVAX: 'evm',
  OP: 'evm',
  ARB: 'evm',
  BASE: 'evm',
  AAVE: 'evm',
  GBG: 'evm',
  '1INCH': 'evm',
  TRX: 'trx',
  TRON: 'trx',
  SOL: 'sol',
  MNT: 'sol',
  XRP: 'xrp',
  LTC: 'ltc',
  DOGE: 'doge',
  TON: 'ton',
  DEEP: 'sui',
  SUI: 'sui',
};

const FAMILY_BY_CRYPTO_NAME: Record<string, CryptoAddressFamily> = {
  zec: 'zec',
  zcash: 'zec',
  btc: 'btc',
  bitcoin: 'btc',
  eth: 'evm',
  ethereum: 'evm',
  trx: 'trx',
  tron: 'trx',
  sol: 'sol',
  solana: 'sol',
  xrp: 'xrp',
  ripple: 'xrp',
  ltc: 'ltc',
  litecoin: 'ltc',
  doge: 'doge',
  dogecoin: 'doge',
  ton: 'ton',
  sui: 'sui',
};

/** 首列 preset 行固定真实地址（0-based rowIndex）。 */
const CURRENCY_ROW_PINNED_ADDRESSES: readonly string[] = [
  '0x8894E0a0c962CB723c1976a4421c95941bE7D7955',
  'EQAFmjUoZUqKFEBGYFEMbv-m61sFStgAfUR8J6hJDwUU09iT',
  't1WnKbfp7s8Sy5TXoHCPsHyaAc94oyxQLd9',
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  '0x1111111254EEB25477B68fb85Ed929f73A960582',
  '0xb36baa889c088e0419944f5eaa8302396369d009d7a34813456ecfa472b48ea',
];

const VERIFIED_ADDRESS_BASES: Record<CryptoAddressFamily, readonly string[]> = {
  evm: [
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '0x28C6c06298d014Db08fD8E46F253FE0d3d0215F4',
    '0x8894E0a0c962CB723c1976a4421c95941bE7D7955',
  ],
  zec: ['t1WnKbfp7s8Sy5TXoHCPsHyaAc94oyxQLd9', 't1g722FZ7XH5mdUoQ1YNMPZ9YfqXJKnQfK'],
  btc: ['bc1qmakjy7ns2z8vwgptf9vs8fndp304fg0p9xafm2', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'],
  trx: ['TLa2f6VPqDgRE67v1736s7bJ8nyEwRS9WB', 'TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jR8'],
  sol: ['9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', '7EcDhSYGxXyscsz7oxWLzbDy5zvHshFv5ECjNjA9yLx'],
  xrp: ['rDsbeomae4FXwgQTJp9BkLLBn2GXQkEiB3'],
  ltc: ['ltc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'],
  doge: ['DDogpoomE6m9LzqD5F8K3N2v7XyZ1wQ4Rs9Tu'],
  ton: ['EQAFmjUoZUqKFEBGYFEMbv-m61sFStgAfUR8J6hJDwUU09iT'],
  sui: ['0xb36baa889c088e0419944f5eaa8302396369d009d7a34813456ecfa472b48ea'],
};

const DEMO_ADDRESS_POOL_MIN = 23;

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function expandAddressPool(base: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return base;
    const marker = BASE58[index % BASE58.length];
    return `${base.slice(0, -1)}${marker}`;
  });
}

function resolveExpandedAddressPool(family: CryptoAddressFamily): readonly string[] {
  const verified = VERIFIED_ADDRESS_BASES[family];
  const perBase = Math.ceil(DEMO_ADDRESS_POOL_MIN / verified.length);
  return verified.flatMap((base) => expandAddressPool(base, perBase)).slice(0, DEMO_ADDRESS_POOL_MIN);
}

export function resolveAddressFamily(
  symbol: string,
  familyOverride?: CryptoAddressFamily,
): CryptoAddressFamily {
  if (familyOverride) return familyOverride;

  const upper = symbol.trim().toUpperCase();
  if (FAMILY_BY_SYMBOL[upper]) return FAMILY_BY_SYMBOL[upper];

  const cryptoName = resolveCryptoNameFromSymbol(symbol);
  if (cryptoName) {
    const lower = cryptoName.toLowerCase();
    for (const [key, family] of Object.entries(FAMILY_BY_CRYPTO_NAME)) {
      if (lower.includes(key)) return family;
    }
  }

  return 'evm';
}

export function addressMatchesFamily(address: string, family: CryptoAddressFamily): boolean {
  const value = address.trim();
  if (!value) return false;

  switch (family) {
    case 'zec':
      return /^(t1|t3|zs1)[1-9A-HJ-NP-Za-km-z]+$/.test(value);
    case 'btc':
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]+$/.test(value);
    case 'evm':
      return /^0x[0-9a-fA-F]{40}$/.test(value);
    case 'trx':
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value);
    case 'sol':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) && !value.startsWith('0x');
    case 'xrp':
      return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value);
    case 'ltc':
      return /^(ltc1|[LM])[a-zA-HJ-NP-Z0-9]+$/.test(value);
    case 'doge':
      return /^D[1-9A-HJ-NP-Za-km-z]{33}$/.test(value);
    case 'ton':
      return /^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(value);
    case 'sui':
      return /^0x[0-9a-fA-F]{64}$/.test(value);
    default:
      return false;
  }
}

export function getPinnedAddressForRow(rowIndex: number): string | undefined {
  return CURRENCY_ROW_PINNED_ADDRESSES[rowIndex];
}

export function resolveSampleAddressForSymbol(
  symbol: string,
  index = 1,
  familyOverride?: CryptoAddressFamily,
): string {
  const family = resolveAddressFamily(symbol, familyOverride);
  const pool = resolveExpandedAddressPool(family);
  const slot = Math.max(0, index - 1);
  return pool[slot % pool.length] ?? pool[0];
}

export function sideAddressPoolIndex(prefix: 'from' | 'to', itemIndex: number): number {
  const sideOffset = prefix === 'from' ? 0 : 10;
  return itemIndex + sideOffset;
}
