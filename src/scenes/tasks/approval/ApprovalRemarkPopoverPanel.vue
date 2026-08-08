<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import {
  EgButton,
  EgComboTextareaItem,
  EgFormSubmission,
  MOTION_LAYOUT_DEFORM_CONTENT,
  MOTION_LAYOUT_DEFORM_CONTENT_ENTERING,
  MOTION_LAYOUT_DEFORM_CONTENT_EXITING,
  useMotionLayoutDeformPageSwitch,
  type MotionLayoutDeformPageSpec,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import MinerFeeCustomPanel from './MinerFeeCustomPanel.vue';
import MinerFeeListPanel, { type MinerFeeOptionId } from './MinerFeeListPanel.vue';
import {
  buildMinerFeeCustomPreview,
  DEFAULT_MINER_FEE_CUSTOM_DRAFT,
  type MinerFeeCustomDraft,
  type MinerFeeCustomSaved,
} from './minerFeeCustomTypes';
import styles from './ApprovalRemarkPopoverPanel.module.css';

const REMARK_MAX_LENGTH = 256;

const MINER_FEE_CUSTOM_ID = 'custom' as const;

type MinerFeeScreen = 'list' | 'custom';

const props = withDefaults(
  defineProps<{
    selectedCount: number;
    remark: string;
    showMinerFee?: boolean;
    placeholderKey?: string;
    feedbackKey?: string;
  }>(),
  {
    placeholderKey: 'Please enter',
    feedbackKey: 'Optional, Max. 256 characters',
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  'miner-fee-screen-change': [screen: MinerFeeScreen];
  confirm: [];
  cancel: [];
}>();

const { ui } = useAppI18n();

const remarkFieldRef = ref<HTMLElement | null>(null);
const listPanelRef = ref<InstanceType<typeof MinerFeeListPanel> | null>(null);
const listMeasurePanelRef = ref<InstanceType<typeof MinerFeeListPanel> | null>(null);
const customMeasurePanelRef = ref<InstanceType<typeof MinerFeeCustomPanel> | null>(null);
const customPanelRef = ref<InstanceType<typeof MinerFeeCustomPanel> | null>(null);
const minerFee = ref<MinerFeeOptionId | null>(null);
const customFeeDraft = ref<MinerFeeCustomDraft>({ ...DEFAULT_MINER_FEE_CUSTOM_DRAFT });
const customFeeSaved = ref<MinerFeeCustomSaved | null>(null);

/** 自定义页预测量始终用高级模式（字段最多），Tab 切换不再改 shell 高。 */
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
  set: (value: string) => emit('update:remark', value.slice(0, REMARK_MAX_LENGTH)),
});

function getListMeasureEl() {
  return (
    listPanelRef.value?.getMeasureEl() ??
    listMeasurePanelRef.value?.getMeasureEl() ??
    null
  );
}

onMounted(async () => {
  emit('update:remark', '');
  if (props.showMinerFee) {
    await ensurePageHeight('list');
    await ensurePageHeight('custom');
    shellHeight.value = pageSpecs.list.shellHeight;
    return;
  }
  await focusRemarkInput();
});

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

watch(customFeeSaved, async () => {
  await nextTick();
  if (activePage.value !== 'list') return;
  measurePage('list');
  shellHeight.value = pageSpecs.list.shellHeight;
});

function getRemarkControlElement() {
  return remarkFieldRef.value?.querySelector('input, textarea') as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;
}

async function focusRemarkInput() {
  await nextTick();
  getRemarkControlElement()?.focus();

  window.requestAnimationFrame(() => {
    getRemarkControlElement()?.focus();
  });

  window.setTimeout(() => {
    getRemarkControlElement()?.focus();
  }, 120);
}

function selectMinerFee(optionId: MinerFeeOptionId) {
  minerFee.value = optionId;
}

watch(activePage, (screen) => {
  emit('miner-fee-screen-change', screen);
});

async function setMinerFeeScreen(screen: MinerFeeScreen) {
  if (
    screen === activePage.value &&
    !contentExiting.value &&
    !contentEntering.value
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
  customFeeSaved.value = buildMinerFeeCustomPreview(draft);
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
  customFeeDraft.value = { ...DEFAULT_MINER_FEE_CUSTOM_DRAFT };
  shellHeight.value = pageSpecs.list.shellHeight;
}

defineExpose({
  resetMinerFeeFlow,
});
</script>

<template>
  <template v-if="showMinerFee">
    <div :class="styles.minerFeeRootWrap">
      <div :class="styles.minerFeeMeasureHost" aria-hidden="true">
        <MinerFeeCustomPanel
          ref="customMeasurePanelRef"
          :draft="customMeasureDraft"
          measure-only
        />
      </div>

      <div :class="styles.minerFeeMeasureHost" aria-hidden="true">
        <MinerFeeListPanel
          ref="listMeasurePanelRef"
          measure-only
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
              @back="goToMinerFeeList"
              @cancel="goToMinerFeeList"
              @save="onCustomSave"
            />

          <MinerFeeListPanel
            v-else
            ref="listPanelRef"
            :miner-fee="minerFee"
            :custom-fee-saved="customFeeSaved"
            v-model:remark="remarkModel"
            :placeholder-key="placeholderKey"
            :feedback-key="feedbackKey"
            :confirm-disabled="minerFeeConfirmDisabled"
            @select-miner-fee="selectMinerFee"
            @open-custom="openCustomMinerFee"
            @confirm="emit('confirm')"
          />
        </div>
      </div>
    </div>
  </template>

  <div v-else :class="styles.root">
    <div
      ref="remarkFieldRef"
      :class="[styles.remarkField, styles.remarkFieldNoLabel]"
    >
      <EgComboTextareaItem
        v-model="remarkModel"
        feedback
        :label="ui('Remark')"
        :placeholder="ui(placeholderKey)"
      >
        <template #feedback>
          <EgFormSubmission
            type="notes"
            :text="ui(feedbackKey)"
            :show-link="false"
          />
        </template>
      </EgComboTextareaItem>
    </div>

    <EgButton
      :class="styles.confirm"
      tone="decor"
      variant="solid"
      size="md"
      @click="emit('confirm')"
    >
      {{ ui('Confirm') }}
    </EgButton>
  </div>
</template>
