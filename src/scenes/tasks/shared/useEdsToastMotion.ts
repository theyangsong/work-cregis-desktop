import { nextTick, onBeforeUnmount, ref } from 'vue';

/** 与 MultiSignInvitationFloatHost / DS flotation Toast 演示一致的可读停留时长。 */
export const EDS_TOAST_VISIBLE_MS = 2400;

export function readEdsFlotationLeaveMs(
  anchor: ParentNode = document.querySelector('.app-preview') ?? document.documentElement,
): number {
  const probe = document.createElement('div');
  probe.className = 'motion-flotation';
  anchor.appendChild(probe);
  const durations = getComputedStyle(probe)
    .transitionDuration.split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((seconds) => Number.isFinite(seconds) && seconds > 0);
  anchor.removeChild(probe);
  const maxSeconds = durations.length > 0 ? Math.max(...durations) : 0;
  return maxSeconds > 0 ? Math.round(maxSeconds * 1000) : 300;
}

export function useEdsToastMotion(options?: { visibleMs?: number }) {
  const visibleMs = options?.visibleMs ?? EDS_TOAST_VISIBLE_MS;
  const text = ref('');
  const keepMounted = ref(false);
  const motionActive = ref(false);

  let visibleTimer: ReturnType<typeof setTimeout> | undefined;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;

  function clearLeaveTimer() {
    if (leaveTimer !== undefined) {
      clearTimeout(leaveTimer);
      leaveTimer = undefined;
    }
  }

  function syncEnter() {
    clearLeaveTimer();
    keepMounted.value = true;
    motionActive.value = false;
    nextTick(() => {
      requestAnimationFrame(() => {
        if (keepMounted.value) {
          motionActive.value = true;
        }
      });
    });
  }

  function hide() {
    motionActive.value = false;
    const leaveMs = readEdsFlotationLeaveMs();
    clearLeaveTimer();
    leaveTimer = window.setTimeout(() => {
      keepMounted.value = false;
      leaveTimer = undefined;
    }, leaveMs);
  }

  function show(message: string) {
    text.value = message;
    syncEnter();
    if (visibleTimer !== undefined) clearTimeout(visibleTimer);
    visibleTimer = window.setTimeout(() => {
      hide();
      visibleTimer = undefined;
    }, visibleMs);
  }

  function reset() {
    if (visibleTimer !== undefined) {
      clearTimeout(visibleTimer);
      visibleTimer = undefined;
    }
    clearLeaveTimer();
    keepMounted.value = false;
    motionActive.value = false;
    text.value = '';
  }

  onBeforeUnmount(reset);

  return {
    text,
    keepMounted,
    motionActive,
    show,
    hide,
    reset,
  };
}
