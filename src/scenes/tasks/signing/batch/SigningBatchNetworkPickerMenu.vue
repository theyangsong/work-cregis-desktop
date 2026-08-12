<script setup lang="ts">
import {
  EgButton,
  EgCrypto,
  EgDivider,
  EgTag,
  type CryptoName,
} from '@eds/desktop-components';
import comboActionStyles from '@eds/desktop-components/molecules/combo/ComboAction.module.css';
import { ref, watch } from 'vue';
import { useAppI18n } from '@/composables/useAppI18n';
import { useScrollChromeScrim } from '@/scenes/tasks/shared/useScrollChromeScrim';
import { formatGroupedNumber } from '@/utils/formatGroupedDisplay';
import type { BatchCurrencyGroup } from './types';
import {
  BATCH_CURRENCY_PICKER_MAX_HEIGHT,
  BATCH_CURRENCY_PICKER_WIDTH,
} from './batchSigning.constants';
import styles from './batchSigning.shared.module.css';
import '@/styles/flotation-inner-backdrop.css';
import './batchSigning.networkPickerMenu.css';

const props = defineProps<{
  groups: BatchCurrencyGroup[];
}>();

const pickerShellStyle = {
  width: `${BATCH_CURRENCY_PICKER_WIDTH}px`,
  minWidth: `${BATCH_CURRENCY_PICKER_WIDTH}px`,
  height: `${BATCH_CURRENCY_PICKER_MAX_HEIGHT}px`,
  maxHeight: `${BATCH_CURRENCY_PICKER_MAX_HEIGHT}px`,
} as const;

const emit = defineEmits<{
  process: [group: BatchCurrencyGroup];
}>();

const { ui } = useAppI18n();

const scrollRef = ref<HTMLElement | null>(null);
const rowsRef = ref<HTMLElement | null>(null);

const { topScrim, bottomScrim, update } = useScrollChromeScrim(scrollRef, {
  contentRef: rowsRef,
});

watch(
  () => props.groups.length,
  () => {
    update();
  },
);

function onProcess(group: BatchCurrencyGroup) {
  emit('process', group);
}
</script>

<template>
  <div
    class="networkPickerRoot desktopTokens effect-flotation-box motion-flotation eds-flotation-inner-backdrop"
    :style="pickerShellStyle"
  >
    <div class="networkPickerRows">
      <header class="networkPickerHeader">
        <div class="networkPickerHeaderContent">
          <p :class="styles.batchSectionTitle">{{ ui('Batch Process') }}</p>
        </div>
      </header>

      <EgDivider
        v-if="topScrim"
        type="module"
        direction="horizontal"
        :class="[
          comboActionStyles.divider,
          comboActionStyles.dividerAnimated,
          'networkPickerHeaderDivider',
        ]"
      />

      <div
        ref="scrollRef"
        class="networkPickerListScroll"
        :class="{ networkPickerListScrollFadeBottom: bottomScrim }"
      >
        <div ref="rowsRef" class="networkPickerList">
          <div
            v-for="group in groups"
            :key="group.currencyKey"
            class="networkPickerRowWrap"
          >
            <div
              :class="styles.networkRow"
              role="button"
              tabindex="0"
              @click="onProcess(group)"
              @keydown.enter.prevent="onProcess(group)"
              @keydown.space.prevent="onProcess(group)"
            >
              <span :class="styles.networkIcon">
                <EgCrypto :name="group.cryptoName as CryptoName" fit />
              </span>
              <div :class="styles.networkMeta">
                <div :class="styles.networkTitleRow">
                  <span :class="styles.networkTitle">{{ group.symbol }}</span>
                  <span
                    v-if="group.showNetwork && group.networkLabel"
                    :class="styles.networkTag"
                  >
                    <EgTag
                      family="system"
                      system-type="stroke-subtle"
                      size="sm"
                    >
                      {{ group.networkLabel }}
                    </EgTag>
                  </span>
                </div>
                <span :class="styles.networkSubtitle">
                  <span :class="styles.networkSubtitleCount">
                    {{ formatGroupedNumber(group.count) }}
                  </span>{{ ui('pending signatures suffix') }}
                </span>
              </div>
              <EgButton
                tone="decor"
                variant="solid"
                size="md"
                @click.stop="onProcess(group)"
              >
                {{ ui('Process') }}
              </EgButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
