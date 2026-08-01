# 业务场景（Scenes）

`@eds/desktop-scenes` 发布后将在此目录接入业务场景化组件。

接入方式（示例）：

```json
"@eds/desktop-scenes": "link:../eds-desktop/packages/scenes"
```

```ts
import { SomeScene } from '@eds/desktop-scenes';
```

在此之前，页面请使用 `@eds/desktop-components` 中的 Templates / Organisms 组装。
