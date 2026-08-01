const HEADLINE_FIAT_MARKER = ' ≈ ';

export function splitDetailAmountHeadline(headline: string): {
  primary: string;
  fiat: string | null;
} {
  const markerIndex = headline.indexOf(HEADLINE_FIAT_MARKER);
  if (markerIndex === -1) {
    return { primary: headline, fiat: null };
  }

  return {
    primary: headline.slice(0, markerIndex),
    fiat: headline.slice(markerIndex),
  };
}
