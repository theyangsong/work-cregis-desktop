import { ref } from 'vue';

/**
 * 协作详情工具栏引导：每次刷新浏览器后，首次打开任意详情自动展示一次；
 * 同一会话内关闭或已展示过后不再出现（审批 / 签名详情共用）。
 */
const guideEligible = ref(true);
let guideAutoPresented = false;

export function useTasksDetailToolbarGuide() {
  function markGuideSeen() {
    guideEligible.value = false;
  }

  /** 本会话是否仍应自动展开引导（仅首次详情打开时为 true）。 */
  function tryConsumeGuideAutoPresent(): boolean {
    if (!guideEligible.value || guideAutoPresented) {
      return false;
    }
    guideAutoPresented = true;
    return true;
  }

  return {
    shouldShowGuide: guideEligible,
    markGuideSeen,
    tryConsumeGuideAutoPresent,
  };
}
