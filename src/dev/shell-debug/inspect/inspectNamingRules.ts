/**
 * Inspect 命名唯一真源 —— 「点谁是谁」五条规则，全站统一，无逐组件特判。
 *
 * 对被点击节点 E，自上而下取第一条命中：
 *
 * | # | 规则 | 结果 |
 * |---|------|------|
 * | R1 | E 在原子图形宿主内（`.eds-icon` / `.eds-crypto` / `.eds-avatar`） | 该宿主组件 |
 * | R2 | E 自身带 catalog `eds-*` 根类，或 E 就是某 DS 组件的 Vue DOM 根 | 该组件 + props |
 * | R3 | E 是排版文本叶子 | `Text` |
 * | R4 | E 带某 DS 组件 CSS Module 的**具名 Figma 组件区域**类 | 该区域名 |
 * | R5 | 其余 | HTML 标签名（`Div` / `Span` / `Td`…） |
 *
 * ## 一层一名：禁止祖先借名 / 继承
 *
 * 每个 DS 组件名**只出现在它自己的根节点上**。组件内部的普通容器
 * （ToolBar 的 `_functional_`、Popup 的 `_stage_`、Detail 的 `_itemTitle_`…）
 * 在 DS 里就是 `<div>`，Figma 里也没有对应组件 —— 一律 R5 显示 HTML 标签。
 *
 * **【禁止】** 任何形式的祖先取名：`root.contains(element)`、沿 `parentElement`
 * 回溯最近具名层、按渲染归属继承。三者都会让父级与子级同名，进而属性 / 代码片段
 * 取到同一份参数 —— 这是本模块反复回归的根因。
 *
 * 「内层要不要组件名」只看 **它自己是不是 DS 组件**（R2 覆盖任意 DS 包组件根，
 * 含未入 catalog 的内部组件），不看它被谁包着。
 *
 * 祖先信息**不进名字**，而是作为属性面板首行「祖先」单独展示
 * （见 `resolveInspectAncestorName.ts`）—— 点不到的父层由它交代。
 *
 * 布局 / 样式代码恒取 **当前点击节点**（见 `resolveInspectStyleTarget.ts`）。
 */

export const INSPECT_ATOMIC_GRAPHIC_HOST_SELECTOR = '.eds-icon, .eds-crypto, .eds-avatar';

export type InspectNamingRuleId =
  | 'atomic-graphic'
  | 'component-root'
  | 'text-leaf'
  | 'named-region'
  | 'dom-tag';

export const INSPECT_NAMING_RULE_ORDER: readonly InspectNamingRuleId[] = [
  'atomic-graphic',
  'component-root',
  'text-leaf',
  'named-region',
  'dom-tag',
];

/** CSS Module 编译后类名片段匹配（`_paginationRaw_x1y2` 命中 `paginationRaw`，不命中 `raw`）。 */
export function classListHasModuleFragment(element: Element, fragment: string): boolean {
  const pattern = new RegExp(`(?:^|_)${fragment}(?:_|$)`);
  return [...element.classList].some((name) => pattern.test(name));
}

/** 原子图形宿主：内部 svg / path / span 一律归宿主组件，不再逐层拆。 */
export function findAtomicGraphicHost(element: Element): Element | null {
  return element.closest(INSPECT_ATOMIC_GRAPHIC_HOST_SELECTOR);
}
