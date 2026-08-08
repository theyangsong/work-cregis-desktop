<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  EgComboActionPopupWindow,
  EgComboInputItem,
  EgDivider,
  EgFormSubmission,
  EgIcon,
  EgInput,
  EgLink,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import type { MinerFeeCustomSaved } from './minerFeeCustomTypes';
import {
  minerFeeSpeedCryptoRangeKey,
  minerFeeSpeedUsdRangeKey,
  resolveMinerFeeEvmShellVariant,
} from './minerFeeEvmShellVariant';
import styles from './ApprovalRemarkPopoverPanel.module.css';

const MINER_FEE_SPEED_IDS = ['fast', 'normal', 'slow'] as const;

const MINER_FEE_SPEED_META = {
  fast: { labelKey: 'Miner fee speed fast', dotTone: 'success' as const },
  normal: { labelKey: 'Miner fee speed normal', dotTone: 'warning' as const },
  slow: { labelKey: 'Miner fee speed slow', dotTone: 'danger' as const },
};

const MINER_FEE_CUSTOM_ID = 'custom' as const;

export type MinerFeeOptionId =
  | (typeof MINER_FEE_SPEED_IDS)[number]
  | typeof MINER_FEE_CUSTOM_ID;

const props = withDefaults(
  defineProps<{
    minerFee: MinerFeeOptionId | null;
    customFeeSaved: MinerFeeCustomSaved | null;
    remark: string;
    placeholderKey: string;
    feedbackKey: string;
    confirmDisabled: boolean;
    symbol?: string;
    measureOnly?: boolean;
  }>(),
  {
    symbol: 'ETH',
  },
);

const emit = defineEmits<{
  'update:remark': [value: string];
  'select-miner-fee': [optionId: MinerFeeOptionId];
  'open-custom': [];
  confirm: [];
}>();

const { ui } = useAppI18n();

const rootRef = ref<HTMLElement | null>(null);

const shellVariant = computed(() => resolveMinerFeeEvmShellVariant(props.symbol));

const speedOptions = computed(() =>
  MINER_FEE_SPEED_IDS.map((id) => ({
    id,
    labelKey: MINER_FEE_SPEED_META[id].labelKey,
    dotTone: MINER_FEE_SPEED_META[id].dotTone,
    cryptoRangeKey: minerFeeSpeedCryptoRangeKey(shellVariant.value, id),
    usdRangeKey: minerFeeSpeedUsdRangeKey(shellVariant.value, id),
  })),
);

const remarkModel = computed({
  get: () => props.remark,
  set: (value: string) => emit('update:remark', value),
});

function dotToneClass(tone: 'success' | 'warning' | 'danger') {
  switch (tone) {
    case 'success':
      return styles.minerFeeDotSuccess;
    case 'warning':
      return styles.minerFeeDotWarning;
    case 'danger':
      return styles.minerFeeDotDanger;
  }
}

function openSavedCustom() {
  emit('select-miner-fee', MINER_FEE_CUSTOM_ID);
  emit('open-custom');
}

defineExpose({
  getMeasureEl: () => rootRef.value,
});
</script>

<template>
  <div ref="rootRef" :class="styles.minerFeeListPage">
    <div :class="styles.minerFeeRoot" data-miner-fee-screen="list">
      <section :class="styles.minerFee">
        <div
          role="radiogroup"
          :class="styles.minerFeeOptions"
          :aria-label="ui('Gas fee')"
        >
          <button
            v-for="option in speedOptions"
            :key="option.id"
            type="button"
            role="radio"
            :aria-checked="minerFee === option.id"
            :class="[
              styles.minerFeeOption,
              minerFee === option.id && styles.minerFeeOptionSelected,
            ]"
            @click="emit('select-miner-fee', option.id)"
          >
            <span :class="styles.minerFeeOptionHeader">
              <span
                :class="[styles.minerFeeDot, dotToneClass(option.dotTone)]"
                aria-hidden="true"
              />
              <span :class="styles.minerFeeOptionName">{{ ui(option.labelKey) }}</span>
            </span>
            <span :class="styles.minerFeeEthRange">{{ ui(option.cryptoRangeKey) }}</span>
            <span :class="styles.minerFeeUsdRange">{{ ui(option.usdRangeKey) }}</span>
          </button>

          <div
            v-if="customFeeSaved"
            role="radio"
            :aria-checked="minerFee === MINER_FEE_CUSTOM_ID"
            tabindex="0"
            :class="[
              styles.minerFeeOption,
              styles.minerFeeSavedCustomOption,
              minerFee === MINER_FEE_CUSTOM_ID && styles.minerFeeOptionSelected,
            ]"
            @click="openSavedCustom"
            @keydown.enter.prevent="openSavedCustom"
            @keydown.space.prevent="openSavedCustom"
          >
            <span :class="styles.minerFeeSavedCustomMain">
              <span :class="styles.minerFeeOptionHeader">
                <span :class="styles.minerFeeOptionName">{{ ui('Custom') }}</span>
              </span>
              <span :class="styles.minerFeeEthRange">{{ customFeeSaved.cryptoRange }}</span>
              <span :class="styles.minerFeeUsdRange">{{ customFeeSaved.usdRange }}</span>
            </span>
            <EgLink
              :class="styles.minerFeeSavedCustomEdit"
              size="md"
              href="#"
              tabindex="-1"
              aria-hidden="true"
              @click.prevent
            >
              {{ ui('Edit') }}
            </EgLink>
          </div>
          <button
            v-else
            type="button"
            role="radio"
            :aria-checked="minerFee === MINER_FEE_CUSTOM_ID"
            :class="[
              styles.minerFeeCustomOption,
              minerFee === MINER_FEE_CUSTOM_ID && styles.minerFeeOptionSelected,
            ]"
            @click="emit('open-custom')"
          >
            <span
              v-if="measureOnly"
              :class="styles.minerFeeCustomOptionIconSpacer"
              aria-hidden="true"
            />
            <EgIcon v-else name="eds-gear-fill" size="sm" />
            <span :class="styles.minerFeeOptionName">{{ ui('Custom') }}</span>
          </button>
        </div>
      </section>
    </div>

    <EgDivider type="page" :class="styles.minerFeeDivider" />

    <div :class="styles.minerFeeFooter">
      <div :class="styles.remarkField">
        <EgComboInputItem feedback :label="ui('Remark')">
          <EgInput
            v-model="remarkModel"
            width-mode="full"
            :placeholder="ui(placeholderKey)"
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
        :confirm-disabled="confirmDisabled"
        @confirm="emit('confirm')"
      />
    </div>
  </div>
</template>
