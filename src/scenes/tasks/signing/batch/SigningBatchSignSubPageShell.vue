<script setup lang="ts">
import { provide, ref } from 'vue';
import type { TasksDataListSortOrder } from '../../tasksDataListSort';
import { useLayoutChromeInset } from '../../shared/useLayoutChromeInset';
import SigningBatchPopupTopTool from './SigningBatchPopupTopTool.vue';
import {
  signingBatchDetailAmountSortKey,
  type SigningBatchDetailAmountSortContext,
} from './signingBatchDetailTableSortContext';
import styles from './batchSigning.shared.module.css';

defineProps<{
  title: string;
  /** 为 true 时详情 / 原因子页 DataList 支持金额列排序。 */
  enableAmountSort?: boolean;
}>();

const emit = defineEmits<{
  back: [];
}>();

const bodyRef = ref<HTMLElement | null>(null);
const topOverlayRef = ref<HTMLElement | null>(null);
const bottomOverlayRef = ref<HTMLElement | null>(null);

const amountSortOrder = ref<TasksDataListSortOrder | ''>('');

function setAmountSortOrder(order: TasksDataListSortOrder | null) {
  amountSortOrder.value = order ?? '';
}

const amountSortContext: SigningBatchDetailAmountSortContext = {
  amountSortOrder,
  setAmountSortOrder,
};

provide(signingBatchDetailAmountSortKey, amountSortContext);

useLayoutChromeInset(bodyRef, {
  topOverlayRef,
  bottomOverlayRef,
});
</script>

<template>
  <div :class="styles.batchPopupSubPage">
    <div ref="bodyRef" :class="styles.batchPopupSubPageBody">
      <div :class="styles.batchPopupSubPageContent">
        <slot />
      </div>
      <div
        v-if="$slots.footer"
        ref="bottomOverlayRef"
        :class="styles.batchDetailPaginerOverlay"
      >
        <slot name="footer" />
      </div>
      <div ref="topOverlayRef" :class="styles.batchPopupSubPageTopOverlay">
        <SigningBatchPopupTopTool :title="title" @back="emit('back')">
          <template v-if="$slots.topActions" #actions>
            <slot name="topActions" />
          </template>
        </SigningBatchPopupTopTool>
      </div>
    </div>
  </div>
</template>
