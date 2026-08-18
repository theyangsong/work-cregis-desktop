# DS 同步核对清单（2026-08-18）

eds-desktop 已拆分 **Animations** 为独立 workspace 包；业务侧须完成以下核对。

## 已自动更新

- [x] `package.json` — `link:@eds/desktop-animations`，`predev` / `prebuild` 增加 `build:animations`
- [x] `vite.config.ts` — `@eds/desktop-animations` alias 到 DS 源码 + watch
- [x] `tsconfig.json` — animations 路径映射

## 请本地执行

```bash
# 1. 若 dev 在跑，先停掉
cd ../work-cregis-desktop
rm -rf node_modules/.vite
pnpm install
pnpm typecheck   # ✓ 已通过（Agent 2026-08-18）
pnpm build       # ✓ 已通过（Agent 2026-08-18）
pnpm dev   # 5178，保存应 HMR
```

## 已随 DS 迁移修复（业务代码）

- `EgPopup`：`uses="reminder"` → `uses="dialog"`，`reminder-type="echo"` → `dialog-type="compose"`
- `EgReminder`：`type="echo"` → `type="compose"`（后续可改 `EgDialog`）
- `parseCurrencyOrderCount` → `parseCurrencyAddressCount`（sync 辅助文件重命名）
- `TasksListFieldAddressLine`：tag `label` 可选类型兼容


| 场景 | 预期 |
|------|------|
| 签名进度 `EgMotionProcessing` | 表盘双针旋转正常 |
| 验证弹窗 `EgVerify` / `EgVerifyRingDots` | 外圈点阵追光、成功勾 |
| `EgEndFeedbackCard` / `EgDoneTick` | 成功勾动画 |
| `EgReminder` 弹窗（现为 `EgDialog` 别名） | 布局与圆角正常 |

## API 说明

- 仍可从 `@eds/desktop-components` 导入 `EgMotionProcessing`、`EgDoneTick` 等（re-export）
- 动画实现位于 `@eds/desktop-animations`；**勿** import dist CSS，走源码 alias
- `EgReminder` 已 deprecated，新代码用 `EgDialog`

## 若动画无样式

1. 确认 `vite.config.ts` 含 `@eds/desktop-animations` alias  
2. 清 `node_modules/.vite` 后重启 dev  
3. 确认 `../eds-desktop` 已 `pnpm build:animations`
