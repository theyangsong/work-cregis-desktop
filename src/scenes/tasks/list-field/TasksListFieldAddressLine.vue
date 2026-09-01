<script setup lang="ts">
import { computed } from 'vue';
import {
  EgListFieldAddressLine,
  EgListFieldOverflowText,
  EgTag,
  EgTextOverflowTooltip,
  formatMoreTagLabel,
  hasAddressTags,
  splitTagsForDisplay,
  type CryptoAddressSideTags,
  type TagSystemType,
} from '@eds/desktop-components';
import { resolveListFieldAddressLineModel, truncateAddressMiddle } from './listFieldAddressLineModel';
import { useAppI18n } from '@/composables/useAppI18n';
import { buildCurrencySideAddressData } from './listFieldCurrencyAddressCustomize';
import styles from './TasksListFieldAddressLine.module.css';

const props = withDefaults(
  defineProps<{
    prefix: 'from' | 'to';
    customize: Record<string, unknown>;
    tags?: CryptoAddressSideTags;
    showRowTag?: boolean;
    rowTagLabel?: string;
    rowTagSystemType?: TagSystemType;
    secondaryText?: string;
    /** 发送方列：主行钱包名 + 副行地址（tooltip 仍展示 from 完整地址）。 */
    walletAsPrimary?: boolean;
    walletDisplayName?: string;
    tooltipTrigger?: 'hover' | 'focus';
    alignEnd?: boolean;
  }>(),
  {
    showRowTag: false,
    rowTagLabel: 'Tag',
    rowTagSystemType: 'gray',
    secondaryText: '',
    walletAsPrimary: false,
    walletDisplayName: '',
    tooltipTrigger: 'hover',
    alignEnd: false,
  },
);

const { ui } = useAppI18n();

const model = computed(() => resolveListFieldAddressLineModel(props.prefix, props.customize));
const sideData = computed(() => buildCurrencySideAddressData(props.prefix, props.customize));
const useWalletPrimaryLayout = computed(
  () =>
    props.walletAsPrimary
    && String(props.walletDisplayName ?? '').trim().length > 0
    && sideData.value.count <= 2,
);
/** 多地址 (>2) 走 EgListFieldAddressLine；单地址别名 / 钱包主行走业务布局。 */
const useAliasLayout = computed(
  () => useWalletPrimaryLayout.value || (Boolean(model.value.alias) && sideData.value.count <= 2),
);
const primaryLineText = computed(() => {
  if (useWalletPrimaryLayout.value) {
    return String(props.walletDisplayName ?? '').trim();
  }
  return model.value.alias;
});
const secondaryLineText = computed(() => {
  if (useWalletPrimaryLayout.value) {
    return truncateAddressMiddle(model.value.address);
  }
  return String(props.secondaryText ?? '').trim();
});
const showRowTag = computed(
  () => props.showRowTag && String(props.rowTagLabel ?? '').trim().length > 0,
);
const displayRowTagLabel = computed(() => ui(String(props.rowTagLabel ?? 'Tag')));

function tagLabel(label: string | undefined): string {
  return ui(label ?? '');
}
const showSecondaryText = computed(() => secondaryLineText.value.length > 0);
const showTags = computed(() => hasAddressTags(props.tags?.system, props.tags?.custom));
const inlineTags = computed(() =>
  splitTagsForDisplay(props.tags?.system, props.tags?.custom).inline,
);
const hiddenTagCount = computed(
  () => splitTagsForDisplay(props.tags?.system, props.tags?.custom).hidden.length,
);
const showMoreTag = computed(() => hiddenTagCount.value > 0);
const moreTagLabel = computed(() => formatMoreTagLabel(hiddenTagCount.value));
const copyLabel = computed(() => `${ui('Copy address')} ${model.value.address}`.trim());
const addressTooltipHostClass = computed(() =>
  [styles.addressTooltipHost, props.alignEnd && styles.addressTooltipHostAlignEnd]
    .filter(Boolean)
    .join(' '),
);
const tooltipTriggerBodyClass = computed(() =>
  [styles.tooltipTriggerBody, props.alignEnd && styles.tooltipTriggerBodyAlignEnd]
    .filter(Boolean)
    .join(' '),
);
const walletMetaRowClass = computed(() =>
  [styles.walletMetaRow, props.alignEnd && styles.walletMetaRowAlignEnd]
    .filter(Boolean)
    .join(' '),
);
/** measureRef 专用：覆盖 DS .measure 的 nowrap，勿与 walletMetaRow 混用。 */
const walletMetaMeasureClass = computed(() =>
  [styles.walletMetaMeasureHost, props.alignEnd && styles.walletMetaMeasureHostAlignEnd]
    .filter(Boolean)
    .join(' '),
);
const showWalletMetaRow = computed(() => showSecondaryText.value || showTags.value);

function isCustomTag(tag: (typeof inlineTags.value)[number]): boolean {
  return tag.family === 'custom';
}

function isColorfulTag(tag: (typeof inlineTags.value)[number]): boolean {
  return tag.colorfulStyle != null || tag.family === 'colorful';
}
</script>

