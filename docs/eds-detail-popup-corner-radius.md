# EgPopup Detail 圆角视觉丢失 — eds-desktop 改动方案

**日期：** 2026-08-25  
**提出方：** work-cregis-desktop（Desktop 客户端集成）  
**现象：** `uses="detail"` 审批/签名 Detail 弹窗（880×620）四角呈直角，与 Figma Popup Box（`radius-lg` + squircle）不一致。  
**业务侧：** 不在 work-cregis-desktop 打补丁；须 DS 修组件/token 语义。

---

## 1. 复现

1. work-cregis-desktop `pnpm dev`（4173）
2. Tasks → 待审批 → 打开任意 Detail（`ApprovalDetailPopup` / `EgPopup uses="detail"` + `EgDetail`）
3. 观察弹窗 **可见白底内容区** 四角为 90° 直角

**集成路径（业务仅标准用法，无圆角 override）：**

```vue
<!-- src/scenes/tasks/approval/ApprovalDetailPopup.vue -->
<EgPopup uses="detail" v-model:open="popupOpen">
  <EgDetail ... />
</EgPopup>
```

---

## 2. 根因（分层 + 裁剪）

### 2.1 外层 Popup Box **有**圆角

| 层 | 圆角 | 真源 |
|----|------|------|
| `EgPopup` → `EgTooltip` `panel-kind="popup"` | `panel-radius="radius-lg"` | `Popup.vue` |
| `.effect-popup-box` 语义 | `border-radius: var(--radius-lg)` | `tokens/spec/effect/semantic.json` |
| inline style | `borderRadius: var(--radius-lg)` | `Tooltip.vue` → `shellStyle` |

Figma 注释：`radius-lg` + 全局 `--corner-smoothing` 60% squircle。

### 2.2 内层 EgDetail **用直角实底盖住外层圆角**

`Detail.module.css` 注释写明容器为 `effect-popup-box`，内容 organism 不负责 Popup 边距：

- `.scrollBody`：`background: var(--box-page)`，**无** `border-radius`，铺满宽高
- `.toolbar` / `.toolbarSolid`：实底 `--box-page`，仅 `border-bottom-*-radius: var(--radius-md)`（12px），**小于** 外层 `radius-lg`（16px）
- `.root`：无 `overflow: clip/hidden`，不裁剪子层

`effect-popup-box` 语义为 `overflow: visible`，子节点可超出父级圆角轮廓。

### 2.3 用户看到的是「内层 page 填充」，不是 Popup Box 轮廓

外层仍有 `radius-lg` + 细描边 + 毛玻璃，但：

- 描边 `--material-same-white-quaternary` 对比度低
- 内层 opaque `--box-page` 铺满，**顶角完全直角**
- 底角 `radius-md` 与外壳 `radius-lg` 不一致，外壳底角仍被遮住

Dev Inspect 可验证：点 `effect-popup-box` 有 `border-radius: var(--radius-lg)`；点 `.scrollBody` 无圆角。

### 2.4 Popup 关闭 squircle（次要）

`Tooltip.vue` 根节点 `data-no-corner-smoothing`，Popup 不走 `corner-smoothing.js` squircle，仅普通 CSS 圆角。  
**单独修此项不能解决直角白底**；可与主方案一并评估。

---

## 3. 设计对齐目标

| 项 | 目标 |
|----|------|
| 可见轮廓 | Detail 弹窗四角与 Figma **Popup Box** 一致（`radius-lg`） |
| 顶栏/工具栏 | sticky 底栏底角与外壳同半径，无「内框方、外框圆」 |
| Squircle | 与 Container / Flotation 一致，或文档明确 Popup Detail 是否 opt-out |
| 业务集成 | **零** business CSS；仅消费 DS 组件 |
| 其它 uses | `dialog` / `verify` / `custom` 不被 Detail 改动误伤 |

---

## 4. 方案对比

### 方案 A（推荐）：EgDetail 继承并裁剪 Popup 圆角

**思路：** Detail 作为 Popup Box 唯一内容时，根节点继承外壳半径并 `overflow: clip`，实底不再溢出。

**eds-desktop 改动示意：**

