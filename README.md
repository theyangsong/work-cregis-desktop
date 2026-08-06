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

打开 http://localhost:5178/

首次 `dev` / `build` 会自动构建 `eds-desktop` 的 tokens 与 components。

## 设计系统集成（Desktop only）

| 资产 | 包 | 说明 |
|------|-----|------|
| Tokens | `@eds/desktop-tokens` | 全局注入（`main.ts`）；排版用 spec 内语义角色 |
| Components | `@eds/desktop-components` | dev/build alias 到 eds-desktop **源码** |
| Scenes（待接入） | `@eds/desktop-scenes` | 同属 Desktop 层 |

**100% Desktop 客户端** — 禁止引用 `@eds/website-*`，禁止从 eds-desktop **showcase** 复制 Website 壳层样式或 token 名。

常见陷阱：

- Showcase 预览在 `.desktopTokens` + Website 壳下运行，部分无效 Desktop 变量会从 Website 继承，**客户端没有这层兜底**。
- 排版 token 以 `packages/tokens/spec/typography/semantic.json` 为准（如 `--eds-footnote-size`，无 `footnote-medium-*`）。
- 不要 `@import '@eds/desktop-components/style.css'`（dist 快照易过期）；用 `src/styles/desktop-components-scope.css` 走源码。

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

本地模拟 Pages 构建：

```bash
VITE_BASE_PATH=/work-cregis-desktop/ pnpm build
pnpm preview --base /work-cregis-desktop/
```
