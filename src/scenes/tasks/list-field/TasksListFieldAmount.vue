<script setup lang="ts">
import { computed } from 'vue';
import {
  EgCrypto,
  EgDivider,
  EgListFieldOverflowText,
  EgTag,
  type CryptoName,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { formatGroupedDecimalAmount } from '@/utils/formatGroupedDisplay';
import {
  formatExpiryCountdownHms,
  parseExpiryCountdownTotal,
} from '../shared/expiryCountdownUtils';
import { splitBusinessTypeSecondaryKey } from './businessTypeDisplay';
import { resolveCryptoNameFromSymbol } from './listFieldCryptoResolve';
import styles from './TasksListFieldAmount.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
}>();

function parsePreviewMinWidth(customize: Record<string, unknown>): number | undefined {
  const raw = String(customize.minWidth ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return parsed > 0 ? parsed : undefined;
}

const amountType = computed(() => String(props.customize.amountType ?? 'conversion'));
const fiatValue = computed(() =>
  formatGroupedDecimalAmount(String(props.customize.fiatValue ?? '$10')),
);
const cryptoValue = computed(() =>
  formatGroupedDecimalAmount(String(props.customize.cryptoValue ?? '12,500.000001')),
);
const cryptoSymbol = computed(() => {
  if (amountType.value === 'crypto') {
    return String(props.customize.cryptoSymbol ?? 'BTC');
  }
  return String(props.customize.cryptoSymbol ?? 'USDT');
});
const cryptoPrimaryText = computed(() => `${cryptoValue.value} ${cryptoSymbol.value}`);
const showAmountCryptoIcon = computed(() => props.customize.showCryptoIcon !== false);
const cryptoName = computed((): CryptoName => {
  const explicit = String(props.customize.cryptoName ?? '').trim();
  if (explicit) return explicit as CryptoName;
  return resolveCryptoNameFromSymbol(cryptoSymbol.value) ?? 'eds-btc-bitcoin';
});
const { ui } = useAppI18n();
const secondaryValueRaw = computed(() => String(props.customize.secondaryValue ?? '').trim());
const businessTypeSecondaryParts = computed(() => {
  const parts = splitBusinessTypeSecondaryKey(secondaryValueRaw.value);
  if (!parts) return null;
  return {
    source: ui(parts.sourceKey),
    action: ui(parts.actionKey),
  };
});
const showBusinessTypeSecondary = computed(() => businessTypeSecondaryParts.value != null);
const useTransferTypeSecondary = computed(() => secondaryValueRaw.value.length > 0);
const showCountdown = computed(
  () => showBusinessTypeSecondary.value && Boolean(props.customize.showCountdown),
);

const amountWidthConfigured = computed(() => parsePreviewMinWidth(props.customize) != null);
const alignEnd = computed(() => Boolean(props.customize.alignEnd));
/** 申请时间是字段 value，禁止走 ui()；其余副行才是 i18n key。 */
const secondaryValue = computed(() => {
  const raw = secondaryValueRaw.value;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
  return ui(raw);
});
const tooltipTrigger = computed(
  () => String(props.customize.tooltipTrigger ?? 'hover') as 'hover' | 'focus',
);
const showNetworkTag = computed(() => props.customize.showNetwork !== false);
const networkTagLabel = computed(() => {
  const label = String(props.customize.networkLabel ?? '').trim();
  return label ? ui(label) : '';
});
const countdownSuffixKey = computed(() =>
  String(props.customize.countdownSuffixKey ?? 'Expires in xx:xx').trim() || 'Expires in xx:xx',
);
const countdownListText = computed(() => {
  const total = parseExpiryCountdownTotal(
    String(props.customize.countdownMinutes ?? '30'),
    String(props.customize.countdownSeconds ?? '00'),
    String(props.customize.countdownHours ?? '0'),
  );
  return `${formatExpiryCountdownHms(total)} ${ui(countdownSuffixKey.value)}`;
});

/** Data List 单元格内：填满可用宽度并启用 tail 省略（同 Showcase amount 列）。 */
const cellMinWidthStyle = computed(() => {
  if (!amountWidthConfigured.value) return undefined;
  return { width: '100%', maxWidth: '100%', minWidth: '0' };
});
</script>

<template>
  <div
    v-if="amountType === 'fiat'"
    :class="[styles.amountPreview, alignEnd && styles.amountPreviewAlignEnd]"
    :style="cellMinWidthStyle"
  >
    <EgListFieldOverflowText
      :text="fiatValue"
      variant="primary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
  </div>
  <div
    v-else-if="amountType === 'crypto'"
    :class="[styles.amountPreview, alignEnd && styles.amountPreviewAlignEnd]"
    :style="cellMinWidthStyle"
  >
    <div :class="styles.amountPrimaryRow">
      <EgCrypto
        v-if="showAmountCryptoIcon"
        :name="cryptoName"
        fit
        :class="styles.amountCryptoIcon"
        :label="cryptoSymbol"
      />
      <EgListFieldOverflowText
        :text="cryptoPrimaryText"
        variant="primary"
        tabular
        :tooltip-trigger="tooltipTrigger"
      />
      <EgTag
        v-if="showNetworkTag && networkTagLabel"
        size="sm"
        system-type="stroke-subtle"
        truncate
      >
        {{ networkTagLabel }}
      </EgTag>
    </div>
  </div>
  <div
    v-else
    class="list-field-amount"
    :class="[styles.amountPreview, alignEnd && styles.amountPreviewAlignEnd]"
    :style="cellMinWidthStyle"
  >
    <div :class="styles.amountPrimaryRow">
      <EgCrypto
        v-if="showAmountCryptoIcon"
        :name="cryptoName"
        fit
        :class="styles.amountCryptoIcon"
        :label="cryptoSymbol"
      />
      <EgListFieldOverflowText
        :text="cryptoPrimaryText"
        variant="primary"
        tabular
        :tooltip-trigger="tooltipTrigger"
      />
      <EgTag
        v-if="showNetworkTag && networkTagLabel"
        size="sm"
        system-type="stroke-subtle"
        truncate
      >
        {{ networkTagLabel }}
      </EgTag>
    </div>
    <div v-if="showCountdown" :class="styles.amountSecondaryRow">
      <span :class="styles.amountSecondarySource">
        <EgListFieldOverflowText
          :text="businessTypeSecondaryParts!.source"
          variant="secondary"
          :tooltip-trigger="tooltipTrigger"
        />
      </span>
      <EgDivider type="navigator" direction="vertical" />
      <span :class="styles.amountSecondaryAction">
        <EgListFieldOverflowText
          :text="businessTypeSecondaryParts!.action"
          variant="secondary"
          :tooltip-trigger="tooltipTrigger"
        />
      </span>
      <EgDivider type="navigator" direction="vertical" />
      <span :class="styles.amountSecondaryCountdown">
        <EgListFieldOverflowText
          :text="countdownListText"
          variant="secondary"
          tabular
          :tooltip-trigger="tooltipTrigger"
        />
      </span>
    </div>
    <div v-else-if="showBusinessTypeSecondary" :class="styles.amountSecondaryRow">
      <span :class="styles.amountSecondarySource">
        <EgListFieldOverflowText
          :text="businessTypeSecondaryParts!.source"
          variant="secondary"
          :tooltip-trigger="tooltipTrigger"
        />
      </span>
      <EgDivider type="navigator" direction="vertical" />
      <span :class="styles.amountSecondaryAction">
        <EgListFieldOverflowText
          :text="businessTypeSecondaryParts!.action"
          variant="secondary"
          :tooltip-trigger="tooltipTrigger"
        />
      </span>
    </div>
    <EgListFieldOverflowText
      v-else-if="useTransferTypeSecondary"
      :text="secondaryValue"
      variant="secondary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
    <EgListFieldOverflowText
      v-else
      :text="`≈ ${fiatValue}`"
      variant="secondary"
      tabular
      :tooltip-trigger="tooltipTrigger"
    />
  </div>
</template>
