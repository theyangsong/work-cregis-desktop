# work-cregis-desktop

Cregis 桌面端业务应用，基于 [eds-desktop](https://github.com/your-org/eds-desktop) 设计系统构建。

## 前置条件

- Node.js 20+
- pnpm 9+
- 同级目录存在 `eds-desktop`：

```
Projects/
  eds-desktop/
  work-cregis-desktop/   ← 本项目
```

## 快速开始

```bash
pnpm install
pnpm dev
```

打开 http://localhost:4173/（dev）。Pages 预览见下方 §GitHub Pages。

首次 `dev` / `build` 会自动构建 `eds-desktop` 的 tokens 与 components。

## 设计系统集成（Desktop only）

| 资产 | 包 | 说明 |
|------|-----|------|
| Tokens | `@eds/desktop-tokens` | 全局注入（`main.ts`）；排版优先 **Text Style 类** `.typography-*`（已含于主入口） |
| Components | `@eds/desktop-components` | dev/build alias 到 eds-desktop **源码** |
| Scenes（待接入） | `@eds/desktop-scenes` | 同属 Desktop 层 |

**100% Desktop 客户端** — 禁止引用 `@eds/website-*`，禁止从 eds-desktop **showcase** 复制 Website 壳层样式或 token 名。

常见陷阱：

- Showcase 预览在 `.desktopTokens` + Website 壳下运行，部分无效 Desktop 变量会从 Website 继承，**客户端没有这层兜底**。
- 排版 **优先** `.typography-body-medium` 等 Text Style 类（`@eds/desktop-tokens/text/styles`，`main.ts` 已引主入口即自带）；勿再本地复制 `list-field-typography.css` 一类文件。
- 仅当需要单轴覆盖时再写 `--eds-body-medium-size` 等语义变量；token 以 `packages/tokens/spec/typography/semantic.json` 为准（无 `footnote-medium-*`）。
- 不要 `@import '@eds/desktop-components/style.css'`（dist 快照易过期）；用 `src/styles/desktop-components-scope.css` 走源码。

### 排版迁移（Text Styles）

**旧写法**（三行变量，仍合法但不推荐）：

```css
.label {
  font-size: var(--eds-body-medium-size);
  font-weight: var(--eds-body-medium-weight);
  line-height: var(--eds-body-medium-line-height);
}
```

**新写法**（与 Figma Text Style 一致）：

```css
/* CSS Modules */
.label {
  composes: typography-body-medium from global;
  color: var(--text-base-primary);
}

/* 或模板 */
<p class="typography-footnote">…</p>
```

类名全集见 `eds-desktop/packages/tokens/spec/text/styles.json`（Display … Bar）。

`eds-desktop` 中说「同步」= 只 build/sync **Desktop packages**，与 showcase / Website 无关。

## 项目结构

```
src/
├── main.ts           # tokens / 组件样式 / 主题 / runtime 初始化
├── router/           # 路由
├── views/            # 页面
├── scenes/           # 业务场景（待 desktop-scenes 包接入）
└── styles/           # 全局基础样式（仅 reset + body，不覆盖组件）
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器（dev 走 eds-desktop **源码**，改 BatchBar 等组件可 HMR） |
| `pnpm build` | 生产构建 |
| `pnpm preview` | 预览构建产物 |
| `pnpm typecheck` | TypeScript 检查 |

## GitHub Pages 部署

仓库已配置 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)：`main` 分支 push 后自动构建并发布。

**前置：** CI 需同目录检出 [evergreen-design-system-desktop](https://github.com/theyangsong/evergreen-design-system-desktop)（workflow 内自动 clone 为 sibling `eds-desktop`）。

**预览地址（push 成功后）：** https://theyangsong.github.io/work-cregis-desktop/

本地模拟 Pages 构建（可与 `pnpm dev` 同时运行，preview 用 **4174** 端口）：

```bash
pnpm preview:pages
```

打开 http://localhost:4174/work-cregis-desktop/
