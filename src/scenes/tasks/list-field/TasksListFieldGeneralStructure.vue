<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { EgAvatar, EgDivider, EgIcon, EgListFieldOverflowText, EgTag, type IconName, type TagSystemType } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  splitBusinessTypeSecondaryKey,
} from './businessTypeDisplay';
import {
  formatExpiryCountdownHms,
  parseExpiryCountdownTotal,
} from '../shared/expiryCountdownUtils';
import styles from './TasksListFieldGeneralStructure.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
}>();

function resolveInitiatorDisplayName(raw: string): string {
  const trimmed = raw.trim();
  const parenIndex = trimmed.indexOf(' (');
  if (parenIndex > 0) return trimmed.slice(0, parenIndex).trim();
  return trimmed;
}

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
const { ui } = useAppI18n();
const secondaryValueRaw = computed(() => String(props.customize.secondaryValue ?? '').trim());
const secondaryValue = computed(() => ui(secondaryValueRaw.value));
const businessTypeSecondaryParts = computed(() => {
  const parts = splitBusinessTypeSecondaryKey(secondaryValueRaw.value);
  if (!parts) return null;
  return {
    source: ui(parts.sourceKey),
    action: ui(parts.actionKey),
  };
});
const showBusinessTypeSecondary = computed(
  () => isDoubleLine.value && secondaryValueRaw.value.length > 0 && businessTypeSecondaryParts.value != null,
);
const showPlainSecondary = computed(
  () => isDoubleLine.value && secondaryValueRaw.value.length > 0 && businessTypeSecondaryParts.value == null,
);
const showCountdownOnSecondary = computed(
  () => showBusinessTypeSecondary.value && Boolean(props.customize.showCountdown),
);
const lineLayout = computed(() => String(props.customize.lineLayout ?? 'double'));
const isDoubleLine = computed(() => lineLayout.value === 'double');
const operationTypeOnly = computed(() => Boolean(props.customize.operationTypeOnly));
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
const leftTagLabel = computed(() => ui(String(props.customize.leftLabel ?? 'Me')));
const rightTagSystemType = computed(
  () => String(props.customize.rightSystemType ?? 'stroke-subtle') as TagSystemType,
);
const rightTagLabel = computed(() => ui(String(props.customize.rightLabel ?? 'Tag')));
const initiatorIconKind = computed((): 'avatar' | 'app' | 'none' => {
  const explicit = String(props.customize.initiatorIconKind ?? '').trim();
  if (explicit === 'avatar' || explicit === 'app' || explicit === 'none') {
    return explicit;
  }
  return 'avatar';
});
const showAvatar = computed(() => initiatorIconKind.value === 'avatar');
const showAppIcon = computed(() => initiatorIconKind.value === 'app');
const appIconName = computed(
  () => String(props.customize.initiatorAppIcon ?? 'eds-application-22') as IconName,
);
const countdownSuffixKey = computed(() =>
  String(props.customize.countdownSuffixKey ?? 'Until Expiry').trim() || 'Until Expiry',
);
const countdownListText = computed(() => {
  const total = parseExpiryCountdownTotal(
    String(props.customize.countdownMinutes ?? '30'),
    String(props.customize.countdownSeconds ?? '00'),
    String(props.customize.countdownHours ?? '0'),
  );
  return `${formatExpiryCountdownHms(total)} ${ui(countdownSuffixKey.value)}`;
});
const primaryDisplayText = computed(() => value.value);
const avatarDisplayName = computed(() => resolveInitiatorDisplayName(value.value));
const avatarColorSeed = computed(() =>
  String(props.customize.avatarColorSeed ?? avatarDisplayName.value),
);
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
      v-if="operationTypeOnly"
      :class="styles.operationTypeOnlyRow"
      :style="hashLikeMinWidthStyle"
    >
      <span
        v-if="showBusinessTypeSecondary || showCountdownOnSecondary"
        class="hash-like-combo"
        :class="styles.hashLikeCombo"
      >
        <EgListFieldOverflowText
          :text="businessTypeSecondaryParts!.source"
          variant="primary"
          :tooltip-trigger="tooltipTrigger"
        />
        <div v-if="showCountdownOnSecondary" :class="styles.hashLikeComboSecondaryRow">
          <span :class="styles.secondaryRowAction">
            <EgListFieldOverflowText
              :text="businessTypeSecondaryParts!.action"
              variant="secondary"
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
          <EgDivider type="navigator" direction="vertical" />
          <span :class="styles.secondaryRowCountdown">
            <EgListFieldOverflowText
              :text="countdownListText"
              variant="secondary"
              tabular
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
        </div>
        <EgListFieldOverflowText
          v-else
          :text="businessTypeSecondaryParts!.action"
          variant="secondary"
          :tooltip-trigger="tooltipTrigger"
        />
      </span>
      <EgListFieldOverflowText
        v-else-if="showPlainSecondary"
        :text="secondaryValue"
        variant="secondary"
        tabular
        :tooltip-trigger="tooltipTrigger"
      />
    </div>

    <div
      v-else-if="showLeftTag || showRightTag"
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
          <EgIcon
            v-if="showAppIcon"
            :name="appIconName"
            fit
            :class="styles.appIcon"
          />
          <EgAvatar
            v-else-if="showAvatar"
            size="xs"
            :name="avatarDisplayName"
            :color-seed="avatarColorSeed"
            :class="styles.avatar"
          />
          <div :class="styles.titleTextSlot">
            <EgListFieldOverflowText
              :text="primaryDisplayText"
              variant="primary"
              :tooltip-trigger="tooltipTrigger"
            />
          </div>
          <EgTag
            v-if="showRightTag"
            family="system"
            :system-type="rightTagSystemType"
            size="sm"
          >
            {{ rightTagLabel }}
          </EgTag>
        </div>
        <div v-if="showCountdownOnSecondary" :class="styles.secondaryRow">
          <span :class="styles.secondaryRowSource">
            <EgListFieldOverflowText
              :text="businessTypeSecondaryParts!.source"
              variant="secondary"
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
          <EgDivider type="navigator" direction="vertical" />
          <span :class="styles.secondaryRowAction">
            <EgListFieldOverflowText
              :text="businessTypeSecondaryParts!.action"
              variant="secondary"
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
          <EgDivider type="navigator" direction="vertical" />
          <span :class="styles.secondaryRowCountdown">
            <EgListFieldOverflowText
              :text="countdownListText"
              variant="secondary"
              tabular
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
        </div>
        <div v-else-if="showBusinessTypeSecondary" :class="styles.secondaryRow">
          <span :class="styles.secondaryRowSource">
            <EgListFieldOverflowText
              :text="businessTypeSecondaryParts!.source"
              variant="secondary"
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
          <EgDivider type="navigator" direction="vertical" />
          <span :class="styles.secondaryRowAction">
            <EgListFieldOverflowText
              :text="businessTypeSecondaryParts!.action"
              variant="secondary"
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
        </div>
        <EgListFieldOverflowText
          v-else-if="showPlainSecondary"
          :text="secondaryValue"
          variant="secondary"
          tabular
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
        <EgIcon
          v-if="showAppIcon"
          :name="appIconName"
          fit
          :class="styles.appIcon"
        />
        <EgAvatar
          v-else-if="showAvatar"
          size="xs"
          :name="avatarDisplayName"
          :color-seed="avatarColorSeed"
          :class="styles.avatar"
        />
        <div :class="styles.titleTextSlot">
          <EgListFieldOverflowText
            :text="primaryDisplayText"
            variant="primary"
            :tooltip-trigger="tooltipTrigger"
          />
        </div>
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
        <div :class="styles.titleRow">
          <EgIcon
            v-if="showAppIcon"
            :name="appIconName"
            fit
            :class="styles.appIcon"
          />
          <EgAvatar
            v-else-if="showAvatar"
            size="xs"
            :name="avatarDisplayName"
            :color-seed="avatarColorSeed"
            :class="styles.avatar"
          />
          <EgListFieldOverflowText
            :text="primaryDisplayText"
            variant="primary"
            :tooltip-trigger="tooltipTrigger"
          />
        </div>
        <div v-if="showCountdownOnSecondary" :class="styles.secondaryRow">
          <span :class="styles.secondaryRowSource">
            <EgListFieldOverflowText
              :text="businessTypeSecondaryParts!.source"
              variant="secondary"
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
          <EgDivider type="navigator" direction="vertical" />
          <span :class="styles.secondaryRowAction">
            <EgListFieldOverflowText
              :text="businessTypeSecondaryParts!.action"
              variant="secondary"
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
          <EgDivider type="navigator" direction="vertical" />
          <span :class="styles.secondaryRowCountdown">
            <EgListFieldOverflowText
              :text="countdownListText"
              variant="secondary"
              tabular
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
        </div>
        <div v-else-if="showBusinessTypeSecondary" :class="styles.secondaryRow">
          <span :class="styles.secondaryRowSource">
            <EgListFieldOverflowText
              :text="businessTypeSecondaryParts!.source"
              variant="secondary"
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
          <EgDivider type="navigator" direction="vertical" />
          <span :class="styles.secondaryRowAction">
            <EgListFieldOverflowText
              :text="businessTypeSecondaryParts!.action"
              variant="secondary"
              :tooltip-trigger="tooltipTrigger"
            />
          </span>
        </div>
        <EgListFieldOverflowText
          v-else-if="showPlainSecondary"
          :text="secondaryValue"
          variant="secondary"
          tabular
          :tooltip-trigger="tooltipTrigger"
        />
      </span>
      <div
        v-else
        :class="showCountdown ? [styles.singleStack, countdownAlignClass] : undefined"
        :style="hashLikeMinWidthStyle"
      >
        <div :class="styles.titleRow">
          <EgIcon
            v-if="showAppIcon"
            :name="appIconName"
            fit
            :class="styles.appIcon"
          />
          <EgAvatar
            v-else-if="showAvatar"
            size="xs"
            :name="avatarDisplayName"
            :color-seed="avatarColorSeed"
            :class="styles.avatar"
          />
          <EgListFieldOverflowText
            :text="primaryDisplayText"
            variant="primary"
            :tooltip-trigger="tooltipTrigger"
          />
        </div>
        <span v-if="showCountdown" :class="styles.countdown">
          <span :class="styles.countdownTime">{{ countdownTime }}</span>
          <span :class="styles.countdownSuffix"> Until Expiry</span>
        </span>
      </div>
    </template>
  </div>
</template>
