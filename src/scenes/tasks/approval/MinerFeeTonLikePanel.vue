<script setup lang="ts">
import {
  EgComboActionPopupWindow,
  EgComboInputItem,
  EgDivider,
  EgFormSubmission,
  EgInput,
} from '@eds/desktop-components';
import { computed } from 'vue';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  buildTonLikeMinerFeeDisplay,
  resolveTonLikeMinerFeeQuote,
} from './minerFeeTonLikeDisplay';
import type { MinerFeeProfile, MinerFeeSelection } from '../shared/minerFeeProfile';
import styles from './ApprovalRemarkPopoverPanel.module.css';

const props = defineProps<{
  profile: MinerFeeProfile;
  remark: string;
  placeholderKey: string;
  feedbackKey: string;
}>();

const emit = defineEmits<{
  'update:remark': [value: string];
  confirm: [selection: MinerFeeSelection];
}>();

const { ui } = useAppI18n();

const feeQuote = computed(() => resolveTonLikeMinerFeeQuote(props.profile.symbol));

const primaryLine = computed(() => {
  const ticker = props.profile.symbol.trim().toUpperCase() || '—';
  return `${feeQuote.value.cryptoAmount} ${ticker}`;
});

const usdApproxLine = computed(() => `≈ ${feeQuote.value.usdApprox}`);

function onConfirm() {
  emit('confirm', {
    profileKind: props.profile.kind,
    displayValue: buildTonLikeMinerFeeDisplay(props.profile.symbol, feeQuote.value),
  });
}
</script>

<template>
  <div :class="styles.minerFeeListPage" data-miner-fee-ton-like>
    <div :class="styles.minerFeeRoot" data-miner-fee-screen="list">
      <section :class="styles.minerFee">
        <div :class="styles.minerFeeFixedQuote">
          <p :class="styles.minerFeeFixedQuoteLabel">{{ primaryLine }}</p>
          <p :class="styles.minerFeeFixedQuoteUsd">{{ usdApproxLine }}</p>
        </div>
      </section>
    </div>

    <EgDivider type="page" :class="styles.minerFeeTonLikeDivider" />

    <div :class="styles.minerFeeTonLikeFooter">
      <div :class="styles.remarkField">
        <EgComboInputItem feedback :label="ui('Remark')">
          <EgInput
            :model-value="remark"
            width-mode="full"
            :placeholder="ui(placeholderKey)"
            @update:model-value="emit('update:remark', $event)"
          />
          <template #feedback>
            <EgFormSubmission
              type="notes"
              :text="ui(feedbackKey)"
              :show-link="false"
            />
          </template>
        </EgComboInputItem>
      </div>

      <EgComboActionPopupWindow
        tone="decor"
        :count="1"
        :confirm-label="ui('Confirm')"
        @confirm="onConfirm"
      />
    </div>
  </div>
</template>
