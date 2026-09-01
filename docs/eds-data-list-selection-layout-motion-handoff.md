# EgDataList 批选宽度动效 · EDS 交接包

> 状态：实现已落在本地 `../eds-desktop`，待 EDS 维护者 review / commit。  
> 业务消费方式不变：继续从 `@eds/desktop-components` 使用 `EgDataList`。  
> 规范真源：本仓库 `.cursor/rules/work.mdc` §7.6。

## 1. 结论：可复用，但不应成为业务直接挂载的独立动效组件

这套动效横跨以下职责：

- `<colgroup>` 的列宽预算；
- responsive column 的常态 / 批选态列集合；
- checkbox 列与数据列的 DOM 生命周期；
- 表头、行、loading、virtual spacer、blank row 的 `colspan`；
- 选中逻辑值与退场视觉快照；
- Batch Bar 出入场；
- 动画期间的 overflow / Tooltip 测量冻结；
- Resize、Skid、断点和 reduced-motion。

独立视觉组件无法只靠 props 安全控制这些结构。若业务在 `EgDataList` 外再包一层
`EgSelectionMotion`，它既拿不到合法的 `<colgroup>` 位置，也无法保证 header/body
列数一致，最终会把 DS 内部布局协议泄漏到业务。

正确封装边界：

```text
业务
└─ EgDataList（唯一公开 API）
   ├─ DataList responsive-column policy
   ├─ DataList selection state / snapshot
   └─ selection-layout motion controller（DS 内部，可复用）
      ├─ 常驻 key 集
      ├─ idle / active 两套目标宽度
      ├─ CSS transition phase
      └─ settle / reduced-motion
```

因此：

1. **公共可复用组件就是 `EgDataList`**；
2. 业务不新增 import，不传动效距离 / 时长 / easing；
3. 若 EDS 后续出现第二个需要“常驻子项 + 两套宽度端点”的 table/grid，再把 controller
   抽成内部 composable；在只有一个消费方时不应提前发布公共组件 API。

## 2. 业务侧最终 API

```vue
<script setup lang="ts">
import { EgDataList } from '@eds/desktop-components';

const selectMode = ref(false);
const selectedRows = ref([]);
</script>

<template>
  <EgDataList
    v-model:select-mode="selectMode"
    :data-list="rows"
    @update:selected-list="selectedRows = $event"
  >
    <!-- EgDataListColumn definitions -->
  </EgDataList>
</template>
```

业务只负责：

- 进入 / 退出时切换 `selectMode`；
- 消费 `update:selected-list`；
- 执行批处理业务动作。

业务不得负责：

- 40px checkbox column；
- 16px checkbox content shift；
- 300ms transition；
- responsive 列端点；
- `<col>` width；
- selection exit snapshot；
- animation settle / overflow freeze。

## 3. 当前可领取代码

代码已落在：

```text
../eds-desktop/packages/components/src/organisms/data-list/
├─ DataList.vue
└─ DataList.module.css
```

相关既有依赖：

```text
../eds-desktop/packages/components/src/organisms/data-list/useResponsiveColumns.ts
../eds-desktop/packages/components/src/utils/overflowMeasureDuringLayout.ts
../eds-desktop/packages/tokens/spec/motion/recipe.json
```

当前相对 EDS HEAD 的隔离 diff：

```text
DataList.module.css  +15
DataList.vue         +35 / -113
合计                 +50 / -113
```

仅查看 / 导出这次 DataList 改动：

```shell
cd ../eds-desktop
git diff HEAD -- \
  packages/components/src/organisms/data-list/DataList.vue \
  packages/components/src/organisms/data-list/DataList.module.css
```

这两个文件之外的 miner-fee 等未提交改动不属于本交接包，EDS 维护者领取时必须按上述路径
隔离，避免把无关变更混进同一 review。

## 4. 实现原理

### 4.1 两套稳定端点

常态端点：

```typescript
idleSlotIndices = visibleSlotsForSelectOffset(0);
idleColumnWidthsBySlot = columnWidthsBySlot(idleSlotIndices, 0);
```

批选端点：

```typescript
selectModeSlotIndices = visibleSlotsForSelectOffset(SELECT_COLUMN_WIDTH);
selectModeColumnWidthsBySlot = columnWidthsBySlot(
  selectModeSlotIndices,
  SELECT_COLUMN_WIDTH,
);
```

常量：