```css
/* Detail.module.css */
.root {
  border-radius: inherit;
  overflow: clip; /* 或 hidden；与 Popup.module.css overflow: clip 对齐 */
}

.toolbar {
  border-bottom-right-radius: inherit;
  border-bottom-left-radius: inherit;
  /* 删除 var(--radius-md) 硬编码 */
}
```

**可选增强：** `EgTooltip` shell 显式下发 token，供子 organism 消费（避免 `inherit` 链被中间层打断）：

```css
/* Tooltip.vue shellStyle 已有 borderRadius，可同步： */
--eds-popup-panel-radius: var(--radius-lg);
```

Detail 改用 `border-radius: var(--eds-popup-panel-radius, inherit)`。

| 优点 | 风险 |
|------|------|
| 改动面小，符合「内容贴 Popup Box 内缘」 | 须确认 Detail 非 Popup 场景（若有）不受影响 |
| 不改 effect semantic 全局 overflow | Showcase 需回归 Detail + 翻页 toolbar |

---

### 方案 B：Popup Detail 壳层统一裁剪

**思路：** 在 `Popup.module.css` 的 `.detailShell` 分支裁剪，不扩散到全部 `effect-popup-box`。

```css
.detailShell:global(.effect-popup-box) {
  overflow: clip;
}

.detailShell :global(.eds-tooltip-panel),
.detailShell :global(.eds-popup-box-content) {
  border-radius: inherit;
  overflow: clip;
}
```

| 优点 | 风险 |
|------|------|
| 逻辑集中在 EgPopup | 中间层 `eds-tooltip-panel` 是否打断 inherit 需实测 |
| EgDetail 可少改 | 与 `panelFlush` / verify 等路径需隔离 |

---

### 方案 C：改 effect semantic 全局 `overflow: hidden`

**不建议。** `effect-popup-box` 当前 `overflow: visible` 可能服务浮层/阴影；全局改会影响 Popover 系复用与文档约定。

---

### 方案 D：仅去掉 `data-no-corner-smoothing`

**不足。** 只影响 squircle 曲率，**不解决** `--box-page` 直角铺满；作 A/B 的补充项，不作主修复。

---

## 5. 推荐实施（A + 可选 D）

### 5.1 必做

1. **`packages/components/src/organisms/detail/Detail.module.css`**
   - `.root`：`border-radius: inherit` + `overflow: clip`
   - `.toolbar`：底角改为 `inherit` 或 `var(--radius-lg)`，与 Popup Box 一致

2. **`packages/components` Showcase**
   - Popup Preview → Detail 目目测四角 + 底栏 sticky 滚动

3. **文档**
   - `docs/detail-apply-item.md` 或 Popup 集成说明补一句：Detail 内容区圆角由 Popup Box 继承，业务勿设 `border-radius: 0`

### 5.2 可选

4. **`Tooltip.vue`**
   - Detail / popup 场景评估是否移除 `data-no-corner-smoothing`，或仅 `uses="detail"` 的 EgPopup 内 EgTooltip 启用 squircle

5. **CSS 变量**
   - 新增 `--eds-popup-panel-radius`（panelRadius prop 解析结果），Detail / 未来 Popup 插槽统一引用

### 5.3 不建议业务侧

- work-cregis-desktop `detailPopupChrome.module.css` 等处 **禁止** 私设圆角/overflow 绕过 DS

---

## 6. 验收标准

在 **无 Website 壳** 的 Desktop 集成（work-cregis-desktop 4173）：

- [ ] 待审批 Detail：四角可见 `radius-lg` 圆弧（非 90° 白底）
- [ ] 底栏 sticky + 滚动中：底角与外壳对齐，无直角「内框」露出
- [ ] 翻页 toolbar（`toolbar-page-key`）：圆角不随翻页丢失
- [ ] `uses="verify"` / `uses="custom"` 批处理弹窗：圆角行为不变
- [ ] Showcase Popup Detail 与 4173 一致
- [ ]（若启用 squircle）与 `effect-container-box` 预览框曲率风格一致

**Dev Inspect 断言（可选自动化）：**

- `effect-popup-box` computed `border-radius` = `16px`（或 `--radius-lg` 解析值）
- `.eds-detail` 根节点 `border-radius` 与外壳一致，非 `0px`
- `.scrollBody` 不再在四角超出父级 `border-radius` 边界（可用 getBoundingClientRect + 角点采样）

---

