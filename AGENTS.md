# work-cregis-desktop — Agent 须知

本项目是 **Desktop 客户端**，不是 Showcase / 文档站。

## 硬约束（违反即错误）

1. **只允许** `@eds/desktop-tokens`、`@eds/desktop-components`（及未来的 `@eds/desktop-scenes`）。
2. **禁止** `@eds/website-tokens`、`@eds/website-components`，以及任何 Website 排版 / 壳层 CSS。
3. **禁止**从 `eds-desktop/apps/showcase/**` 复制样式、token 名或集成方式。
4. **排版 token** 以 `../eds-desktop/packages/tokens/spec/typography/semantic.json` 为准。  
   例：用 `--eds-footnote-size`，**不存在** `--eds-footnote-medium-size`。
5. **组件样式** dev/build 走 eds-desktop **源码**（见 `vite.config.ts` alias），不要 `@import '@eds/desktop-components/style.css'`（dist 快照会过期）。
6. **`pnpm sync` / 说「同步 eds-desktop」** 只更新 Desktop packages，与 showcase / Website 无关。
7. **禁止复制**：所有业务页面（含后续新增）不得向用户提供复制能力；`installPageCopyGuard()` 拦截 `copy`/`cut`；`.app-preview` 与 teleport 到 `body` 的 `eds-tooltip-v-*` / `.eds-flotation-menu` 全局 `user-select: none`（`global.css`）。不得新增复制按钮、clipboard API、DS 复制 Menu。
8. **开发改动须 dev 实时生效**：UI/样式/交互改 `src/**` 或引用库时，须在 `pnpm dev` 下保存即 HMR/full-reload 可见；禁止只 `pnpm build` 不 dev。详见 `.cursor/rules/work.mdc` §2.3.2。

## 对齐引用库（硬约束）

**引用库** = 同级目录 `../eds-desktop` 的 `packages/tokens`、`packages/components`（dev 经 Vite alias 消费源码）。用户说「对齐引用库」或组件行为与 Showcase 不一致时，**必须先读引用库再改业务代码**。

| 变更类型 | 改哪里 | 不要 |
|----------|--------|------|
| DS 组件行为（Tooltip、BatchBar、DataList、CryptoAddress…） | `eds-desktop/packages/components/**` | 在业务项目手搓平行实现 |
| 业务 list-field 薄封装（`TasksListField*`） | 对齐 Showcase 集成方式：`ListFieldPreviewPanel.vue` | 误用 `EgListFieldHashLikeLine` 渲染发起人、钱包、金额等普通文本；**禁止**接入带复制的 HashLikeLine / CryptoAddress 复制侧栏 |
| 可 sync 的 list-field 辅助 | 随 sync 或手动 diff showcase 同名文件后合并 | 整文件覆盖 `listFieldCryptoSampleAddresses.ts`（§ list-field 本地扩展） |

**Tooltip / 溢出文本**：
- **所有可读文本**（含哈希、编号、地址别名）→ `EgListFieldOverflowText`（列宽溢出时只读 Tooltip，**无复制**）
- **禁止** `EgListFieldHashLikeLine`、`CryptoAddressSide` 复制 Menu、`showValueCopy`、复制按钮、`navigator.clipboard` 等向用户提供复制能力（见下 §禁止复制）
- `boundary-selector=".eds-data-list"`、`close-on-scroll` 在引用库组件内配置，业务侧勿重复实现。

**验收**：改完后对照引用库同名组件的 props / 模板；业务 wrapper 与 Showcase 预览一致，仅保留 i18n / 业务数据差异。

## list-field 本地扩展（sync 不覆盖）

`src/scenes/tasks/list-field/listFieldCryptoSampleAddresses.ts` 含 **业务专用** 扩展（`getPinnedAddressForRow`、`ton`/`sui`、23 地址池、`familyOverride`），**不是** showcase 精简版。

- eds-desktop `sync-list-field-currency.mjs` 已配置 **跳过** 该文件，不会覆盖。
- `pnpm dev` / `pnpm build` 前会跑 `scripts/verify-list-field-crypto.mjs`；若文件被误改，会报错而非整页空白。
- 若需对齐 showcase 基座逻辑，请 **手动 diff** showcase 同名文件后合并，勿整文件替换。

## 容器范围（勿混淆 `#app` 与预览框）

浏览器里有两层 DOM，**业务容器只是内层预览框**：

```
#app                                    ← Vue 挂载 + flex 居中；不是客户端视口
└─ .app-preview.desktopTokens          ← EgTooltip container（1280×800 预览框）
   ├─ EgContainer → EgLayout → 业务页
   └─ AppPopupOverlayHost              ← EgPopup 客户端 shell（与 Container 同级）
```

