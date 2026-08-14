import { tasksDataListShellApiRegistry } from '@/scenes/tasks/tasksDataListShellApi';

const QA_LOADING_TIMEOUT_MS = 60_000;
const QA_LOADING_TIMEOUT_MESSAGE = '连接超时，请稍后重试。';

let qaLoadingTimeoutTimer: ReturnType<typeof setTimeout> | undefined;

export function clearQaLoadingTimeout() {
  if (qaLoadingTimeoutTimer !== undefined) {
    clearTimeout(qaLoadingTimeoutTimer);
    qaLoadingTimeoutTimer = undefined;
  }
}

export function applyEmptyPageScenario() {
  const api = tasksDataListShellApiRegistry.value;
  if (!api) return;
  clearQaLoadingTimeout();
  api.setListLoading(false);
  api.setListEmpty(true);
}

/** 保持加载态直至执行其它场景、reset 或 60s 超时。 */
export function applyLoadingScenario() {
  const api = tasksDataListShellApiRegistry.value;
  if (!api) return;
  clearQaLoadingTimeout();
  api.setListEmpty(false);
  api.setListLoading(true);
  qaLoadingTimeoutTimer = window.setTimeout(() => {
    qaLoadingTimeoutTimer = undefined;
    api.setListLoading(false);
    api.showDangerToast(QA_LOADING_TIMEOUT_MESSAGE);
  }, QA_LOADING_TIMEOUT_MS);
}
