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

## 设计系统集成

| 资产 | 包 |
|------|-----|
| Tokens | `@eds/desktop-tokens` |
| Components | `@eds/desktop-components` |
| Scenes（待接入） | `@eds/desktop-scenes` |

应用 UI 100% 使用 Desktop 设计系统，不引用 `eds-website`。

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
| `pnpm dev` | 开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm preview` | 预览构建产物 |
| `pnpm typecheck` | TypeScript 检查 |
