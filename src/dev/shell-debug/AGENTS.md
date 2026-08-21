# Shell Debug Platform（壳外调试）

**仅 DEV 挂载**（`AppRoot.vue` + `VITE_SHELL_DEBUG !== 'false'`）。`pnpm dev`（4173）与 Pages preview（4174，`VITE_BASE_PATH=/work-cregis-desktop/`）在 Shell Debug 开启时均包含壳层；**4174 production 还须** `vite.config.ts` 的 `__VUE_PROD_DEVTOOLS__`（与 Shell Debug 同开），否则 Vue 3.5 不在 DOM 上挂 `__vueParentComponent`，Inspect R2 / DataList 适配在 4174 失效。

## 硬边界

### 互不影响（双向隔离）

壳外工具与 `.app-preview` 内业务 **完全解耦**，任一方向的改动不得牵连另一方：

| 方向 | 规则 |
|------|------|
| 壳 → 业务 | **【禁止】** 为 Inspect / QA / Popover 去改业务布局、padding、挂载点、样式或组件 API（含 `src/views/**`、`src/scenes/**`、`global.css` 业务区）。Dev 面板间距、滚动、字号等 **只在** `src/dev/shell-debug/**` 内用 `:global(...)` 或 `teleport-to="body"` 解决。 |
| 业务 → 壳 | **【禁止】** 业务 import `src/dev/**`；业务内 `if (DEV)` 分支；为壳外工具改 EgLayout / 列表页结构。壳外只 **只读** DOM / `getComputedStyle`，或调用业务 **已 export** 的 store / 函数（Scenario 注入）。 |

**反例（已发生）**：在 `AppShellView.vue` 加 `.app-shell-body` padding 以对齐 Inspect Popover → 业务列表四周出现空白。**正确**：padding 写在 `ShellDebugLauncherAnchored.module.css` 的 `[class*='contentSlotPaddingTop']` 等 Dev 选择器内。

**Inspect 识别（点谁是谁）** — 真源 `inspect/inspectNamingRules.ts`，全站统一五条规则，按序取第一条命中：

| # | 规则 | 结果 |
|---|------|------|
| R1 | 节点在原子图形宿主内（`.eds-icon` / `.eds-crypto` / `.eds-avatar`） | 该宿主组件 |
| R2 | 节点自身带 catalog `eds-*` 根类，**或** 节点就是**任意** DS 包组件的 Vue DOM 根 | 该组件 + props |
| R3 | 节点是排版文本叶子 | **Text** |
| R4 | 节点带某 DS 组件 CSS Module 的**具名 Figma 组件区域**类（`edsInspectComponentRegions.ts`） | 该区域名 |
| R5 | 其余 | HTML 标签（**Div** / **Span** / **Td**…） |

**一层一名**：「内层要不要组件名」只看 **它自己是什么**，不看它被谁包着 —— 自己是 DS 组件 → 组件名（R2）；自己只有 CSS Module 类 → HTML 标签（R5）。

**「来自设计系统」= 节点自己就是 DS 组件**，不是「被 DS 组件渲染」。`_functionalGroup_` 由 `ToolBar.vue` 渲染，但它自己只是 `<div>` → `Div`。

### 点不到的父层 → 属性面板首行「祖先」

真源 `inspect/resolveInspectAncestorName.ts`，由 I12 守住。

有些组件根**没有任何可点像素**：`ToolBar.module.css` 的 `.root` / `.chrome` 是 `width: 100%` 且无内边距，被 `.raw` 完全铺满，点工具栏恒命中 `.raw`（`Div`）。Paginer / Skid / NavBar 的固定栏同理。**祖先是存在的，只是点不到** —— 所以它作为**独立一行属性**交代归属，而不是混进名字：

| 点击节点 | 名字 | 祖先 |
|---|---|---|
| `div._raw_`（ToolBar 固定栏） | `Div` | `ToolBar` |
| `div._functionalGroup_` | `Div` | `ToolBar` |
| `span._iconSlot_` | `Span` | `IconButtonPro` |
| `header.eds-tool-bar` | `ToolBar` | `Layout` |

**【必须】** 取**最近具名层**（`resolveInspectNamedLayerLabel`，R5 纯标签层返回 `null`），否则祖先会显示成一串 `Div`。**【必须】** 恒为属性面板**第一条** item，且组件 props / 元素属性**两条路径**都要加（面板二选一渲染）。

