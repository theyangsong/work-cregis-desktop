<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  watch,
} from 'vue';
import {
  EgButton,
  EgIcon,
  EgRemarkPopover,
  EgTooltip,
  REMARK_POPOVER_MAX_LENGTH,
  TEXT_OVERFLOW_TOOLTIP_TOKEN_SCOPE,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import remarkTriggerStyles from './remarkPopoverTrigger.module.css';
import styles from './DetailToolbarRemarkTrigger.module.css';

const REMARK_ECHO_TOOLTIP_WIDTH = 328;

const props = withDefaults(
  defineProps<{
    /** 切换条目时清空本地备注（不参与业务流程）。 */
    pageKey?: string | number | null;
    /** 受控备注；传入时与父级 `update:modelValue` 同步。 */
    modelValue?: string;
    /** 备注输入 placeholder i18n key；Detail 工具栏默认「请输入」。 */
    placeholderKey?: string;
  }>(),
  {
    placeholderKey: 'Please enter',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const isControlled = computed(() => props.modelValue !== undefined);

const localEchoedRemark = ref('');
const draftRemark = ref('');

const echoedRemark = computed({
  get: () => (isControlled.value ? (props.modelValue ?? '') : localEchoedRemark.value),
  set: (value: string) => {
    if (isControlled.value) {
      emit('update:modelValue', value);
      return;
    }
    localEchoedRemark.value = value;
  },
});

watch(
  () => props.pageKey,
  () => {
    if (isControlled.value) return;
    draftRemark.value = '';
    localEchoedRemark.value = '';
  },
);

const { ui } = useAppI18n();

const echoedTrimmed = computed(() => echoedRemark.value.trim());
const hasRemarkEcho = computed(() => echoedTrimmed.value.length > 0);

const remarkOverflowTooltipScopeClass = computed(
  () => `${TEXT_OVERFLOW_TOOLTIP_TOKEN_SCOPE} ${styles.remarkOverflowTooltip}`,
);

const measureRef = ref<HTMLElement | null>(null);
const remarkOverflowing = ref(false);
let resizeObserver: ResizeObserver | null = null;

function measureRemarkOverflow() {
  const el = measureRef.value;
  if (!el) {
    remarkOverflowing.value = false;
    return;
  }
  remarkOverflowing.value = el.scrollWidth > el.clientWidth + 1;
}

function scheduleRemarkOverflowMeasure() {
  nextTick(() => {
    measureRemarkOverflow();
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (!measureRef.value) return;
    resizeObserver = new ResizeObserver(() => measureRemarkOverflow());
    resizeObserver.observe(measureRef.value);
  });
}

watch(echoedTrimmed, () => {
  scheduleRemarkOverflowMeasure();
});

onMounted(() => {
  scheduleRemarkOverflowMeasure();
});

onUpdated(() => {
  measureRemarkOverflow();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

const remarkTooltipDisabled = computed(
  () => !hasRemarkEcho.value || !remarkOverflowing.value,
);

function prepareDraft() {
  draftRemark.value = echoedRemark.value;
}

function onConfirm() {
  echoedRemark.value = draftRemark.value.slice(0, REMARK_POPOVER_MAX_LENGTH);
}

function onDismiss() {
  draftRemark.value = echoedRemark.value;
}
</script>

<template>
  <EgRemarkPopover
    v-model="draftRemark"
    :title="ui('Remark')"
    :placeholder="ui(placeholderKey)"
    feedback-text="Optional, Max. 256 characters"
    :confirm-label="ui('Confirm')"
    boundary-selector=".eds-popup"
    teleport-to=".app-preview"
    placement="top"
    :on-before-open="prepareDraft"
    @confirm="onConfirm"
    @dismiss="onDismiss"
  >
    <template #trigger="{ active, onClick }">
      <EgTooltip
        v-if="hasRemarkEcho"
        :content="echoedTrimmed"
        :disabled="remarkTooltipDisabled || active"
        trigger="hover"
        placement="top"
        align="start"
        panel-kind="flotation"
        width-mode="fixed"
        :width="REMARK_ECHO_TOOLTIP_WIDTH"
        height-mode="adaptive"
        :scrollable="false"
        close-on-scroll
        boundary-selector=".eds-popup"
        teleport-to=".app-preview"
        :token-scope-class="remarkOverflowTooltipScopeClass"
      >
        <span
          :class="[
            styles.remarkTrigger,
            active && remarkTriggerStyles.remarkTriggerSubtleOutlinePressed,
          ]"
        >
          <EgButton
            tone="subtle"
            variant="outline"
            size="md"
            :aria-expanded="active"
            :aria-label="echoedTrimmed"
            @click.stop="onClick"
          >
            <template #icon>
              <EgIcon name="eds-editor" fit size="md" />
            </template>
            <span ref="measureRef" :class="styles.remarkLabel">{{ echoedTrimmed }}</span>
          </EgButton>
        </span>
      </EgTooltip>
      <span
        v-else
        :class="[
          styles.remarkTrigger,
          active && remarkTriggerStyles.remarkTriggerSubtleOutlinePressed,
        ]"
      >
        <EgButton
          tone="subtle"
          variant="outline"
          size="md"
          :aria-expanded="active"
          :aria-label="ui('Remark')"
          @click.stop="onClick"
        >
          <template #icon>
            <EgIcon name="eds-editor" fit size="md" />
          </template>
          <span :class="styles.remarkLabel">{{ ui('Remark') }}</span>
        </EgButton>
      </span>
    </template>
  </EgRemarkPopover>
</template>
