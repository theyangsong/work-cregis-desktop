import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { hasOpenClickAnchoredTooltip } from '@eds/desktop-components';
import { isClientPopupActive } from '@/scenes/tasks/shared/clientPopupActive';
import {
  shouldSuppressFloatingOverlayInteractionBlock,
  signingBatchFlowRegistry,
  signingBatchSelectModeActive,
} from '@/scenes/tasks/signing/batch/signingBatchFlowContext';
import {
  batchSigningProgressPopupOpen,
  batchSigningStopConfirmOpen,
} from '@/scenes/tasks/signing/batch/batchSigningProgressUiStore';

function hasClickAnchoredTooltipLayerInDom(): boolean {
  return Boolean(document.querySelector('.app-preview > [id^="eds-tooltip-v-"]'));
}

/**
 * Click Popover 打开时，仅在列表区铺透明拦截层，避免穿透到底层 DataList。
 * 不覆盖工具栏 / 模块菜单；EgPopup 打开时不启用。
 */
export function useListRegionInteractionBlock() {
  const active = ref(false);
  let rafId = 0;
  let mutationObserver: MutationObserver | undefined;

  function sync() {
    const next =
      !shouldSuppressFloatingOverlayInteractionBlock()
      && !isClientPopupActive()
      && hasOpenClickAnchoredTooltip()
      && hasClickAnchoredTooltipLayerInDom();
    if (active.value !== next) {
      active.value = next;
    }
  }

  function loop() {
    sync();
    if (
      active.value
      || shouldSuppressFloatingOverlayInteractionBlock()
      || isClientPopupActive()
      || hasClickAnchoredTooltipLayerInDom()
    ) {
      rafId = requestAnimationFrame(loop);
      return;
    }
    rafId = 0;
  }

  function kick() {
    sync();
    if (!rafId) {
      rafId = requestAnimationFrame(loop);
    }
  }

  watch(signingBatchSelectModeActive, kick);
  watch(batchSigningProgressPopupOpen, kick);
  watch(batchSigningStopConfirmOpen, kick);
  watch(
    () => {
      const flow = signingBatchFlowRegistry.value;
      if (!flow) return null;
      return [
        flow.signConfirmOpen.value,
        flow.quotaAlertOpen.value,
        flow.verifyOpen.value,
        flow.stopConfirmOpen.value,
      ] as const;
    },
    kick,
  );

  onMounted(() => {
    kick();
    mutationObserver = new MutationObserver(kick);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded', 'data-eds-tooltip-open', 'class'],
    });
  });

  onBeforeUnmount(() => {
    mutationObserver?.disconnect();
    mutationObserver = undefined;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  });

  return { active };
}
