import type { Component } from 'vue';
import type { ShellPageKey } from './pageKeyFromShell';

export type ShellDebugScenario = {
  id: string;
  label: string;
  description?: string;
  pageKey: ShellPageKey | '*';
  apply: () => void | Promise<void>;
};

const scenarios: ShellDebugScenario[] = [];

/** 替换某 pageKey 下全部场景（避免 HMR 残留已删 id）。 */
export function replaceShellDebugScenariosForPage(
  pageKey: ShellPageKey | '*',
  items: ShellDebugScenario[],
) {
  for (let index = scenarios.length - 1; index >= 0; index -= 1) {
    if (scenarios[index].pageKey === pageKey) {
      scenarios.splice(index, 1);
    }
  }
  scenarios.push(...items);
}

export function registerShellDebugScenarios(items: ShellDebugScenario[]) {
  for (const item of items) {
    const existingIndex = scenarios.findIndex((entry) => entry.id === item.id);
    if (existingIndex >= 0) {
      scenarios[existingIndex] = item;
      continue;
    }
    scenarios.push(item);
  }
}

export function listScenariosForPage(pageKey: ShellPageKey): ShellDebugScenario[] {
  return scenarios.filter(
    (item) => item.pageKey === '*' || item.pageKey === pageKey,
  );
}

/** QA 面板 · 通用态：全局（`pageKey: '*'`）场景。 */
export function listQaCommonScenarios(): ShellDebugScenario[] {
  const seen = new Set<string>();
  return scenarios.filter((item) => {
    if (item.pageKey !== '*' || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

/** QA 面板 · 业务态：仅当前页注册场景。 */
export function listQaBusinessScenariosForPage(pageKey: ShellPageKey): ShellDebugScenario[] {
  const seen = new Set<string>();
  return scenarios.filter((item) => {
    if (item.pageKey !== pageKey || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

export type InspectResultBlockProps = {
  pickedLabel: string;
};

export type ShellInspectBlock = {
  id: string;
  order?: number;
  PanelBlock: Component;
};

const inspectBlocks: ShellInspectBlock[] = [];

export function registerInspectBlock(block: ShellInspectBlock) {
  inspectBlocks.push(block);
}

export function listInspectBlocks(): ShellInspectBlock[] {
  return [...inspectBlocks].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
}
