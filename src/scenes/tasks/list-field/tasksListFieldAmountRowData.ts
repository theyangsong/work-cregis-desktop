import { formatGroupedNumber } from '@eds/desktop-components';
import { resolveCurrencySymbolForRow } from './tasksListFieldCurrencyRowData';
import { getAmountRowPreset } from './tasksListFieldAmountRowPresets';

function seededFraction(rowIndex: number, salt: number): number {
  const x = Math.sin((rowIndex + 1) * 9973 + salt * 7919) * 10000;
  return x - Math.floor(x);
}

function seededInt(rowIndex: number, salt: number, min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.floor(seededFraction(rowIndex, salt) * (max - min + 1));
}

type AmountVisualProfile = {
  wholeMin: number;
  wholeMax: number;
  decimalPlaces: number;
  fiatMultiplier: number;
  trimTrailingZeros?: boolean;
};

/** 第 9 行起随机档位，保留大数/长小数以便测试溢出。 */
const RANDOM_AMOUNT_PROFILES: readonly AmountVisualProfile[] = [
  { wholeMin: 0, wholeMax: 0, decimalPlaces: 8, fiatMultiplier: 52_000, trimTrailingZeros: true },
  { wholeMin: 1, wholeMax: 9, decimalPlaces: 1, fiatMultiplier: 4.8 },
  { wholeMin: 10, wholeMax: 99, decimalPlaces: 4, fiatMultiplier: 118 },
  { wholeMin: 100, wholeMax: 999, decimalPlaces: 2, fiatMultiplier: 250 },
  { wholeMin: 1_000, wholeMax: 9_999, decimalPlaces: 6, fiatMultiplier: 1.02 },
  { wholeMin: 10_000, wholeMax: 99_999, decimalPlaces: 2, fiatMultiplier: 1 },
  { wholeMin: 100_000, wholeMax: 999_999, decimalPlaces: 4, fiatMultiplier: 0.98 },
  { wholeMin: 1_000_000, wholeMax: 9_999_999, decimalPlaces: 6, fiatMultiplier: 1 },
  { wholeMin: 0, wholeMax: 0, decimalPlaces: 6, fiatMultiplier: 38_000, trimTrailingZeros: true },
  { wholeMin: 1, wholeMax: 1, decimalPlaces: 8, fiatMultiplier: 68_000 },
  { wholeMin: 50, wholeMax: 50, decimalPlaces: 0, fiatMultiplier: 7.2 },
  { wholeMin: 2_450, wholeMax: 2_450, decimalPlaces: 3, fiatMultiplier: 1 },
] as const;

export type AmountRowValues = {
  cryptoSymbol: string;
  cryptoValue: string;
  fiatValue: string;
};

function pickRandomProfile(rowIndex: number): AmountVisualProfile {
  const profileIndex =
    (rowIndex * 5 + Math.floor(seededFraction(rowIndex, 9) * RANDOM_AMOUNT_PROFILES.length)) %
    RANDOM_AMOUNT_PROFILES.length;
  return RANDOM_AMOUNT_PROFILES[profileIndex] ?? RANDOM_AMOUNT_PROFILES[0];
}

function buildFractionDigits(rowIndex: number, profile: AmountVisualProfile): string {
  const max = 10 ** profile.decimalPlaces - 1;
  const digits = seededInt(rowIndex, 2, 1, Math.max(1, max));
  return String(digits).padStart(profile.decimalPlaces, '0').slice(0, profile.decimalPlaces);
}

function formatCryptoAmount(
  whole: number,
  fractionDigits: string,
  profile: AmountVisualProfile,
): string {
  if (profile.decimalPlaces === 0) {
    return formatGroupedNumber(whole);
  }

  let fraction = fractionDigits;
  if (profile.trimTrailingZeros) {
    fraction = fraction.replace(/0+$/, '');
    if (!fraction) {
      return formatGroupedNumber(whole);
    }
  }

  if (whole === 0) {
    return `0.${fraction}`;
  }

  return `${formatGroupedNumber(whole)}.${fraction}`;
}

function formatFiatAmount(cryptoNumeric: number, profile: AmountVisualProfile, rowIndex: number): string {
  const fiatAmount = cryptoNumeric * profile.fiatMultiplier;

  if (fiatAmount < 1) {
    const cents = Math.max(1, Math.round(fiatAmount * 100));
    return `$0.${String(cents).padStart(2, '0')}`;
  }

  if (fiatAmount < 100) {
    const rounded = Math.round(fiatAmount * 100) / 100;
    const [whole, frac = '00'] = rounded.toFixed(2).split('.');
    return `$${formatGroupedNumber(Number(whole))}.${frac}`;
  }

  const useWholeFiat = seededFraction(rowIndex, 4) > 0.55;
  if (useWholeFiat || profile.decimalPlaces === 0) {
    return `$${formatGroupedNumber(Math.round(fiatAmount))}`;
  }

  const rounded = Math.round(fiatAmount * 100) / 100;
  const [whole, frac = '00'] = rounded.toFixed(2).split('.');
  return `$${formatGroupedNumber(Number(whole))}.${frac}`;
}

function cryptoNumericValue(whole: number, fractionDigits: string, decimalPlaces: number): number {
  if (decimalPlaces === 0) return whole;
  const fraction = Number(`0.${fractionDigits}`) || 0;
  return whole + fraction;
}

function buildRandomAmountRowValues(rowIndex: number, cryptoSymbol: string): AmountRowValues {
  const profile = pickRandomProfile(rowIndex);
  const whole = seededInt(rowIndex, 1, profile.wholeMin, profile.wholeMax);
  const fractionDigits = buildFractionDigits(rowIndex, profile);
  const cryptoValue = formatCryptoAmount(whole, fractionDigits, profile);
  const cryptoNumeric = cryptoNumericValue(whole, fractionDigits, profile.decimalPlaces);
  const fiatValue = formatFiatAmount(cryptoNumeric, profile, rowIndex);

  return { cryptoSymbol, cryptoValue, fiatValue };
}

export function buildAmountRowValues(rowIndex: number): AmountRowValues {
  const cryptoSymbol = resolveCurrencySymbolForRow(rowIndex);
  const preset = getAmountRowPreset(rowIndex);

  if (preset) {
    return {
      cryptoSymbol,
      cryptoValue: preset.cryptoValue,
      fiatValue: preset.fiatValue,
    };
  }

  return buildRandomAmountRowValues(rowIndex, cryptoSymbol);
}
