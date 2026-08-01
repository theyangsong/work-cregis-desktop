import { buildCurrencySideAddressData } from './listFieldCurrencyAddressCustomize';

/** 中间省略：与 DS cryptoAddressUtils 一致。 */
export function truncateAddressMiddle(value: string, head = 6, tail = 6): string {
  if (!value || value.includes('...')) return value;
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export type ListFieldAddressLineModel = {
  address: string;
  alias: string;
  primaryText: string;
  tooltipText: string;
  semanticallyTruncated: boolean;
};

/** 列表地址行：有别名优先展示别名；tooltip 始终为完整地址（与详情 alias 字段同源）。 */
export function resolveListFieldAddressLineModel(
  prefix: 'from' | 'to',
  customize: Record<string, unknown>,
): ListFieldAddressLineModel {
  const side = buildCurrencySideAddressData(prefix, customize);
  const address = side.address;
  const alias = side.alias.trim();
  const primaryText = alias || truncateAddressMiddle(address, 6, 6);

  return {
    address,
    alias,
    primaryText,
    tooltipText: address,
    semanticallyTruncated: !alias && primaryText !== address,
  };
}

/** 侧栏 / 摘要：别名优先，否则截断地址（与列表主行、详情 tag 同源，不含钱包名）。 */
export function resolveAddressSideDisplayLabel(
  entry: { alias?: string; address: string } | undefined,
  fallbackAddress: string,
): string {
  const alias = entry?.alias?.trim();
  if (alias) return alias;
  const address = entry?.address?.trim() || fallbackAddress.trim();
  return truncateAddressMiddle(address, 6, 6);
}

/** 侧栏完整展示：别名优先，否则完整地址（不截断）。 */
export function resolveAddressSideFullLabel(
  entry: { alias?: string; address: string } | undefined,
  fallbackAddress: string,
): string {
  const alias = entry?.alias?.trim();
  if (alias) return alias;
  return entry?.address?.trim() || fallbackAddress.trim();
}
