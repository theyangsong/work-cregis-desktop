<script setup lang="ts">
import { ref } from 'vue';
import {
  EgAvatar,
  EgCrypto,
  EgIcon,
  EgIconButton,
  EgLink,
  EgTag,
  type DetailItemData,
} from '@eds/desktop-components';
import styles from './SigningCustomPopupItemRow.module.css';

const props = defineProps<{
  item: DetailItemData;
  itemIndex: number;
}>();

const emit = defineEmits<{
  'value-link-click': [];
}>();

const copiedItemKey = ref<string | null>(null);
let copiedResetTimer: ReturnType<typeof setTimeout> | undefined;

function itemCopyKey(item: DetailItemData, itemIndex: number): string {
  return item.key ?? String(itemIndex);
}

function itemShowsTitleIcon(item: DetailItemData): boolean {
  if (item.showTitleIcon === false) return false;
  return Boolean(item.titleIcon);
}

function itemShowsValueCrypto(item: DetailItemData): boolean {
  if (item.showValueSymbol) return item.valueSymbolKind === 'crypto';
  return item.valueType === 'crypto' && Boolean(item.valueIcon);
}

function itemValueCryptoName(item: DetailItemData): string | undefined {
  if (item.showValueSymbol && item.valueSymbolKind === 'crypto') {
    return item.valueSymbolCrypto;
  }
  return item.valueIcon;
}

function itemShowsValueAvatar(item: DetailItemData): boolean {
  if (item.valueSymbolAvatarName) return true;
  if (item.showValueSymbol) return item.valueSymbolKind === 'avatar';
  return item.valueType === 'user';
}

function itemValueAvatarName(item: DetailItemData): string {
  if (item.valueSymbolAvatarName) return item.valueSymbolAvatarName;
  if (item.showValueSymbol && item.valueSymbolKind === 'avatar') {
    return item.valueSymbolAvatarName ?? item.value;
  }
  return item.value;
}

function itemHasValueTrailingActions(item: DetailItemData): boolean {
  return Boolean(
    item.showValueLink
      || item.showValueCopy
      || item.showValueAddressBook
      || item.showValueAmlSearch
      || item.showValueBrowser,
  );
}

async function onCopyItemValue(
  copyKey: string,
  value: string,
  event: MouseEvent,
) {
  event.stopPropagation();
  event.preventDefault();
  try {
    await navigator.clipboard.writeText(value);
    copiedItemKey.value = copyKey;
    if (copiedResetTimer) clearTimeout(copiedResetTimer);
    copiedResetTimer = setTimeout(() => {
      if (copiedItemKey.value === copyKey) copiedItemKey.value = null;
    }, 2000);
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div :class="styles.itemRow">
    <div :class="styles.itemTitle">
      <EgIcon
        v-if="itemShowsTitleIcon(item)"
        :class="styles.itemTitleIcon"
        :name="item.titleIcon!"
        size="sm"
        fit
      />
      <span :class="styles.itemTitleText">{{ item.title }}</span>
    </div>

    <div :class="styles.itemValue">
      <EgTag
        v-if="item.tag && item.tagBeforeValue"
        :family="item.tagFamily ?? 'system'"
        :status="item.tagStatus"
        :system-type="item.tagSystemType ?? 'stroke-subtle'"
        size="sm"
      >
        {{ item.tag }}
      </EgTag>

      <EgCrypto
        v-if="itemShowsValueCrypto(item) && itemValueCryptoName(item)"
        :class="styles.itemValueCrypto"
        :name="itemValueCryptoName(item)!"
        size="md"
        fit
      />
      <EgAvatar
        v-else-if="itemShowsValueAvatar(item)"
        size="sm"
        :name="itemValueAvatarName(item)"
      />

      <span
        v-if="!item.valueTagOnly && item.value"
        :class="[
          styles.itemValueText,
          !itemShowsValueAvatar(item) && styles.itemValueTextNowrap,
        ]"
      >
        {{ item.value }}
      </span>

      <EgTag
        v-if="item.tag && !item.tagBeforeValue"
        :family="item.tagFamily ?? 'system'"
        :status="item.tagStatus"
        :system-type="item.tagSystemType ?? 'stroke-subtle'"
        size="sm"
      >
        {{ item.tag }}
      </EgTag>

      <div v-if="itemHasValueTrailingActions(item)" :class="styles.itemValueTrailing">
        <EgLink
          v-if="item.showValueLink"
          size="sm"
          tone="brand"
          @click="emit('value-link-click')"
        >
          {{ item.valueLinkLabel ?? 'Edit' }}
        </EgLink>

        <span
          v-if="item.showValueCopy"
          :class="[
            styles.copyButton,
            copiedItemKey === itemCopyKey(item, itemIndex)
              && styles.copyButtonCopied,
          ]"
          @click.stop
        >
          <EgIconButton
            shape="square"
            size="xs"
            label="复制"
            @click="onCopyItemValue(itemCopyKey(item, itemIndex), item.value, $event)"
          >
            <EgIcon
              :name="
                copiedItemKey === itemCopyKey(item, itemIndex)
                  ? 'eds-enable-fill'
                  : 'eds-copy'
              "
              fit
            />
          </EgIconButton>
        </span>

        <EgIconButton
          v-if="item.showValueAddressBook"
          shape="square"
          size="xs"
          label="添加到地址簿"
        >
          <EgIcon name="eds-associates" fit />
        </EgIconButton>

        <EgIconButton
          v-if="item.showValueAmlSearch"
          shape="square"
          size="xs"
          label="AML 查询"
        >
          <EgIcon name="eds-aml-search" fit />
        </EgIconButton>

        <EgIconButton
          v-if="item.showValueBrowser"
          shape="square"
          size="xs"
          label="区块浏览器"
        >
          <EgIcon name="eds-earth" fit />
        </EgIconButton>
      </div>
    </div>
  </div>
</template>
