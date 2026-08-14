<script setup lang="ts">
import { computed } from 'vue';
import {
  EgListFieldAddressLine,
  EgTag,
  EgTextOverflowTooltip,
  formatMoreTagLabel,
  hasAddressTags,
  splitTagsForDisplay,
  type CryptoAddressSideTags,
  type TagSystemType,
} from '@eds/desktop-components';
import { resolveListFieldAddressLineModel } from './listFieldAddressLineModel';
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
    tooltipTrigger?: 'hover' | 'focus';
    alignEnd?: boolean;
  }>(),
  {
    showRowTag: false,
    rowTagLabel: 'Tag',
    rowTagSystemType: 'gray',
    secondaryText: '',
    tooltipTrigger: 'hover',
    alignEnd: false,
  },
);

const model = computed(() => resolveListFieldAddressLineModel(props.prefix, props.customize));
const sideData = computed(() => buildCurrencySideAddressData(props.prefix, props.customize));
/** 多地址 (>2) 走 EgListFieldAddressLine 计数行；单地址别名仍用业务 alias 布局。 */
const useAliasLayout = computed(
  () => Boolean(model.value.alias) && sideData.value.count <= 2,
);
const showRowTag = computed(
  () => props.showRowTag && String(props.rowTagLabel ?? '').trim().length > 0,
);
const showSecondaryText = computed(() => String(props.secondaryText ?? '').trim().length > 0);
const showTags = computed(() => hasAddressTags(props.tags?.system, props.tags?.custom));
const inlineTags = computed(() =>
  splitTagsForDisplay(props.tags?.system, props.tags?.custom).inline,
);
const hiddenTagCount = computed(
  () => splitTagsForDisplay(props.tags?.system, props.tags?.custom).hidden.length,
);
const showMoreTag = computed(() => hiddenTagCount.value > 0);
const moreTagLabel = computed(() => formatMoreTagLabel(hiddenTagCount.value));
const copyLabel = computed(() => `复制地址 ${model.value.address}`);
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
      :row-tag-label="rowTagLabel"
      :row-tag-system-type="rowTagSystemType"
      :secondary-text="secondaryText"
      :tooltip-trigger="tooltipTrigger"
    />
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
      :menu-secondary-text="showSecondaryText ? secondaryText : undefined"
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
            {{ model.alias }}
          </span>
          <EgTag
            v-if="showRowTag"
            :class="styles.rowTag"
            size="sm"
            :system-type="rowTagSystemType"
            truncate
          >
            {{ rowTagLabel }}
          </EgTag>
        </div>

        <span v-if="showSecondaryText" :class="styles.metaSecondaryText">
          {{ secondaryText }}
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
              {{ tag.label }}
            </EgTag>
            <EgTag
              v-else-if="isColorfulTag(tag)"
              family="colorful"
              :colorful-style="tag.colorfulStyle ?? 'apricot'"
              size="sm"
              truncate
            >
              {{ tag.label }}
            </EgTag>
            <EgTag
              v-else
              family="system"
              :system-type="tag.systemType ?? 'solid-red'"
              size="sm"
              truncate
            >
              {{ tag.label }}
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
