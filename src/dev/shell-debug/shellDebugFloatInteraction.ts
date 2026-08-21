/** Shell Debug 壳层点击后的短窗口：业务 click Popover 不应被外部关闭 / closeAll 关掉。 */
let pendingUntil = 0;

export function markShellDebugUiInteraction(durationMs = 120): void {
  pendingUntil = performance.now() + durationMs;
}

export function isShellDebugUiInteractionPending(): boolean {
  return performance.now() < pendingUntil;
}
