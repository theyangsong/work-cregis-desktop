# DS Icon 描边修复 — 业务侧待办

**日期：** 2026-08-18  
**DS 变更：** `processSvg` 已在每个 stroke 形状注入 `vector-effect="non-scaling-stroke"`（SVG attribute），不再仅依赖 `Icon.module.css`。

## 业务侧请处理

1. **确认已同步** eds-desktop（`pnpm sync` 或 `pnpm install` 刷新 link）
2. **重启 dev server** 后目视检查 Module Menu / NavBar / Tooltip / Flotation 内线稿 icon
3. **删除 workaround**：`src/styles/global.css` 约 L330–359 的 `.eds-i-s` / `path[stroke-width]` 覆盖块（DS 已内建，可删）
4. 若个别场景仍偏细，在 DevTools 核对 `<path>` 是否有 `vector-effect="non-scaling-stroke"` attribute

## 责任边界

- **缩放模型**（32→16/20px）：DS `EgIcon`，业务无额外 `scale`
- **描边 1.4px**：DS `processSvg` + `Icon.module.css`；业务 global 补丁为临时方案，应移除