## 7. 涉及文件索引（eds-desktop）

| 文件 | 动作 |
|------|------|
| `packages/components/src/organisms/detail/Detail.module.css` | 主修 |
| `packages/components/src/organisms/detail/Detail.vue` | 仅当需挂 class / data 属性区分场景时 |
| `packages/components/src/templates/popup/Popup.module.css` | 方案 B 备选 |
| `packages/components/src/templates/popup/Popup.vue` | 方案 B / panelRadius 变量 |
| `packages/components/src/molecules/tooltip/Tooltip.vue` | 可选 squircle / CSS 变量 |
| `packages/tokens/spec/effect/semantic.json` | **不改** overflow（除非维护者书面例外） |
| `apps/showcase/**` Popup Detail 预览 | 回归目测 |

---

## 8. 业务同步方式

eds-desktop 合并后：

1. work-cregis-desktop 更新 `../eds-desktop` pin / link
2. `pnpm install` + 重启 4173，硬刷新
3. 4174：`pnpm preview:pages` parity 目测同一 Detail 场景

无需改 `ApprovalDetailPopup.vue` / `SigningDetailPopup.vue`。

---

## 9. 参考代码位置（当前 HEAD）

```
eds-desktop/packages/tokens/spec/effect/semantic.json     → effect-popup-box border-radius
eds-desktop/packages/components/src/templates/popup/Popup.vue → panel-radius="radius-lg"
eds-desktop/packages/components/src/molecules/tooltip/Tooltip.vue → data-no-corner-smoothing
eds-desktop/packages/components/src/organisms/detail/Detail.module.css → scrollBody / toolbar
work-cregis-desktop/src/scenes/tasks/approval/ApprovalDetailPopup.vue → 集成样例
```

---

## 10. GitHub 方案核查（eds-desktop `c5e577c`）

**远程 commit：** `theyangsong/eds-desktop` `c5e577c`（展示站升级，2026-08-25）

已合并（方案 A + Tooltip 补链）：

| 文件 | 改动 |
|------|------|
| `Detail.module.css` | `.root` `border-radius: inherit` + `overflow: clip`；`.toolbar` 底角 `inherit` |
| `Tooltip.module.css` | 所有 `effect-popup-box` 的 panel / `eds-popup-box-content` 继承圆角 + `overflow: clip` |

**仍缺一环（导致 4173 仍方角）：** — **已补** `9843744`

work-cregis-desktop 在 `EgPopup` 插槽外包了一层 **`detailHost`**（`detailPopupChrome.module.css`），位于 `eds-popup-box-content` 与 `EgDetail` 之间。该 div 无圆角，`EgDetail.root` 的 `inherit` 会接到 **0px**。

| 节点 | 仅 `c5e577c` 时 computed | 补全后 |
|------|--------------------------|--------|
| `eds-popup-box-content` | `16px` | `16px` |
| `detailHost` | **`0px`** | `16px` |
| `.eds-detail.root` | **`0px`** | `16px` |

**必补（方案 B 延伸，eds-desktop）：**

```css
/* Popup.module.css — .detailShell */
.detailShell :global(.eds-popup-box-content) > * {
  border-radius: inherit;
  overflow: clip;
}
```

业务侧 **禁止** 在 `detailPopupChrome.module.css` 私打圆角；须 DS 侧上述规则进 remote。

---

## 11. 本地同步（work-cregis-desktop + 同级 eds-desktop）

dev/build 通过 `link:../eds-desktop` + Vite alias 读 **DS 源码**；4173 须本地 eds 含 §10 补链后再验。

**完整 inherit 链：**

| 层 | 文件 |
|----|------|
| `effect-popup-box` shell | `Tooltip.vue` inline `border-radius: var(--radius-lg)` |
| `eds-tooltip-panel` | `Tooltip.module.css` |
| `eds-popup-box-content` | `Tooltip.module.css` + `Popup.module.css` `.detailShell` |
| **`detailHost`（业务 wrapper）** | **`Popup.module.css` `> *`（§10 必补）** |
| `EgDetail.root` / `.toolbar` | `Detail.module.css` |

改完 DS 后重启 `pnpm dev` 并硬刷新 4173。Pages CI pin 须含 `c5e577c` + `9843744`（detailHost `> *` 补链）。
