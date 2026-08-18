/**
 * Backlog：代码 `ui('…')` 引用但 uiTextZhCN.ts 尚无条目（按 key 去重，不按出现次数）。
 * 状态：暂不处理 — 待补 catalog 或改代码对齐已有 key。
 * 由 scripts/sync-i18n-from-excel.py 扫描生成。
 */
export const I18N_CATALOG_MISSING_STATUS = 'deferred' as const;

/** en key → catalog 中近似条目（大小写/用词不同）；修复时优先改引用。 */
export const I18N_CATALOG_MISSING_NEAR_MATCH: Readonly<Record<string, string>> = {
};

export const I18N_CATALOG_MISSING_FROM_CODE = [
  'Please change your transaction password regularly',
] as const;
