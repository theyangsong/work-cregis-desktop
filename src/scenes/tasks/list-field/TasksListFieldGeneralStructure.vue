<script setup lang="ts">
import { computed } from 'vue';
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

function parsePreviewMinWidth(customize: Record<string, unknown>): number | undefined {
  const raw = String(customize.minWidth ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return parsed > 0 ? parsed : undefined;
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
  () =>
    (operationTypeOnly.value || isDoubleLine.value)
    && secondaryValueRaw.value.length > 0
    && businessTypeSecondaryParts.value != null,
);
const showPlainSecondary = computed(
  () =>
    (operationTypeOnly.value || isDoubleLine.value)
    && secondaryValueRaw.value.length > 0
    && businessTypeSecondaryParts.value == null,
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
const countdownStaticTotal = computed(() =>
  parseExpiryCountdownTotal(
    String(props.customize.countdownMinutes ?? '30'),
    String(props.customize.countdownSeconds ?? '00'),
    String(props.customize.countdownHours ?? '0'),
  ),
);

/** 列表仅展示静态 H:MM:SS；实时倒计时只在详情 ExpiryCountdown。 */
const countdownListText = computed(() =>
  `${formatExpiryCountdownHms(countdownStaticTotal.value)} ${ui(countdownSuffixKey.value)}`,
);

const countdownStaticTime = computed(() => formatExpiryCountdownHms(countdownStaticTotal.value));
const primaryDisplayText = computed(() => resolveInitiatorDisplayName(value.value));
const avatarDisplayName = primaryDisplayText;
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
        :style="hashLikeMinWidthStyle"
      >
        <span :class="styles.operationTypePrimaryLine">
          <EgListFieldOverflowText
            :text="businessTypeSecondaryParts!.source"
            variant="primary"
            :tooltip-trigger="tooltipTrigger"
          />
        </span>
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
          <span :class="styles.countdownTime">{{ countdownStaticTime }}</span>
          <span :class="styles.countdownSuffix"> {{ ui(countdownSuffixKey) }}</span>
        </span>
      </div>
    </template>
  </div>
</template>
