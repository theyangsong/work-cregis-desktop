<script setup lang="ts">
import { computed } from 'vue';
import {
  EgCryptoCombo,
  type CryptoComboEntryBadge,
  type CryptoName,
} from '@eds/desktop-components';
import { resolveCryptoNameFromSymbol } from './listFieldCryptoResolve';
import { buildCurrencySideAddressData } from './listFieldCurrencyAddressCustomize';
import { buildCurrencySideTagsList } from './listFieldCurrencyTagCustomize';
import styles from './TasksListFieldCurrency.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
}>();

function parsePreviewMinWidth(customize: Record<string, unknown>): number | undefined {
  const raw = String(customize.minWidth ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return parsed > 0 ? parsed : undefined;
}

const resolvedCryptoName = computed((): CryptoName => {
  const explicit = String(props.customize.cryptoName ?? '').trim();
  if (explicit) return explicit as CryptoName;
  return resolveCryptoNameFromSymbol(String(props.customize.symbol ?? 'ZEC')) ?? 'eds-zec-zcash';
});

const showNetwork = computed(() => Boolean(props.customize.showNetwork));

const currencyFromTagsList = computed(() => buildCurrencySideTagsList('from', props.customize));
const currencyToTagsList = computed(() => buildCurrencySideTagsList('to', props.customize));
const currencyMinWidth = computed(() => parsePreviewMinWidth(props.customize));

const entryBadge = computed(
  () => String(props.customize.entryBadgeMode ?? 'none') as CryptoComboEntryBadge,
);

const addressTooltipTrigger = computed(
  () => String(props.customize.addressTooltipTrigger ?? 'hover') as 'hover' | 'focus',
);

const comboMode = computed(() => String(props.customize.comboMode ?? 'single-address'));

const currencyFromAddress = computed(() => buildCurrencySideAddressData('from', props.customize));
const currencyToAddress = computed(() => buildCurrencySideAddressData('to', props.customize));
</script>

<template>
  <div class="desktopTokens" :class="styles.host">
    <EgCryptoCombo
      :crypto-name="resolvedCryptoName"
      :symbol="String(customize.symbol ?? 'ZEC')"
      :show-chain="showNetwork"
      :chain-label="String(customize.networkLabel ?? 'Base')"
      network-style="tag"
      :entry-badge="entryBadge"
      :content-type="comboMode === 'currency-only' ? 'unaddress' : 'address'"
      :address-mode="comboMode === 'single-address' ? 'single' : 'double'"
      :from-address="currencyFromAddress.address"
      :from-alias="currencyFromAddress.alias || undefined"
      :to-address="currencyToAddress.address"
      :to-alias="currencyToAddress.alias || undefined"
      :from-address-count="currencyFromAddress.count"
      :to-address-count="currencyToAddress.count"
      :from-addresses="currencyFromAddress.addresses"
      :to-addresses="currencyToAddress.addresses"
      :min-width="currencyMinWidth"
      :from-tags-list="currencyFromTagsList"
      :to-tags-list="currencyToTagsList"
      :address-tooltip-trigger="addressTooltipTrigger"
    />
  </div>
</template>
