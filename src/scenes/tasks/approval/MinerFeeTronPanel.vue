<script setup lang="ts">
import {
  EgComboActionPopupWindow,
  EgComboInputItem,
  EgDivider,
  EgFormSubmission,
  EgIcon,
  EgInput,
  EgTag,
} from '@eds/desktop-components';
import { computed } from 'vue';
import { useAppI18n } from '@/composables/useAppI18n';
import type { MinerFeeProfile, MinerFeeSelection } from '../shared/minerFeeProfile';
import {
  buildTronMinerFeeDisplay,
  fillMinerFeeUiTemplate,
  resolveTronMinerFeeQuote,
  resolveTronResourcesIconName,
} from './minerFeeTronDisplay';
import styles from './ApprovalRemarkPopoverPanel.module.css';

const props = withDefaults(
  defineProps<{
    profile: MinerFeeProfile;
    remark: string;
    placeholderKey: string;
    feedbackKey: string;
    hideInlineConfirm?: boolean;
  }>(),
  {
    hideInlineConfirm: false,
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  confirm: [selection: MinerFeeSelection];
}>();

const { ui } = useAppI18n();

const feeQuote = computed(() => resolveTronMinerFeeQuote());

const resourcesIconName = resolveTronResourcesIconName();

const resourcesLine = computed(() =>
  fillMinerFeeUiTemplate(ui('Miner fee tron resources line'), {
    bandwidth: feeQuote.value.bandwidth,
    energy: feeQuote.value.energy,
  }),
);

const activationNote = computed(() =>
  fillMinerFeeUiTemplate(ui('Miner fee tron activation note'), {
    trx: feeQuote.value.activationExtraTrx,
  }),
);

const estimatedCostPrimary = computed(() =>
  fillMinerFeeUiTemplate(ui('Miner fee tron estimated cost primary'), {
    trx: feeQuote.value.estimatedTrx,
  }),
);

const estimatedCostUsd = computed(() =>
  fillMinerFeeUiTemplate(ui('Miner fee tron estimated cost usd'), {
    usd: feeQuote.value.estimatedUsd,
  }),
);

function onConfirm() {
  emit('confirm', {
    profileKind: props.profile.kind,
    displayValue: buildTronMinerFeeDisplay(feeQuote.value),
  });
}

defineExpose({
  attemptConfirm: onConfirm,
  confirmDisabled: computed(() => false),
});
</script>

<template>
  <div :class="styles.minerFeeListPage" data-miner-fee-tron>
    <div :class="styles.minerFeeRoot" data-miner-fee-screen="list">
      <section :class="styles.minerFeeTronBody">
        <div :class="styles.minerFeeTronSection">
          <p :class="styles.minerFeeTronSectionTitle">
            {{ ui('Miner fee tron resources title') }}
          </p>

          <div :class="styles.minerFeeTronResourcesRow">
            <EgIcon
              :class="styles.minerFeeTronResourcesIcon"
              :name="resourcesIconName"
              size="sm"
              fill-tone="primary"
            />
            <span :class="styles.minerFeeTronResourcesText">{{ resourcesLine }}</span>
          </div>

          <div :class="styles.minerFeeTronActivationFeedback">
            <EgFormSubmission
              type="notes"
              :text="activationNote"
              :show-link="false"
            />
          </div>
        </div>

        <EgDivider type="page" :class="styles.minerFeeTronInnerDivider" />

        <div :class="styles.minerFeeTronSection">
          <p :class="styles.minerFeeTronPaymentLabel">
            {{ ui('Miner fee tron payment mode') }}
          </p>

          <div :class="styles.minerFeeTronPaymentCard">
            <div :class="styles.minerFeeTronPaymentHeader">
              <span :class="styles.minerFeeTronPaymentModeName">
                {{ ui('Miner fee tron energy mode') }}
              </span>
              <span :class="styles.minerFeeTronPaymentTags">
                <EgTag size="sm" system-type="stroke-solid">
                  {{ ui('Miner fee tron recommended') }}
                </EgTag>
                <EgTag family="status" size="sm" status="ready">
                  {{ ui('Miner fee tron save percent') }}
                </EgTag>
              </span>
            </div>

            <p :class="styles.minerFeeTronProviderNote">
              {{ ui('Miner fee tron provider note') }}
            </p>

            <p :class="styles.minerFeeTronEstimatedCost">
              {{ estimatedCostPrimary }}
              <span :class="styles.minerFeeTronEstimatedCostUsd">{{ estimatedCostUsd }}</span>
            </p>
          </div>
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
        v-if="!hideInlineConfirm"
        tone="decor"
        :count="1"
        :confirm-label="ui('Confirm')"
        @confirm="onConfirm"
      />
    </div>
  </div>
</template>
