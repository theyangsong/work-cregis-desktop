# DS Icon — 业务侧说明

**日期：** 2026-08-18  
**DS：** `link:` 同步最新 `eds-desktop` 源码（EgIcon 已回退稳定 stroke 管线）

## 结论

- **`data-icon`** 与描边无关，保留在 `EgIcon` 外层 `span`。
- DS 已回退 **ResizeObserver / attribute 实验**；常规线稿走 `var(--stroke-lg, 1.4px)` + `non-scaling-stroke`。
- 业务侧 **不要** duplicate 全局 `.eds-i-s` 描边规则；**不要**在 `.eds-i-s` 上写 `stroke:`（会重置 `stroke-width`）。

## 业务侧检查清单

1. `pnpm install` + 重启 dev（必要时 `rm -rf node_modules/.vite`）
2. 删除任何 `global.css` 里针对 `.eds-i-s` 的 stroke 补丁（若仍存在）
3. 改色：在 **EgIcon 父级** 设 `color`，勿直接 `stroke:` path
4. 定稿非 1.4px 的例外（如 Detail 行首 1.1px）：只覆写 `stroke-width` + `vector-effect: non-scaling-stroke`

## EgIcon 稳定行为

| 场景 | 做法 |
|------|------|
| 常规 EgIcon | 无需业务 CSS；DS `.tokenKind .eds-i-s` |
| 行首小 icon 1.1px | `.itemTitleIcon :global(.eds-i-s) { stroke-width: var(--stroke-md); vector-effect: non-scaling-stroke; }` |
| 成功态改色 | `.parent { color: var(--status-success); }`，fill 图标另设 `.eds-i-f` fill |

## 开发者模式

`closest('[data-icon]')?.dataset.icon` → `eds-add` 等
