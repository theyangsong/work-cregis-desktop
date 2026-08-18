# DS Icon — 业务侧说明

**日期：** 2026-08-18  
**DS 版本：** `0.1.3`

## 结论

- **`data-icon`**（开发者模式识别 icon 名）与描边渲染 **无关**，保留在 `EgIcon` 外层 `span`。
- **0.1.1 / 0.1.2** 对 `processSvg` 的 stroke 实验已 **回退**；请使用 **0.1.3** 或同步最新 `link:` 源码。

## 业务侧

1. `pnpm sync` / 重启 dev server（必要时清 `node_modules/.vite`）
2. 若曾加 `global.css` icon stroke 补丁，验证后可删除（L330–359）
3. 开发者模式点 icon：读 `closest('[data-icon]')` → `eds-add` 等

## 稳定行为（与改 stroke 实验前一致）

- path 保留 `stroke-width="1.4"` + `eds-i-s`
- `Icon.module.css`：`stroke-width: var(--stroke-lg)` + `vector-effect: non-scaling-stroke`
