# Shell Debug Platform（壳外调试）

**仅 DEV 挂载**（`AppRoot.vue` + `import.meta.env.DEV`）。生产构建不包含。

## 硬边界

| 允许 | 禁止 |
|------|------|
| `src/dev/shell-debug/**` | 改 `../eds-desktop/packages/**` |
| `AppRoot.vue` / `main.ts` 壳挂载 | 改 `src/scenes/**` 业务源码 |
| import 业务 **已 export** 的 store / 函数 | 业务 import `src/dev/**` |
| 只读 DOM / computedStyle（开发者模式） | 业务内 `if (DEV)` 分支 |
| Dev Inspect 面板内复制（`data-dev-inspect-copy`） | 业务页 clipboard / 复制按钮 |

## 两种模式

1. **开发者（Inspect）** — 打开 Dev Popover 自动进入点选；悬停 Popover 预览属性，点击 Pin 到 Dev 面板并可复制；期间 **拦截 `.app-preview` 内所有业务点击/导航**（模块菜单、ToolBar 等）。仅 `src/dev/shell-debug/inspect/**` 实现，不碰业务组件。
2. **QA（Scenario）** — Popover 标题 = 当前模块菜单页名；**仅**展示当前页注册的测试项列表；点「执行」调用公开 API 注入状态。与 Dev Inspect **完全独立**。

## 启动器

- 位于 `.app-preview` 右侧；Popover `320×360–530` adaptive；`teleport-to="body"`。
- Dev / QA 各自独立 Popover；QA 不受 Dev Inspect 拦截影响（`data-shell-debug-ui` 排除）。

## 扩展

- Inspect：`inspect/buildElementInspectInfo.ts` · `inspect/developerInspectSession.ts`
- Scenario：`registry.ts` + `scenarios/*.ts`
