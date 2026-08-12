import { ref } from 'vue';

/** 测试期：每次刷新页面后首次打开详情都会展示引导。 */
export function useTasksDetailToolbarGuide() {
  const shouldShowGuide = ref(true);

  function markGuideSeen() {
    shouldShowGuide.value = false;
  }

  return {
    shouldShowGuide,
    markGuideSeen,
  };
}