- **业务 UI、Desktop token、布局/滚动/浮层边界**：限定在 `.app-preview`（及其子树）内。
- **`#app`**：仅负责把预览框居中、尺寸 clamp（见 `global.css` 的 `--app-preview-*`）；勿把 `#app` 当作业务根容器写样式或挂载全局浮层。
- **预览框外圈**（`body` 的 `--cregis-shell-*` 网格/光晕）：模拟浏览器宿主环境，不属于客户端内容。

## EgPopup 挂载（硬约束）

`EgPopup` 根为 `width/height: 100%`，**遮罩范围 = 直接父容器大小**。

| 规则 | 说明 |
|------|------|
| 覆盖范围 | 须铺满 **NavBar + ModuleMenu + 主内容** 整块客户端（`.app-preview`） |
| 挂载位置 | Popup host（如 `AppPopupOverlayHost`）放在 **客户端 shell**，与 `EgContainer` 同级 |
| 禁止 | 挂在列表页、ModuleMenu 内容区等业务 subtree 内（遮罩会被限制在主内容区） |
| reminder / verify | `EgPopup` 须 `v-if="open"` 或 shell host 在关闭时卸载，避免空遮罩 |
| detail 关闭 | `EgDetail @close` → **仅** `popupOpen=false`；`emit('update:open', false)` 与数据清理在 EgPopup `@close` / `onClosed`（`.motion-layout` 出场后）。关闭钮与点遮罩须同链（`work.mdc` §7.1.1） |

权威说明：`../eds-desktop/.cursor/rules/eds-project.mdc` §7 EgPopup。

## 数字千分位（硬约束）

展示态数字须千分位分组；用 `formatGroupedNumber`（`@eds/desktop-components`）或 `src/utils/formatGroupedDisplay.ts`（金额、复合文案、阈值、矿工费）。**不**格式化：输入态、倒计时 `MM:SS`、ID 编号（如 `SIG-*`）。详案：`.cursor/rules/work.mdc` §6.4。

## EgDetail · Apply_Item（硬约束）

标准 Detail 行 **必须** `createDetailApplyItemRow(variantId, overrides)`（`@eds/desktop-components`）；选用 **无复制** catalog variant，**禁止** `showValueCopy`、复制挂件与 clipboard 集成。

- **仅可覆盖**：`key` / `title` / `value` / `tag` / `valueSymbolCrypto` / `valueIcon` / `valueSymbolAvatarName`
- **映射参考**：`src/scenes/tasks/approval/buildApprovalDetailSections.ts`
- **详案**：`../eds-desktop/packages/components/docs/detail-apply-item.md` · 约定 `eds-project.mdc` §7

## Top & Bottom Mask — 滚动顶底毛玻璃（硬约束 · 强推）

固定高度面板内内容溢出滚动时，顶/底栏毛玻璃 **禁止手搓**。

| 场景 | 必须 |
|------|------|
| Layout Skid 滑层 | `<EgLayout #skid>` + `<EgSkid>` slot；禁止外包 fixed 顶栏 |
| Popup / Flotation 自定义列表壳 | `useScrollChromeScrim` + `var(--effect-mask)` + `var(--eds-blur-bg)` |
| 改 mask 不透明度 | 回 **eds-desktop** 改 `effect-mask` token，再同步 |

- **详案**：`.cursor/rules/top&botton-mask.mdc`（`alwaysApply: true`）
- **DS 真源**：`../eds-desktop/.cursor/rules/top&botton-mask.mdc`
- **示例**：`SigningBatchNetworkPickerMenu.vue`、`SigningBatchPopupSlotChrome.vue`
- **验收**：eds-desktop `/components/skid` 长文本溢出滚动

**注意**：顶部未滚动时顶栏为实色；下滚后才出现毛玻璃——与 DS 一致，不是缺陷。

## 为何 Showcase 看起来对、这里却错？

Showcase 外层是 **Website token 壳**，部分未在 Desktop spec 定义的变量会从壳层继承，预览仍「凑合能看」。  
本仓库 **没有 Website 壳**，无效 token 会直接失效或继承 body 字号——必须在 Desktop spec 里找正确 token 名。

## 更多细节

- `README.md` — 集成与脚本
- `.cursor/rules/work.mdc` — 业务集成规范（Popup 动效 §7.1.1、数字 §6.4、**Top & Bottom Mask §6.5**）
- `.cursor/rules/top&botton-mask.mdc` — **滚动顶底毛玻璃强推**（`alwaysApply`）
- `.cursor/rules/eds-project.mdc` — 完整 EDS 约定（在 eds-desktop 仓库）