**【禁止】** 让祖先回流进 `primaryLabel` / `componentChain` / props —— 一旦回流，父子同名 + 参数错位的老问题立刻复发。历史上试过「外壳类借名」方案（`eds-frosted-page-chrome` → `ToolBar`）：白名单难以稳定界定（业务也会打 `eds-popup-inner-backdrop`、`eds-scroll-area-hidden-scrollbar` 是纯行为工具类），已废弃，勿重提。

### 【禁止】任何形式的祖先取名

三种历史回归写法由 I2 拦住：

| 回归写法 | 后果 |
|---|---|
| `root.contains(element)` | 业务 slot 节点被标成 Detail / Popup / DataList |
| 沿 `parentElement` 回溯最近具名层 | ToolBar 根与内部 `_functional_` 容器同名 |
| 按渲染归属（`__vnode.ctx`）继承 | 同上，只是判据换成 Vue 内部字段 |

父级与子级同名 → 属性区与代码片段取到同一份参数，这是本模块反复回归的根因。组件内部的普通容器（ToolBar 的 `_functional_`、Popup 的 `_stage_`、Detail 的 `_itemTitle_`、`td` 里的 `_cellContent_`）在 DS 里就是 `<div>`，Figma 里也没有对应组件 —— 一律 R5 显示 HTML 标签。

**真嵌套组件允许同名**：两个嵌套的 `EgLayout`（外层 + `eds-layout-chrome-overlay`）都显示 `Layout` —— 它们是**两个独立组件实例**，各带自己的 props，不是子节点借父级的名。与「非组件子节点借名」是两回事，勿当 bug 修。

DS 组件识别用 dev 下 plugin-vue 注入的 `__file`（含 `eds-desktop/packages/components/`），build 下回退 catalog 名 —— 覆盖未入 catalog 的 DS 内部组件。

**R2 三级**（`resolveComponentRootCandidate`）：

1. 节点自身 catalog `eds-*` 根类 → catalog 组件 + 精选 props
2. 节点是已入 catalog 的 DS 组件的 Vue DOM 根 → 同上
3. 节点是**任意** DS 包组件的 Vue DOM 根 → 组件自己的名字 + 通用 props

**【必须】** 保留第 3 级。DS 有 105 个组件、其中 **33 个未入 catalog**（`CryptoAddress`、`Verify`、`MinerFee*Panel`、`DataListHeaderCell`…）。少了这一级，它们的根会掉进 R5 HTML 标签 —— 点弹窗里的 `Verify` 显示 `Popup`，这正是「组件名重复 → 参数相同 → 代码片段参数不对」的来源。未入 catalog 只意味着「没有精选 props」，**不影响命名**。

**同一组件多 Figma 角色** → catalog 的 `resolveDisplayName` hook，**【禁止】** 在 resolver 里写逐组件 `if`。现有一例：`EgTooltip` 被 EgPopup / 预览壳复用为盒子，按 `panelKind` 取名：

| `panelKind` | 名字 | 依据 |
|---|---|---|
| `popup` | **PopupBox** | tokens `effect/semantic.json` → `"title": "Popup Box（弹窗面板）"` |
| `container` | **ContainerBox** | 同上 → `"Container Box（容器面板）"` |
| 其余（flotation / subtle / molde） | Tooltip | Tooltip 本职 |

历史上这里有个 `isInspectShellTooltip` 全局跳过补丁（旧的**子树借名**模型下用来防止 Tooltip 吞掉整个弹窗内容）。R2 改成 `root === element` 后它已无必要，且会把弹窗壳推进 R5、显示成 `Div` —— 已删除，由 I10 守住不得回归。

**【禁止】** 用 `root.contains(element)` / DOM 祖先链判定归属 —— 那会把业务 slot 节点也标成 Detail / Popup / DataList，这是「名字全一样、参数也一样」的根因。

**【禁止】** R4 区域层复制组件 Vue props —— props 只属于 R2 组件根，具名层只展示自己的布局 / 样式（面板自动隐藏无属性的 `<EgX />` 用法块）。

**【禁止】** 为普通 auto-layout 容器编造区域名（曾有 `ToolBarFunctional` / `SkidPanel` / `raw`→`Paginer`，DS 里它们只是 `<div>`，且 `raw`→`Paginer` 与 R5 HTML 标签重复）。R4 收录门槛见该文件头注释。

