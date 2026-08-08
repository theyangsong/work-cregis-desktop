<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import {
  MOTION_LAYOUT_DEFORM_CONTENT,
  MOTION_LAYOUT_DEFORM_CONTENT_ENTERING,
  MOTION_LAYOUT_DEFORM_CONTENT_EXITING,
  useMotionLayoutDeformPageSwitch,
  type MotionLayoutDeformPageSpec,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import type { MinerFeeSelection } from '../shared/minerFeeProfile';
import { buildEvmMinerFeeDisplay } from './minerFeeEvmDisplay';
import MinerFeeCustomPanel from './MinerFeeCustomPanel.vue';
import MinerFeeListPanel, { type MinerFeeOptionId } from './MinerFeeListPanel.vue';
import {
  buildMinerFeeCustomPreview,
  defaultMinerFeeCustomDraft,
  type MinerFeeCustomDraft,
  type MinerFeeCustomSaved,
} from './minerFeeCustomTypes';
import { resolveMinerFeeEvmShellVariant } from './minerFeeEvmShellVariant';
import styles from './ApprovalRemarkPopoverPanel.module.css';

const MINER_FEE_CUSTOM_ID = 'custom' as const;

type MinerFeeScreen = 'list' | 'custom';

const props = withDefaults(
  defineProps<{
    remark: string;
    placeholderKey: string;
    feedbackKey: string;
    symbol?: string;
  }>(),
  {
    symbol: 'ETH',
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  'miner-fee-screen-change': [screen: MinerFeeScreen];
  confirm: [selection: MinerFeeSelection];
}>();

const { ui } = useAppI18n();

const listPanelRef = ref<InstanceType<typeof MinerFeeListPanel> | null>(null);
const listMeasurePanelRef = ref<InstanceType<typeof MinerFeeListPanel> | null>(null);
const customMeasurePanelRef = ref<InstanceType<typeof MinerFeeCustomPanel> | null>(null);
const customPanelRef = ref<InstanceType<typeof MinerFeeCustomPanel> | null>(null);
const shellVariant = computed(() => resolveMinerFeeEvmShellVariant(props.symbol));

const minerFee = ref<MinerFeeOptionId | null>(null);
const customFeeDraft = ref<MinerFeeCustomDraft>(
  defaultMinerFeeCustomDraft(shellVariant.value),
);
const customFeeSaved = ref<MinerFeeCustomSaved | null>(null);

const customMeasureDraft = computed<MinerFeeCustomDraft>(() => ({
  ...customFeeDraft.value,
  mode: 'advanced',
}));

const pageSpecs = reactive<Record<MinerFeeScreen, MotionLayoutDeformPageSpec>>({
  list: { shellHeight: 400 },
  custom: { shellHeight: 360 },
});

const {
  activePage,
  shellHeight,
  contentExiting,
  contentEntering,
  contentDirection,
  switchTo,
} = useMotionLayoutDeformPageSwitch<MinerFeeScreen>(pageSpecs, 'list');

const minerFeeConfirmDisabled = computed(() => minerFee.value === null);
const isMinerFeeCustomPage = computed(() => activePage.value === 'custom');

const remarkModel = computed({
  get: () => props.remark,
  set: (value: string) => emit('update:remark', value),
});

function getListMeasureEl() {
  return (
    listPanelRef.value?.getMeasureEl()
    ?? listMeasurePanelRef.value?.getMeasureEl()
    ?? null
  );
}

function getCustomMeasureEl() {
  return customMeasurePanelRef.value?.getMeasureEl() ?? null;
}

function measurePage(screen: MinerFeeScreen) {
  const el = screen === 'list' ? getListMeasureEl() : getCustomMeasureEl();
  if (!el) return;
  const height = el.scrollHeight;
  if (height > 0) {
    pageSpecs[screen].shellHeight = height;
  }
}

async function ensurePageHeight(screen: MinerFeeScreen) {
  await nextTick();
  measurePage(screen);
}

onMounted(async () => {
  await ensurePageHeight('list');
  await ensurePageHeight('custom');
  shellHeight.value = pageSpecs.list.shellHeight;
});

watch(customFeeSaved, async () => {
  await nextTick();
  if (activePage.value !== 'list') return;
  measurePage('list');
  shellHeight.value = pageSpecs.list.shellHeight;
});

watch(
  () => activePage.value,
  (screen) => {
    emit('miner-fee-screen-change', screen);
  },
);

function selectMinerFee(optionId: MinerFeeOptionId) {
  minerFee.value = optionId;
}

async function setMinerFeeScreen(screen: MinerFeeScreen) {
  if (
    screen === activePage.value
    && !contentExiting.value
    && !contentEntering.value
  ) {
    return;
  }

  await ensurePageHeight(screen);
  switchTo(screen);
}

function openCustomMinerFee() {
  setMinerFeeScreen('custom');
}

function goToMinerFeeList() {
  setMinerFeeScreen('list');
}

async function onCustomSave(draft: MinerFeeCustomDraft) {
  customFeeDraft.value = { ...draft };
  customFeeSaved.value = buildMinerFeeCustomPreview(draft, shellVariant.value);
  minerFee.value = MINER_FEE_CUSTOM_ID;
  await nextTick();
  await ensurePageHeight('list');
  await setMinerFeeScreen('list');
}

function resetMinerFeeFlow() {
  activePage.value = 'list';
  contentExiting.value = false;
  contentEntering.value = false;
  contentDirection.value = null;
  minerFee.value = null;
  customFeeDraft.value = defaultMinerFeeCustomDraft(shellVariant.value);
  customFeeSaved.value = null;
  shellHeight.value = pageSpecs.list.shellHeight;
}

function onListConfirm() {
  const displayValue = buildEvmMinerFeeDisplay(
    minerFee.value,
    customFeeSaved.value,
    ui,
    props.symbol,
  );
  if (!displayValue) {
    return;
  }
  emit('confirm', { profileKind: 'evm', displayValue });
}

defineExpose({
  resetMinerFeeFlow,
});
</script>

<template>
  <div :class="styles.minerFeeRootWrap">
    <div :class="styles.minerFeeMeasureHost" aria-hidden="true">
      <MinerFeeCustomPanel
        ref="customMeasurePanelRef"
        :draft="customMeasureDraft"
        :symbol="symbol"
        measure-only
      />
    </div>

    <div :class="styles.minerFeeMeasureHost" aria-hidden="true">
      <MinerFeeListPanel
        ref="listMeasurePanelRef"
        measure-only
        :symbol="symbol"
        :miner-fee="minerFee"
        :custom-fee-saved="customFeeSaved"
        :remark="remark"
        :placeholder-key="placeholderKey"
        :feedback-key="feedbackKey"
        :confirm-disabled="minerFeeConfirmDisabled"
      />
    </div>

    <div
      class="motion-layout-deform"
      :class="styles.minerFeeDeformShell"
      data-miner-fee-popover
      :data-miner-fee-screen="activePage"
      :style="{ height: `${shellHeight}px` }"
    >
      <div
        :class="[
          MOTION_LAYOUT_DEFORM_CONTENT,
          contentDirection,
          contentExiting && MOTION_LAYOUT_DEFORM_CONTENT_EXITING,
          contentEntering && MOTION_LAYOUT_DEFORM_CONTENT_ENTERING,
        ]"
      >
        <MinerFeeCustomPanel
          v-if="isMinerFeeCustomPage"
          ref="customPanelRef"
          :draft="customFeeDraft"
          :symbol="symbol"
          @back="goToMinerFeeList"
          @cancel="goToMinerFeeList"
          @save="onCustomSave"
        />

        <MinerFeeListPanel
          v-else
          ref="listPanelRef"
          :symbol="symbol"
          :miner-fee="minerFee"
          :custom-fee-saved="customFeeSaved"
          v-model:remark="remarkModel"
          :placeholder-key="placeholderKey"
          :feedback-key="feedbackKey"
          :confirm-disabled="minerFeeConfirmDisabled"
          @select-miner-fee="selectMinerFee"
          @open-custom="openCustomMinerFee"
          @confirm="onListConfirm"
        />
      </div>
    </div>
  </div>
</template>