```typescript
const SELECT_COLUMN_WIDTH = 40;
const SELECT_COLUMN_ANIM_MS = 300;
const SELECT_CONTENT_SLIDE_PX = 16;
```

批选态放不下的 idle 列不从 DOM 移除，而是在 active 端点映射为 `0px`：

```typescript
const columnLayoutWidths = computed(() =>
  idleSlotIndices.value.map((slotIndex) => {
    const idleWidth = idleColumnWidthsBySlot.value.get(slotIndex) ?? 0;
    const activeWidth = selectModeColumnWidthsBySlot.value.get(slotIndex) ?? 0;
    return formatColWidthPx(selectMode.value ? activeWidth : idleWidth);
  }),
);
```

Vue 每次 toggle 只提交一次目标数组；没有响应式逐帧插值。

### 4.2 DOM 常驻

以下节点始终存在：

- checkbox `<col>`；
- select header cell；
- 每个 rendered row 的 select cell；
- `idleSlotIndices` 对应的所有数据列。

checkbox column：

```vue
<col
  :class="styles.layoutColumn"
  :style="{ width: selectMode ? '40px' : '0px' }"
/>
```

数据列：

```vue
<col
  v-for="(width, index) in columnLayoutWidths"
  :key="index"
  :class="styles.layoutColumn"
  :style="{ width }"
/>
```

所有 loading / virtual spacer / blank row 的 `colspan` 恒为：

```typescript
bodyColumns.length + 1
```

不能再根据“select cell 是否挂载”动态加减。

### 4.3 浏览器原生过渡

```css
.layoutColumn {
  transition: width var(--motion-duration-shift) var(--motion-easing-standard);
}

.headerSelect,
.cellSelect {
  opacity: var(--eds-data-list-select-content-opacity);
  transform: translateX(var(--eds-data-list-select-content-translate-x));
  transition:
    opacity var(--motion-duration-shift) var(--motion-easing-standard),
    transform var(--motion-duration-shift) var(--motion-easing-standard);
  pointer-events: none;
}

.rootSelectMode .headerSelect,
.rootSelectMode .cellSelect {
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .layoutColumn,
  .headerSelect,
  .cellSelect {
    transition: none;
  }
}
```

使用 `<col>` 的原因：

- `table-layout: fixed` 的列宽权威在 `<colgroup>`；
- header/body 自动共享同一几何变化；
- 不需要逐行写宽度；
- Vue 只切换目标值，逐帧工作由 CSS 引擎执行；
- 不会每帧重跑业务 slot render function。

### 4.4 逻辑状态与退场视觉状态

退出批选必须立即通知业务：

```typescript
selectedList.value = [];
emit('update:selected-list', []);
emit('selected-change', []);
```

但退场画面不能在第一帧把所有勾选和 Batch Bar count 闪成 0。因此保留纯视觉快照：

```typescript
const selectionExitSnapshot = ref<SelectedRows | null>(null);
const renderedSelectedList = computed(
  () => selectionExitSnapshot.value ?? selectedList.value,
);
```

退出流程：

```text
1. snapshot = selectedList
2. 业务 selectedList 立即清空并 emit
3. CSS 开始退场
4. checkbox / header tri-state / Batch Bar count 读 snapshot
5. 300ms settle 后清 snapshot
```

重新进入、data source 变化和组件卸载时必须 clear snapshot timer。

### 4.5 动画期 overflow 测量

`selectAnimating` 不驱动宽度，只标记测量窗口：

```vue
<div
  :data-eds-data-list-layout-animating="selectAnimating || undefined"
>
```

`overflowMeasureDuringLayout.ts` 通过该属性冻结 Tooltip overflow 测量，并在布局 settle 后重测。

时间契约：

```text
CSS --motion-duration-shift       = 300ms
DataList SELECT_COLUMN_ANIM_MS    = 300ms
DATA_LIST_LAYOUT_SETTLE_MS        = 320ms
```

任一值变更都必须同步检查另外两项。

## 5. DS 内部复用抽取建议

### 5.1 本次即可做的 DataList 内部拆分

为了让宽度算法、选择快照和 transition 生命周期可独立测试，EDS 领取时可以直接拆为：

```text
packages/components/src/organisms/data-list/
├─ dataListSelectLayout.constants.ts
├─ computeDataListColumnWidths.ts
├─ useDataListSelection.ts
├─ useDataListSelectLayout.ts
├─ DataList.vue
└─ DataList.module.css
```

这些模块保持 DataList internal，**不从 `index.ts` 导出**。

