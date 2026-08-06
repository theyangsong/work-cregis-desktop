<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { EgListFieldOverflowText, EgTag, type TagSystemType } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './TasksListFieldGeneralStructure.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
}>();

const COUNTDOWN_LOOP_SECONDS = 60 * 60;

function parsePreviewMinWidth(customize: Record<string, unknown>): number | undefined {
  const raw = String(customize.minWidth ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return parsed > 0 ? parsed : undefined;
}

function parseCountdownTotal(customize: Record<string, unknown>): number {
  const minutes = Math.max(0, Number.parseInt(String(customize.countdownMinutes ?? '30'), 10) || 0);
  const seconds = Math.max(
    0,
    Math.min(59, Number.parseInt(String(customize.countdownSeconds ?? '0'), 10) || 0),
  );
  return minutes * 60 + seconds;
}

function formatCountdownTotal(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const value = computed(() => String(props.customize.value ?? ''));
const secondaryValue = computed(() => String(props.customize.secondaryValue ?? ''));
const lineLayout = computed(() => String(props.customize.lineLayout ?? 'double'));
const isDoubleLine = computed(() => lineLayout.value === 'double');
const showLeftTag = computed(() => Boolean(props.customize.showLeftTag));
const showRightTag = computed(() => Boolean(props.customize.showRightTag));
const showCountdown = computed(
  () => !isDoubleLine.value && Boolean(props.customize.showCountdown),
);
const countdownAlignClass = computed(() => {
  const align = String(props.customize.countdownAlign ?? 'left');
  if (align === 'center') return styles.singleStackAlignCenter;
  if (align === 'right') return styles.singleStackAlignRight;
  return styles.singleStackAlignLeft;
});
const leftTagSystemType = computed(
  () => String(props.customize.leftSystemType ?? 'stroke-solid') as TagSystemType,
);
const { ui } = useAppI18n();
const leftTagLabel = computed(() => ui(String(props.customize.leftLabel ?? 'Me')));
const rightTagSystemType = computed(
  () => String(props.customize.rightSystemType ?? 'stroke-subtle') as TagSystemType,
);
const rightTagLabel = computed(() => ui(String(props.customize.rightLabel ?? 'Tag')));
const tooltipTrigger = computed(
  () => String(props.customize.tooltipTrigger ?? 'hover') as 'hover' | 'focus',
);
const hashLikeWidthConfigured = computed(() => parsePreviewMinWidth(props.customize) != null);

/** Data List 单元格内：填满可用宽度并启用 tail 省略。 */
const hashLikeMinWidthStyle = computed(() => {
  if (!hashLikeWidthConfigured.value) return undefined;
  return { width: '100%', maxWidth: '100%', minWidth: '0' };
});

const countdownRemainingSeconds = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | undefined;

function resetCountdownFromCustomize() {
  countdownRemainingSeconds.value = parseCountdownTotal(props.customize);
}

function clearCountdownTimer() {
  if (countdownTimer !== undefined) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
}

function startCountdownTimer() {
  clearCountdownTimer();
  if (!showCountdown.value) return;
  resetCountdownFromCustomize();
  countdownTimer = setInterval(() => {
    if (countdownRemainingSeconds.value <= 0) {
      countdownRemainingSeconds.value = COUNTDOWN_LOOP_SECONDS;
      return;
    }
    countdownRemainingSeconds.value -= 1;
  }, 1000);
}

watch(
  showCountdown,
  (active) => {
    if (active) {
      startCountdownTimer();
      return;
    }
    clearCountdownTimer();
  },
  { immediate: true },
);

watch(
  () => [props.customize.countdownMinutes, props.customize.countdownSeconds],
  () => {
    if (showCountdown.value) {
      resetCountdownFromCustomize();
    }
  },
);

onBeforeUnmount(() => {
  clearCountdownTimer();
});

const countdownTime = computed(() => formatCountdownTotal(countdownRemainingSeconds.value));
</script>

<template>
  <div
    class="desktopTokens list-field-general-structure"
    :class="styles.host"
  >
    <div
      v-if="showLeftTag || showRightTag"
      :class="isDoubleLine ? styles.stackPreview : styles.titleRow"
      :style="hashLikeMinWidthStyle"
    >
      <template v-if="isDoubleLine">
        <div :class="styles.titleRow">
          <EgTag
            v-if="showLeftTag"
            family="system"
            :system-type="leftTagSystemType"
            size="sm"
          >
            {{ leftTagLabel }}
          </EgTag>
          <EgListFieldOverflowText
            :text="value"
            variant="primary"
            :tooltip-trigger="tooltipTrigger"
          />
          <EgTag
            v-if="showRightTag"
            family="system"
            :system-type="rightTagSystemType"
            size="sm"
          >
            {{ rightTagLabel }}
          </EgTag>
        </div>
        <EgListFieldOverflowText
          :text="secondaryValue"
          variant="secondary"
          :tooltip-trigger="tooltipTrigger"
        />
      </template>
      <template v-else>
        <EgTag
          v-if="showLeftTag"
          family="system"
          :system-type="leftTagSystemType"
          size="sm"
        >
          {{ leftTagLabel }}
        </EgTag>
        <EgListFieldOverflowText
          :text="value"
          variant="primary"
          :tooltip-trigger="tooltipTrigger"
        />
        <EgTag
          v-if="showRightTag"
          family="system"
          :system-type="rightTagSystemType"
          size="sm"
        >
          {{ rightTagLabel }}
        </EgTag>
      </template>
    </div>

    <template v-else>
      <span v-if="isDoubleLine" :class="styles.combo" :style="hashLikeMinWidthStyle">
        <EgListFieldOverflowText
          :text="value"
          variant="primary"
          :tooltip-trigger="tooltipTrigger"
        />
        <EgListFieldOverflowText
          :text="secondaryValue"
          variant="secondary"
          :tooltip-trigger="tooltipTrigger"
        />
      </span>
      <div
        v-else
        :class="showCountdown ? [styles.singleStack, countdownAlignClass] : undefined"
        :style="hashLikeMinWidthStyle"
      >
        <EgListFieldOverflowText
          :text="value"
          variant="primary"
          :tooltip-trigger="tooltipTrigger"
        />
        <span v-if="showCountdown" :class="styles.countdown">
          <span :class="styles.countdownTime">{{ countdownTime }}</span>
          <span :class="styles.countdownSuffix"> Until Expiry</span>
        </span>
      </div>
    </template>
  </div>
</template>