<template>
  <div v-if="!useAliasLayout" :class="[styles.addressLineHost, alignEnd && styles.addressLineHostAlignEnd]">
    <EgListFieldAddressLine
      :text="model.address"
      :address-count="sideData.count"
      :addresses="sideData.addresses"
      :tags="tags"
      :show-row-tag="showRowTag"
      :row-tag-label="displayRowTagLabel"
      :row-tag-system-type="rowTagSystemType"
      :secondary-text="secondaryText"
      :tooltip-trigger="tooltipTrigger"
    />
  </div>

  <div
    v-else-if="useWalletPrimaryLayout"
    :class="[styles.aliasHost, styles.walletAliasHost, alignEnd && styles.aliasHostAlignEnd]"
  >
    <div :class="styles.aliasPrimaryRow">
      <div :class="styles.walletPrimaryText">
        <EgListFieldOverflowText
          :text="primaryLineText"
          :tooltip-trigger="tooltipTrigger"
          boundary-selector=".eds-data-list"
        />
      </div>
      <EgTag
        v-if="showRowTag"
        :class="styles.rowTag"
        size="sm"
        :system-type="rowTagSystemType"
        truncate
      >
        {{ displayRowTagLabel }}
      </EgTag>
    </div>

    <EgTextOverflowTooltip
      v-if="showWalletMetaRow"
      :tooltip-text="model.address"
      :copy-value="model.address"
      :trigger="tooltipTrigger"
      semantic-truncated
      target-tone="secondary"
      defer-hover-target
      :measure-class="walletMetaMeasureClass"
      :copy-label="copyLabel"
      show-tooltip-copy
      :menu-tags="showTags ? tags : undefined"
      boundary-selector=".eds-data-list"
      :host-class="addressTooltipHostClass"
    >
      <div :class="walletMetaRowClass">
        <span
          v-if="showSecondaryText"
          :class="[
            styles.walletMetaAddress,
            styles.addressHoverMotion,
            'eds-hover-tooltip-trigger__target',
            'eds-hover-tooltip-trigger__target--secondary',
          ]"
        >
          {{ secondaryLineText }}
        </span>

        <span v-if="showTags || showMoreTag" :class="styles.walletMetaTags">
          <template v-for="(tag, index) in inlineTags" :key="`wallet-meta-tag-${index}`">
            <EgTag
              v-if="isCustomTag(tag)"
              family="custom"
              :custom-style="tag.customStyle ?? 'vermilion'"
              size="sm"
              truncate
            >
              {{ tagLabel(tag.label) }}
            </EgTag>
            <EgTag
              v-else-if="isColorfulTag(tag)"
              family="colorful"
              :colorful-style="tag.colorfulStyle ?? 'apricot'"
              size="sm"
              truncate
            >
              {{ tagLabel(tag.label) }}
            </EgTag>
            <EgTag
              v-else
              family="system"
              :system-type="tag.systemType ?? 'solid-red'"
              size="sm"
              truncate
            >
              {{ tagLabel(tag.label) }}
            </EgTag>
          </template>

          <EgTag v-if="showMoreTag" family="system" system-type="gray" size="sm" truncate>
            {{ moreTagLabel }}
          </EgTag>
        </span>
      </div>
    </EgTextOverflowTooltip>
  </div>

  <div v-else :class="[styles.aliasHost, alignEnd && styles.aliasHostAlignEnd]">
    <EgTextOverflowTooltip
      :tooltip-text="model.address"
      :copy-value="model.address"
      :trigger="tooltipTrigger"
      semantic-truncated
      target-tone="primary"
      :typography-class="styles.aliasLine"
      :measure-class="tooltipTriggerBodyClass"
      :copy-label="copyLabel"
      show-tooltip-copy
      defer-hover-target
      :menu-alias="model.alias"
      :menu-secondary-text="
        showSecondaryText
          ? secondaryLineText
          : undefined
      "
      :menu-tags="showTags ? tags : undefined"
      boundary-selector=".eds-data-list"
      :host-class="addressTooltipHostClass"
    >
      <div :class="tooltipTriggerBodyClass">
        <div :class="styles.aliasPrimaryRow">
          <span
            :class="[
              styles.aliasLine,
              styles.addressHoverMotion,
              'eds-hover-tooltip-trigger__target',
              'eds-hover-tooltip-trigger__target--primary',
            ]"
          >
            {{ primaryLineText }}
          </span>
          <EgTag
            v-if="showRowTag"
            :class="styles.rowTag"
            size="sm"
            :system-type="rowTagSystemType"
            truncate
          >
            {{ displayRowTagLabel }}
          </EgTag>
        </div>

        <span v-if="showSecondaryText" :class="styles.metaSecondaryText">
          {{ secondaryLineText }}
        </span>

        <div v-if="showTags" :class="styles.metaRow">
          <template v-for="(tag, index) in inlineTags" :key="`alias-tag-${index}`">
            <EgTag
              v-if="isCustomTag(tag)"
              family="custom"
              :custom-style="tag.customStyle ?? 'vermilion'"
              size="sm"
              truncate
            >
              {{ tagLabel(tag.label) }}
            </EgTag>
            <EgTag
              v-else-if="isColorfulTag(tag)"
              family="colorful"
              :colorful-style="tag.colorfulStyle ?? 'apricot'"
              size="sm"
              truncate
            >
              {{ tagLabel(tag.label) }}
            </EgTag>
            <EgTag
              v-else
              family="system"
              :system-type="tag.systemType ?? 'solid-red'"
              size="sm"
              truncate
            >
              {{ tagLabel(tag.label) }}
            </EgTag>
          </template>
          <EgTag v-if="showMoreTag" family="system" system-type="gray" size="sm" truncate>
            {{ moreTagLabel }}
          </EgTag>
        </div>
      </div>
    </EgTextOverflowTooltip>
  </div>
</template>
