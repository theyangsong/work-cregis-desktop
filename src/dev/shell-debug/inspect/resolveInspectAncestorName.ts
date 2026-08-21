/**
 * 属性面板首行「祖先」—— 最近一个**具名**祖先层的名字。
 *
 * ## 为什么需要
 *
 * 命名恒「点谁是谁」（`inspectNamingRules.ts` 五条规则），所以 DS 组件名只出现在它自己的
 * 根节点上。但有些组件根**点不到**：`ToolBar.module.css` 的 `.root` / `.chrome` 是
 * `width: 100%` 且无内边距，被 `.raw` 完全铺满 —— 点工具栏永远命中 `.raw`（`Div`），
 * `header.eds-tool-bar` 没有任何可点像素。Paginer / Skid / NavBar 的固定栏同理。
 *
 * 祖先信息因此**单独成一行属性**，而不是混进名字：
 *
 * | 点击节点 | 名字 | 祖先 |
 * |---|---|---|
 * | `div._raw_`（ToolBar 固定栏） | `Div` | `ToolBar` |
 * | `div._functionalGroup_` | `Div` | `ToolBar` |
 * | `span._iconSlot_` | `Span` | `IconButtonPro` |
 * | `header.eds-tool-bar` | `ToolBar` | `Layout` |
 *
 * ## 【禁止】回流进名字
 *
 * 此值**只作展示**，不得参与 `primaryLabel` / `componentChain` / props 的计算。
 * 一旦回流，父级与子级就会同名、属性与代码片段取到同一份参数 —— 那正是本模块
 * 反复回归的根因（见 `inspectNamingRules.ts` 的禁止清单）。
 */
import { resolveInspectScopeRoot } from './inspectFloatLayerScope';
import { resolveInspectNamedLayerLabel } from './resolveEdsComponentInspect';

export function resolveInspectAncestorName(element: Element, preview: Element): string | null {
  const scope = resolveInspectScopeRoot(element, preview);
  let node = element.parentElement;

  while (node && scope.contains(node)) {
    const label = resolveInspectNamedLayerLabel(node, preview);
    if (label) return label;
    node = node.parentElement;
  }

  return null;
}
