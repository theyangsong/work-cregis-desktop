<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  EgButton,
  EgComboInputItem,
  EgIcon,
  EgIconButton,
  EgInput,
  EgTabs,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './MinerFeeCustomPanel.module.css';
import {
  buildMinerFeeCustomPreview,
  defaultMinerFeeCustomDraft,
  type MinerFeeCustomDraft,
  type MinerFeeCustomMode,
} from './minerFeeCustomTypes';
import {
  resolveMinerFeeEvmShellVariant,
  type MinerFeeEvmShellVariant,
} from './minerFeeEvmShellVariant';

const props = defineProps<{
  draft?: MinerFeeCustomDraft;
  symbol?: string;
  measureOnly?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  cancel: [];
  save: [draft: MinerFeeCustomDraft];
}>();

const { ui } = useAppI18n();

const rootRef = ref<HTMLElement | null>(null);
const topToolHost = ref<HTMLElement | null>(null);

const shellVariant = computed<MinerFeeEvmShellVariant>(() =>
  resolveMinerFeeEvmShellVariant(props.symbol ?? 'ETH'),
);

const isBtcShell = computed(() => shellVariant.value === 'btc');

function mergeDraft(draft?: MinerFeeCustomDraft): MinerFeeCustomDraft {
  return { ...defaultMinerFeeCustomDraft(shellVariant.value), ...(draft ?? {}) };
}

const form = ref<MinerFeeCustomDraft>(mergeDraft());

watch(
  () => props.draft,
  (draft) => {
    form.value = mergeDraft(draft);
  },
  { immediate: true },
);

const isAdvancedMode = computed(() => form.value.mode === 'advanced');

const tabModel = computed(() => (isAdvancedMode.value ? 0 : 1));

const tabLabels = computed(() => [ui('Advanced mode'), ui('Normal mode')]);

const preview = computed(() => buildMinerFeeCustomPreview(form.value, shellVariant.value));

const previewText = computed(() => {
  if (isBtcShell.value) {
    return `${preview.value.cryptoRange} ${preview.value.usdRange}`;
  }
  return `${preview.value.cryptoRange} ≈ ${preview.value.usdRange}`;
});

function onTabSelect(index: number) {
  const nextMode: MinerFeeCustomMode = index === 0 ? 'advanced' : 'normal';
  if (form.value.mode === nextMode) return;
  form.value = { ...form.value, mode: nextMode };
}

function resolveTopToolHost() {
  topToolHost.value =
    (rootRef.value
      ?.closest('.eds-popover-content')
      ?.querySelector('[class*="topTool"]') as HTMLElement | null) ?? null;
}

onMounted(async () => {
  if (props.measureOnly) {
    return;
  }
  await nextTick();
  resolveTopToolHost();
  if (!topToolHost.value) {
    requestAnimationFrame(resolveTopToolHost);
  }
});

onBeforeUnmount(() => {
  topToolHost.value = null;
});

function onSave() {
  emit('save', { ...form.value });
}

defineExpose({
  getMeasureEl: () => rootRef.value,
  getDraft: () => ({ ...form.value }),
});
</script>

<template>
  <div
    ref="rootRef"
    :class="styles.root"
    :data-miner-fee-popover="measureOnly ? undefined : true"
    :data-miner-fee-screen="measureOnly ? undefined : 'custom'"
  >
    <Teleport v-if="!measureOnly && topToolHost" :to="topToolHost">
      <div :class="styles.customTopTool">
        <EgIconButton shape="square" size="sm" :label="ui('Back')" @click="emit('back')">
          <EgIcon name="eds-arrow-left-mini-ios" fit />
        </EgIconButton>
        <span :class="styles.customTopToolTitle">{{ ui('Custom') }}</span>
      </div>
    </Teleport>

    <div :class="styles.body">
      <EgTabs
        v-if="!isBtcShell"
        :model-value="tabModel"
        :labels="tabLabels"
        horizontal-gap="sm"
        vertical-gap="xs"
        @update:model-value="onTabSelect"
      />

      <div :class="styles.fields">
        <template v-if="isBtcShell">
          <EgComboInputItem :label="ui('Fee Rate')">
            <EgInput
              v-model="form.feeRate"
              width-mode="full"
              inputmode="decimal"
              unit="sats/vB"
              :clearable="false"
            />
          </EgComboInputItem>
        </template>

        <template v-else-if="isAdvancedMode">
          <EgComboInputItem :label="ui('Max Fee')">
            <EgInput
              v-model="form.maxFee"
              width-mode="full"
              inputmode="decimal"
              unit="GWEI"
              :clearable="false"
            />
          </EgComboInputItem>

          <EgComboInputItem :label="ui('Max Priority Fee')">
            <EgInput
              v-model="form.maxPriorityFee"
              width-mode="full"
              inputmode="decimal"
              unit="GWEI"
              :clearable="false"
            />
          </EgComboInputItem>

          <EgComboInputItem :label="ui('Gas Limit')">
            <EgInput
              v-model="form.gasLimit"
              width-mode="full"
              inputmode="decimal"
              unit="GAS"
              :clearable="false"
            />
          </EgComboInputItem>
        </template>

        <template v-else>
          <EgComboInputItem :label="ui('Gas Price')">
            <EgInput
              v-model="form.gasPrice"
              width-mode="full"
              inputmode="decimal"
              unit="GWEI"
              :clearable="false"
            />
          </EgComboInputItem>

          <EgComboInputItem :label="ui('Gas Limit')">
            <EgInput
              v-model="form.gasLimit"
              width-mode="full"
              inputmode="decimal"
              unit="GAS"
              :clearable="false"
            />
          </EgComboInputItem>
        </template>
      </div>

      <div :class="styles.preview">
        <span :class="styles.previewLabel">{{ ui('Preview') }}</span>
        <p :class="styles.previewValue">{{ previewText }}</p>
      </div>
    </div>

    <div :class="styles.footer">
      <EgButton
        :class="styles.footerButton"
        tone="subtle"
        variant="outline"
        size="md"
        @click="emit('cancel')"
      >
        {{ ui('Cancel') }}
      </EgButton>
      <EgButton
        :class="styles.footerButton"
        tone="decor"
        variant="solid"
        size="md"
        @click="onSave"
      >
        {{ ui('Save') }}
      </EgButton>
    </div>
  </div>
</template>