**【禁止】** 在 `buildElementInspectInfo` 或 UI 层另起命名 fallback —— 命名只有 `resolveInspectTarget` 一条路径。

布局 / 样式代码永远对应当前点击节点（`resolveInspectStyleTarget.ts`）。

**逐层示例**（Paginer / Detail / DataList 实测层级）：

| 点击节点 | 名字 | 命中规则 |
|---|---|---|
| `div.app-preview`（`effect-container-box`） | **ContainerBox** | R2 + 角色 hook |
| `div.app-popup-overlay-host`（业务） | Div | R5 |
| `div.eds-popup` | Popup | R2 |
| `div._stage_`（遮罩层） | Div | R5 |
| `div.effect-popup-box._detailShell_`（880×620 盒） | **PopupBox** | R2 + 角色 hook |
| 盒内 `div.eds-detail` | Detail | R2 |
| `div._toolbar_` | Div | R5 |
| `div._itemRow_` | Apply_Item | R4（带 title / value / tag） |
| `div._itemTitle_` / `._itemValue_` | Div | R5 |
| `span._itemTitleText_` / `._itemValueText_` | Text | R3 |
| 行内 `span.eds-tag` | Tag | R2 |
| 行内 `.eds-icon` 及其 `svg` / `path` | Icon | R1 |
| `header.eds-tool-bar` | ToolBar | R2 |
| `div._chrome_` / `._raw_`（铺满 ToolBar 根，祖先 = ToolBar） | Div | R5 |
| `div._functional_` / `._functionalGroup_` / `._operation_` | Div | R5 |
| `button.eds-icon-button-pro` | IconButtonPro | R2 |
| 其内 `span._iconSlot_`（IconButtonPro 模板里的普通 span） | Span | R5 |
| 再其内 `span.eds-icon-button`（嵌套 `EgIconButton as="span"`） | IconButton | R2 |
| 再其内 `.eds-icon` / `svg` | Icon | R1 |
| `div.eds-tooltip-panel`（Tooltip 模板里的普通 div） | Div | R5 |
| `footer.eds-paginer` | Paginer | R2 |
| `div._raw_`（frosted 条，祖先 = Paginer） | Div | R5 |
| `div._paginationRaw_` | Pagination | R4 |
| `button.eds-pagination-item` | PaginationItem | R2 |
| 页码数字 `span._label_` | Text | R3 |
| `td`（DataListColumn 根） | DataListColumn | R2 |
| `td` 内 `div._cellContent_` | Div | R5 |
| 单元格里业务 `div.list-field-amount` | Div | R5 |
- **布局 / 样式代码（Figma Dev Mode 式）**：
  - **识别**：点谁是谁（见上表）；`componentChain` 沿 DOM 祖先，仅供内部。
  - **取值**：`inspectDeclaredStyles` 按 **特异性 + 文档顺序** 级联，读取规则内 **原始声明**（`var(--*)` 直出）；禁止 computed 反查误配。
  - **输出**：`buildDeclaredInspectCode` 对 **当前点击节点** 取 declared 样式（非外层 DS root）；**declared `var(--*)` 优先**
  - **合并**：`buildInspectCodeSections` — 所有 DS 组件 **统一** 先出布局 + 样式；Text 追加「字体排版」（declared 优先）；Icon / Crypto 等仅追加 SVG 等专用块。
- **壳层 Tooltip**：`.app-preview` 根 `panelKind=container` 与 EgPopup 外壳 Tooltip **跳过**（见 `resolveEdsComponentInspect.ts`）。

**Text 识别**：仅 **typography 叶子**（`span` / `p` / `label` 等，含 Bar 子像素宿主）→ **Text**；`td` / `div` / `button` 等容器或组件根 → DS 组件 catalog 或元素属性，**不**判为 Text。

**Token 展示原则**：布局 / 样式代码 **优先输出 stylesheet 原始 `var(--*)` 声明**；仅 Text 在无 declared 排版时回退 typography role 匹配。属性面板 token 仍经 `resolveDesignToken.ts`；**禁止**用 computed 色值反查冒充 DS 声明。

**Text 样式名**：按 **视觉有效字号**（含 Bar 11px 的 2×+`scale(0.5)` / `zoom(0.5)` 子像素处理）匹配 Figma Text Style（`typographyInspectMatch.ts`），属性「样式」与「字体排版」区块输出对应 role 的 `--eds-*` token，而非 DOM 上的 2× computed 值。

