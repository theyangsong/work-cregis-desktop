import type { CryptoName } from '@eds/desktop-components';
import type { CryptoAddressFamily } from './listFieldCryptoSampleAddresses';

export type CurrencyRowPreset = {
  symbol: string;
  cryptoName: CryptoName;
  showNetwork: boolean;
  networkLabel?: string;
  /** 覆盖默认地址族（如 MNT 展示 Solana 网络时用 sol 地址）。 */
  addressFamily?: CryptoAddressFamily;
};

/** 首列第 1–8 条固定币种（0-based rowIndex 0–7）。第 6 条 GBG：DS 暂无独立图标，暂映射 BGB。 */
export const CURRENCY_ROW_PRESETS: readonly CurrencyRowPreset[] = [
  {
    symbol: 'USDT',
    cryptoName: 'eds-usdt-tether usd',
    showNetwork: true,
    networkLabel: 'BNB Smart Chain',
    addressFamily: 'evm',
  },
  {
    symbol: 'TON',
    cryptoName: 'eds-ton-toncoin',
    showNetwork: false,
    addressFamily: 'ton',
  },
  {
    symbol: 'ZEC',
    cryptoName: 'eds-zec-zcash',
    showNetwork: false,
    addressFamily: 'zec',
  },
  {
    symbol: 'AAVE',
    cryptoName: 'eds-aave-aave',
    showNetwork: true,
    networkLabel: 'Base',
    addressFamily: 'evm',
  },
  {
    symbol: 'MNT',
    cryptoName: 'eds-mnt-mantle',
    showNetwork: true,
    networkLabel: 'Solana',
    addressFamily: 'sol',
  },
  {
    symbol: 'GBG',
    cryptoName: 'eds-bgb-bitget token',
    showNetwork: false,
    addressFamily: 'evm',
  },
  {
    symbol: '1INCH',
    cryptoName: 'eds-1inch-1inch network',
    showNetwork: false,
    addressFamily: 'evm',
  },
  {
    symbol: 'DEEP',
    cryptoName: 'eds-deep-deepbook protocol',
    showNetwork: false,
    addressFamily: 'sui',
  },
] as const;

/** 首列固定 preset 行数（0-based rowIndex 0–7）；随机池 offset 以此为基准。 */
export const FIXED_CURRENCY_PRESET_ROW_COUNT = CURRENCY_ROW_PRESETS.length;

/** 指定行币种覆盖（0-based rowIndex；第 19 条 = 18，第 20 条 = 19）。 */
const CURRENCY_ROW_PRESET_OVERRIDES: Partial<Record<number, CurrencyRowPreset>> = {
  18: {
    symbol: 'TRX',
    cryptoName: 'eds-trx-tron',
    showNetwork: false,
    addressFamily: 'trx',
  },
  19: {
    symbol: 'BTC',
    cryptoName: 'eds-btc-bitcoin',
    showNetwork: false,
    addressFamily: 'btc',
  },
};

export const CURRENCY_PRESET_SYMBOLS = new Set([
  ...CURRENCY_ROW_PRESETS.map((preset) => preset.symbol),
  ...Object.values(CURRENCY_ROW_PRESET_OVERRIDES).map((preset) => preset!.symbol),
  'ADA',
  'FIL',
  'TRX',
]);

export function getCurrencyRowPreset(rowIndex: number): CurrencyRowPreset | undefined {
  return CURRENCY_ROW_PRESET_OVERRIDES[rowIndex] ?? CURRENCY_ROW_PRESETS[rowIndex];
}