职责：

- `dataListSelectLayout.constants.ts`
  - `SELECT_COLUMN_WIDTH = 40`；
  - `SELECT_COLUMN_ANIM_MS = 300`；
  - `SELECT_CONTENT_SLIDE_PX = 16`；
  - layout-animating attribute / selector；
  - settle buffer 的单一真源。
- `computeDataListColumnWidths.ts`
  - 纯函数，无 Vue、DOM、timer；
  - `computeRestDataColumnWidthsPx`；
  - `computeDataColumnLayoutWidthsPx`；
  - `columnWidthsBySlot`；
  - `formatColWidthPx`；
  - fixed / flex / trailing / legacy widthPercent 规则。
- `useDataListSelection.ts`
  - `selectMode`；
  - `selectedList`；
  - `selectionExitSnapshot` / `renderedSelectedList`；
  - select-all / row toggle；
  - 退出时业务立即清空、视觉延迟清理；
  - timer cleanup。
- `useDataListSelectLayout.ts`
  - idle / select 两套 slot 与 width endpoint；
  - `visibleSlotIndices = idleSlotIndices` 常驻契约；
  - `<col>` 目标 width；
  - checkbox content opacity / translate；
  - `selectAnimating` / reduced-motion / settle；
  - resize / skid 期间的 snapshot 同步门控。
- `DataList.vue`
  - 只做 table / colgroup / header / row / Batch Bar / virtual rows 编排；
  - 不再内联宽度算法和 timer 实现。

### 5.2 `useDataListSelectLayout` 建议接口

```typescript
type UseDataListSelectLayoutOptions = {
  selectMode: Readonly<Ref<boolean>>;
  containerWidth: Readonly<Ref<number>>;
  clientViewportWidth: Readonly<Ref<number>>;
  skidOpen: Readonly<Ref<boolean>>;
  columnMetas: Readonly<ComputedRef<readonly DataListColumnMeta[]>>;
  columnConfigs: Readonly<ComputedRef<readonly DataListColumnConfig[]>>;
};

type UseDataListSelectLayoutReturn = {
  visibleSlotIndices: ComputedRef<readonly number[]>;
  columnLayoutWidths: ComputedRef<readonly string[]>;
  selectColumnWidthCss: ComputedRef<string>;
  selectContentOpacity: ComputedRef<0 | 1>;
  selectContentTranslateX: ComputedRef<string>;
  isAnimating: Readonly<Ref<boolean>>;
  startTransition: () => void;
  syncWidthSnapshots: () => void;
  dispose: () => void;
};
```

`DataList.vue` 将 `isAnimating` 绑定到
`data-eds-data-list-layout-animating`，将其余 CSS target 绑定到 `<col>` 和根 CSS 变量。

### 5.3 第二个消费方出现后的通用抽取

只有当 DS 内出现第二个真实的 table/grid 消费方时，才进一步从
`useDataListSelectLayout` 提取通用：

```text
packages/components/src/internal/layout-motion/
├─ usePersistentWidthTransition.ts
└─ persistentWidthTransition.types.ts
```

通用 controller 只负责：

- 常驻 key 集；
- inactive / active width target；
- transition settle；
- reduced-motion；
- 快速 toggle timer 清理。

responsive column、selection snapshot、Batch Bar、virtual rows 仍属于 DataList domain，
不得为了“通用”塞进 generic API。

### 5.4 不推荐 `PersistentTableColumnGroup.vue`

Vue 组件虽然可以渲染 `<colgroup>`，但它会带来以下问题：

- `<col>` 数量必须与 DataList header/body 严格同源；
- slot / fragment / hydration 下容易产生 table parsing 边界问题；
- selection header/cell 的常驻仍要由父级控制；
- active 端点列集仍来自父级 responsive policy；
- 为减少几行模板而增加一个跨 table 结构的公共组件，收益不足。

所以建议 composable，而不是 Vue visual component。

### 5.5 自动化防回退

EDS 应新增：

```text
packages/components/src/organisms/data-list/computeDataListColumnWidths.test.ts
packages/components/src/organisms/data-list/useResponsiveColumns.test.ts
scripts/verify-data-list-select-layout.mjs
```

纯函数测试至少覆盖：

1. idle / select 两端 width 总预算；
2. `idleSlotIndices - selectModeSlotIndices` 在 select 端点均为 `0`；
3. select slot 集恒为 idle slot 集的子集；
4. fixed trailing / flex trailing；
5. legacy widthPercent；
6. 单列；
7. Skid；
8. responsive 临界阈值。