**动效（属性面板）**：属性面板 **始终** 含 **动效** 行；仅 **当前点击节点自身** 挂完整 motion semantic class 时值为 `.motion-ease.is-hover` 等，否则为 **无**。禁止继承祖先 motion；点组件内层容器若无自身 class 则显示 **无**。

| 允许 | 禁止 |
|------|------|
| `src/dev/shell-debug/**` | 改 `../eds-desktop/packages/**` |
| `AppRoot.vue` **仅** DEV 异步挂载 `ShellDebugPlatform` | 改 `src/views/**`、`src/scenes/**` 业务源码 |
| `main.ts` 壳启动链（若需） | 为 Dev/QA 改业务 EgLayout slot、ToolBar、列表容器 |
| import 业务 **已 export** 的 store / 函数 | 业务 import `src/dev/**` |
| 只读 DOM / computedStyle（开发者模式） | 业务内 `if (DEV)` 分支 |
| Dev Inspect 面板内复制（`data-dev-inspect-copy`） | 业务页 clipboard / 复制按钮 |

## 两种模式

1. **开发者（Inspect）** — 打开 Dev Popover 自动进入点选；悬停 Popover 预览属性，点击 Pin 到 Dev 面板并可复制；期间 **拦截 `.app-preview` 内所有业务点击/导航**（模块菜单、ToolBar 等）。仅 `src/dev/shell-debug/inspect/**` 实现，不碰业务组件。
2. **QA（Scenario）** — Popover 标题 = 当前模块菜单页名；**仅**展示当前页注册的测试项列表；点「执行」调用公开 API 注入状态。与 Dev Inspect **完全独立**。

## 启动器

- 位于 `.app-preview` 右侧；Popover `320×360–530` adaptive；`teleport-to="body"`。
- Dev / QA 各自独立 Popover；QA 不受 Dev Inspect 拦截影响（`data-shell-debug-ui` 排除）。
- **Dev 进入点选时保留业务浮层**：Dev 启动器使用 `EgAnchoredTooltip` + `openPanel()`（绕过 `EgAnchoredPopover` 的 `closeAllAnchoredTooltips`）；`installShellDebugFloatLayerGuard` 使点击壳层 UI 不触发业务 click Popover 的外部关闭。

**Catalog 覆盖**：`node scripts/verify-shell-debug-inspect-catalog.mjs` 对照 `../eds-desktop` 组件根 `eds-*` 与 `edsInspectCatalog.ts`；缺条目时补 catalog，勿再开 CSS Module 借名后门。

**Inspect 命名**：`node scripts/verify-shell-debug-inspect-naming.mjs` —— 12 项全局不变量（规则顺序、归属判据、region 真源 / 不重名 / 不覆盖组件根、旧机制已清、样式对准点击节点、片段匹配、单一命名路径、任意 DS 组件根有自己的名字、多角色走 catalog hook、祖先只作属性首行）。已接入 `predev` / `prebuild`，与 catalog 覆盖脚本同时跑。

**4174 Inspect 与 4173 对齐**：R2 / DataList 实例读取依赖 DOM 上的 `__vueParentComponent`（`inspectIdentity.ts` 的 `findVueInstancesWithDomRoot`）。Vue 3.5 production 默认不写入，须在 Shell Debug 构建中开启 `__VUE_PROD_DEVTOOLS__`（见 `vite.config.ts`）；`verify-pages-artifact.mjs` 会检查 bundle 含 `__vueParentComponent`。

**DataList 适配（Inspect）**：仅当 **点选节点在 `.eds-data-list` 子树内** 时，Dev 面板在 **属性** 与 **用法** 之间展示 **DataList 适配** 组（`.eds-popup` / `.eds-detail` 内 **不展示**）。每可见列一行（`第1列` …），值为 `min-width: xxxpx`，参与 flex 均分则后缀 `（flex）`。**【必须】** 仅在 **Pin（pointerdown 固定）** 时计算（`buildElementInspectInfo` 的 `includeAdaptive: true`）；hover 不算，避免 Inspect 模式鼠标移动卡死。

## 扩展

- Inspect：`inspect/buildElementInspectInfo.ts` · `inspect/developerInspectSession.ts`
- Scenario：`registry.ts` + `scenarios/*.ts`
