import { computed, ref, type ComputedRef } from 'vue';

/** 自定义 Detail #toolbar 翻页时驱动 EgDetail motion-page（toolbarNavPulse + pageKey）。 */
export function useDetailToolbarPageMotion(options: {
  detailId: ComputedRef<string | undefined>;
  currentIndex: ComputedRef<number>;
}) {
  const toolbarNavPulse = ref(0);
  const toolbarNavDirection = ref<'prev' | 'next'>('next');

  const detailToolbarPageKey = computed(() => {
    const id = options.detailId.value;
    if (!id) return '';
    return `${id}:${options.currentIndex.value}`;
  });

  function pulseToolbarNav(direction: 'prev' | 'next') {
    toolbarNavDirection.value = direction;
    toolbarNavPulse.value += 1;
  }

  return {
    detailToolbarPageKey,
    toolbarNavPulse,
    toolbarNavDirection,
    pulseToolbarNav,
  };
}