静态 verifier 至少锁定：

1. `visibleSlotIndices` 使用 idle 常驻集；
2. 不存在 rAF 写列宽响应式状态；
3. select header / row cell 无动画期 `v-if`；
4. 所有 colspan 恒包含常驻 selection column；
5. `.layoutColumn` 使用 shift duration + standard easing；
6. reduced-motion 同时关闭 width / opacity / transform；
7. layout-animating attribute 仍绑定 `selectAnimating`；
8. snapshot 在 re-enter / data change / unmount 清理；
9. CSS duration、JS settle timer、overflow settle buffer 保持一致。

## 6. 禁止重新引入的实现

### 6.1 rAF + Vue ref 逐帧宽度

禁止：

```typescript
requestAnimationFrame(() => {
  selectOffsetPx.value = nextWidth;
});
```

原因：`selectOffsetPx` 会使 `columnLayoutWidths`、template 和业务 slot 每帧更新；重业务行下主线程掉帧。

### 6.2 动画中改变列集

禁止：

```typescript
visibleSlotIndices = selectProgress >= 1
  ? selectModeSlotIndices
  : idleSlotIndices;
```

原因：退出第一帧会集中挂载整列业务组件；即使宽度公式连续，DOM 成本仍会造成时间轴跳帧。

### 6.3 退出前 `await nextTick()` 挂回常态列

禁止：

```typescript
columnSet = 'idle';
await nextTick();
startExitAnimation();
```

原因：用户点击后必须先等重列挂载完成，产生明显输入延迟。

### 6.4 动画完成后恢复列

禁止把列恢复放在 `onComplete`。这样动画本身正常，但 settle 后会再次重排，形成二次跳动。

### 6.5 普通退出 remount DataList

Batch Bar Close、工具栏 toggle、Escape、切菜单退出不得修改 DataList `:key`。

只有“提交成功后数据集整体换代，需要隔离旧动画和旧数据”的特殊业务链才允许既有 remount。

### 6.6 入场 / 离场参数分叉

禁止不同 slide distance、duration 或 easing。两个方向只切换同一组 CSS 目标值。

## 7. 领取后的测试矩阵

### 7.1 功能

- 工具栏入口进入批选；
- Batch Bar Close 退出；
- 工具栏再次点击退出；
- Escape 退出；
- 切菜单退出；
- 0 / 1 / 多行选择；
- select-all 的 none / some / all；
- 外部受控 `selectMode`。

### 7.2 性能

- 每页 20+ 重业务行；
- 含 Crypto、Avatar、Tooltip、复杂 slot；
- Performance timeline 中 toggle 后无集中 mount long task；
- 动画期间 Vue component update 不应每帧重复；
- 动画开始前无可感知 input delay；
- settle 后无第二次 layout jump。

### 7.3 布局

- 宽屏；
- 恰好位于 responsive 列阈值；
- resize；
- Skid 开 / 关；
- loading row；
- virtual top / bottom spacer；
- blank rows；
- action trailing column；
- legacy widthPercent；
- 单列 DataList。

### 7.4 动效与无障碍

- 入场 / 离场互为反向状态变化；
- checkbox column、数据列、checkbox content 同步；
- Batch Bar 不抢拍、不拖尾；
- 快速 toggle 从当前计算宽度反向；
- reduced-motion 立即切换；
- 0 宽 selection cell 不接收 pointer event；
- overflow Tooltip settle 后正确重测。

## 8. 验证命令

```shell
cd ../eds-desktop
pnpm --filter @eds/desktop-components typecheck

cd ../work-cregis-desktop
pnpm typecheck
pnpm lint:ds-tokens
```

UI 必须在消费 App 的 `pnpm dev`（4173）下验证，不能只跑 build。

## 9. Review 决策项

EDS 维护者领取时只需确认：

1. `<col>` width transition 在支持的 Electron / Chromium 版本上表现一致；
2. 常驻 idle 列的内存成本是否可接受（当前有 virtual rows，常驻范围仅 rendered rows）；
3. 300ms 是否继续使用 `motion-duration-shift`；
4. Batch Bar `motion-recipe-float` 与 table shift 是否需要统一 recipe；
5. 是否已有第二个真实消费方；没有则先不抽 internal composable；
6. 是否补充 DataList interaction / performance regression test。

公共业务 API 无需变更，也不需要 migration。
