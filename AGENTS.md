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

## 对齐引用库（硬约束）

**引用库** = 同级目录 `../eds-desktop` 的 `packages/tokens`、`packages/components`（dev 经 Vite alias 消费源码）。用户说「对齐引用库」或组件行为与 Showcase 不一致时，**必须先读引用库再改业务代码**。

| 变更类型 | 改哪里 | 不要 |
|----------|--------|------|
| DS 组件行为（Tooltip、BatchBar、DataList、CryptoAddress…） | `eds-desktop/packages/components/**` | 在业务项目手搓平行实现 |
| 业务 list-field 薄封装（`TasksListField*`） | 对齐 Showcase 集成方式：`ListFieldPreviewPanel.vue` | 误用 `EgListFieldHashLikeLine`（哈希/编号 + 复制）渲染发起人、钱包、金额等普通文本 |
| 可 sync 的 list-field 辅助 | 随 sync 或手动 diff showcase 同名文件后合并 | 整文件覆盖 `listFieldCryptoSampleAddresses.ts`（§ list-field 本地扩展） |

**Tooltip / 溢出文本**：
- **普通文本**（发起人、钱包名、金额、Swap…）→ `EgListFieldOverflowText`（仅列宽溢出时只读 Tooltip，**无复制**）
- **哈希 / 编号 / 地址别名** → `EgListFieldHashLikeLine` 或 `CryptoAddressSide`（可复制 Menu）
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
   .effect-container-box               ← 真实 Desktop 客户端边界
   └─ EgContainer → EgLayout → 业务页
```

- **业务 UI、Desktop token、布局/滚动/浮层边界**：限定在 `.app-preview`（及其子树）内。
- **`#app`**：仅负责把预览框居中、尺寸 clamp（见 `global.css` 的 `--app-preview-*`）；勿把 `#app` 当作业务根容器写样式或挂载全局浮层。
- **预览框外圈**（`body` 的 `--cregis-shell-*` 网格/光晕）：模拟浏览器宿主环境，不属于客户端内容。

## 为何 Showcase 看起来对、这里却错？

Showcase 外层是 **Website token 壳**，部分未在 Desktop spec 定义的变量会从壳层继承，预览仍「凑合能看」。  
本仓库 **没有 Website 壳**，无效 token 会直接失效或继承 body 字号——必须在 Desktop spec 里找正确 token 名。

## 更多细节

- `README.md` — 集成与脚本
- `.cursor/rules/eds-project.mdc` — 完整 EDS 约定
