import { formatGroupedNumber } from '@eds/desktop-components';

export { formatGroupedNumber };

/** 金额 / 数量字符串：整数部分千分位，小数部分原样保留。支持 `$` 前缀。 */
export function formatGroupedDecimalAmount(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith('$')) {
    return `$${formatGroupedDecimalAmount(trimmed.slice(1))}`;
  }

  const normalized = trimmed.replace(/,/g, '');
  const dotIndex = normalized.indexOf('.');
  if (dotIndex === -1) {
    return formatGroupedNumber(normalized);
  }

  const whole = normalized.slice(0, dotIndex);
  const fraction = normalized.slice(dotIndex + 1);
  if (!whole) {
    return fraction ? `0.${fraction}` : '0';
  }

  const groupedWhole = formatGroupedNumber(whole);
  return fraction ? `${groupedWhole}.${fraction}` : groupedWhole;
}

/** 文案中的数字 token（含可选 `$`）统一千分位；不用于倒计时等 `:` 时间格式。 */
export function formatGroupedAmountText(text: string): string {
  return text.replace(/(\$?)([\d,]+(?:\.\d+)?)/g, (match, dollar: string, num: string) => {
    if (!num) return match;
    return `${dollar}${formatGroupedDecimalAmount(num)}`;
  });
}

/** `3 / 4` 类阈值文案。 */
export function formatGroupedThresholdString(threshold: string | null | undefined): string {
  const trimmed = String(threshold ?? '').trim();
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(trimmed);
  if (!match) return trimmed;
  return `${formatGroupedNumber(match[1])} / ${formatGroupedNumber(match[2])}`;
}

/** `2100ms` → `2,100ms`；非 ms 文案（如「无网络」）原样返回。 */
export function formatGroupedLatencyLabel(label: string): string {
  const trimmed = label.trim();
  const match = /^([\d,]+)(ms)$/i.exec(trimmed);
  if (!match) return trimmed;
  return `${formatGroupedDecimalAmount(match[1]!)}ms`;
}

export function formatGroupedTemplateValue(value: string | number): string {
  if (typeof value === 'number') {
    return formatGroupedNumber(value);
  }
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^[\d,$]/.test(trimmed) || /^[\d,]+(?:\.\d+)?$/.test(trimmed.replace(/,/g, ''))) {
    return formatGroupedDecimalAmount(trimmed);
  }
  return value;
}
