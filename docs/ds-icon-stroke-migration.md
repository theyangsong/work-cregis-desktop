# DS Icon 描边 — 业务侧说明

**日期：** 2026-08-18  
**DS 真源：** `../eds-desktop/packages/components/docs/icon-stroke-scaling.md`

## 当前方案（Chrome <153）

EgIcon 用 **CSS calc** 补偿 viewBox 缩放，**不用** `vector-effect: non-scaling-stroke`（Chrome 回归，预计 **153** 稳定版修复）。

```css
/* Icon.module.css */
stroke-width: calc(var(--eds-icon-stroke-screen) * 32 / var(--eds-icon-display-px));
```

| 场景 | 业务做法 |
|------|----------|
| 常规线稿 icon | 勿覆写；默认屏上 **1.4px**（`--stroke-lg`） |
| Detail 行首等更细 icon | 容器设 `--eds-icon-stroke-screen: var(--stroke-md)`（**1.1px**） |
| 改色 | 父级 `color`，勿写 `.eds-i-s { stroke: ... }` |

## 业务侧

1. `pnpm install` / 重启 dev（`4173`）+ 硬刷新
2. **禁止**在 `.eds-i-s` 写 `stroke` / `stroke-width` / `vector-effect`
3. 153 发布后按 DS 文档「Chrome 153 后验证清单」再评估是否切回 `non-scaling-stroke`
