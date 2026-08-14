import { replaceShellDebugScenariosForPage } from '../registry';
import { applyEmptyPageScenario, applyLoadingScenario } from './commonScenarioActions';

export function registerCommonScenarioPack() {
  replaceShellDebugScenariosForPage('*', [
    {
      id: 'qa-empty-page',
      pageKey: '*',
      label: '空页面',
      description: '列表切至无数据空态（ToolBar + Paginer 保留）。',
      apply: applyEmptyPageScenario,
    },
    {
      id: 'qa-loading',
      pageKey: '*',
      label: '加载中',
      description: '列表进入加载态（DataList loading）。超时时间 60s。',
      apply: applyLoadingScenario,
    },
  ]);
}

registerCommonScenarioPack();
