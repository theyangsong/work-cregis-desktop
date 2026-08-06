/** Paginer「大量数据」分页 — 与 Showcase 一致。 */

export type PaginerManyPageItem =
  | { kind: 'page'; label: string; page: number }
  | { kind: 'ellipsis'; label: '...' };

export const PAGINER_MANY_HOME_STEP_THRESHOLD = 4;

export function paginerManyPageItem(page: number): PaginerManyPageItem {
  return { kind: 'page', label: String(page), page };
}

export function shouldStepWithinManyWindow(current: number): boolean {
  return current <= PAGINER_MANY_HOME_STEP_THRESHOLD;
}

export function defaultManyWindowStart(current: number, lastPage: number): number {
  if (current <= 3) return 1;
  if (current >= lastPage) return Math.max(1, lastPage - 3);
  return current - 2;
}

export function buildManyPageItems(
  current: number,
  windowStart: number,
  lastPage: number,
): PaginerManyPageItem[] {
  if (lastPage <= 1) {
    return [paginerManyPageItem(1)];
  }

  if (lastPage <= 4) {
    return Array.from({ length: lastPage }, (_, index) => paginerManyPageItem(index + 1));
  }

  if (current <= 3) {
    return [
      paginerManyPageItem(1),
      paginerManyPageItem(2),
      paginerManyPageItem(3),
      { kind: 'ellipsis', label: '...' },
      paginerManyPageItem(lastPage),
    ];
  }

  if (current >= lastPage) {
    return [
      paginerManyPageItem(lastPage - 3),
      paginerManyPageItem(lastPage - 2),
      paginerManyPageItem(lastPage - 1),
      { kind: 'ellipsis', label: '...' },
      paginerManyPageItem(lastPage),
    ];
  }

  const start = Math.max(2, windowStart);

  return [
    paginerManyPageItem(start),
    paginerManyPageItem(start + 1),
    paginerManyPageItem(start + 2),
    { kind: 'ellipsis', label: '...' },
    paginerManyPageItem(lastPage),
  ];
}

export function isManyPageItemSelected(
  item: PaginerManyPageItem,
  index: number,
  current: number,
  lastPage: number,
  items: PaginerManyPageItem[],
): boolean {
  if (item.kind !== 'page') return false;
  if (current >= lastPage) {
    return index === items.length - 1;
  }
  return item.page === current;
}

export function computeManyPageClickKeepWindow(
  current: number,
  targetPage: number,
  windowStart: number,
): boolean {
  const inWindow = targetPage >= windowStart && targetPage <= windowStart + 2;
  return shouldStepWithinManyWindow(current) && inWindow && targetPage < current;
}

export function computeManyPrevKeepWindow(current: number, windowStart: number): boolean {
  return shouldStepWithinManyWindow(current) && current > windowStart;
}

export function computeManyNextKeepWindow(current: number, windowStart: number): boolean {
  return shouldStepWithinManyWindow(current) && current < windowStart + 2;
}
