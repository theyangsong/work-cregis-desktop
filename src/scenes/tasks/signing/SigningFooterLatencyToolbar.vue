<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  EgDivider,
  EgFlotation,
  EgFlotationMenu,
  EgFlotationMenuItem,
  EgFlotationTrigger,
} from '@eds/desktop-components';
import comboActionStyles from '@eds/desktop-components/molecules/combo/ComboAction.module.css';
import chromeScrimStyles from '@eds/desktop-components/styles/popupChromeScrim.module.css';
import {
  SIGNING_FOOTER_LATENCY_MENU_TITLE,
  signingFooterLatencyNetworkItems,
} from './signingFooterLatencyMenu';
import { formatGroupedLatencyLabel } from '@/utils/formatGroupedDisplay';
import './signingFooterLatencyMenu.css';
import styles from './SigningCustomPopupPanel.module.css';

const props = withDefaults(
  defineProps<{
    scrollOverflows?: boolean;
    showActions?: boolean;
    defaultLatencyIndex?: number;
    /** true：module 分割线常驻（对齐 PopupCustomSlotChrome / 批处理确认弹窗）。 */
    toolbarDividerPinned?: boolean;
  }>(),
  {
    scrollOverflows: false,
    showActions: false,
    defaultLatencyIndex: 0,
    toolbarDividerPinned: true,
  },
);

const showToolbarDivider = computed(
  () => props.scrollOverflows || props.toolbarDividerPinned,
);

const selectedLatencyIndex = ref(props.defaultLatencyIndex);

const selectedLatencyNetwork = computed(
  () =>
    signingFooterLatencyNetworkItems[selectedLatencyIndex.value]
    ?? signingFooterLatencyNetworkItems[0]!,
);

function displayLatencyStatus(label: string): string {
  return formatGroupedLatencyLabel(label);
}

function selectLatencyNetwork(index: number, close: () => void) {
  selectedLatencyIndex.value = index;
  close();
}
</script>

<template>
  <footer
    :class="[
      styles.toolbar,
      !scrollOverflows && styles.toolbarSolid,
      chromeScrimStyles.root,
      scrollOverflows && chromeScrimStyles.active,
    ]"
  >
    <div :class="chromeScrimStyles.content">
      <div :class="styles.toolbarPage">
        <EgDivider
          :class="[
            comboActionStyles.divider,
            comboActionStyles.dividerAnimated,
            !showToolbarDivider && comboActionStyles.dividerAnimatedHidden,
          ]"
          type="module"
          direction="horizontal"
          :hide="!showToolbarDivider"
        />
        <div :class="styles.toolbarBar">
          <div :class="styles.toolbarStart">
            <EgFlotation
              :class="styles.latencyFlotation"
              :style="{ '--latency-status-color': selectedLatencyNetwork.statusColor }"
              placement="top"
              trigger-style="text"
              trigger-size="md"
              :show-add="false"
              boundary-selector=".app-preview"
              flip
              close-on-scroll
            >
              <template #trigger="{ expanded }">
                <EgFlotationTrigger
                  trigger-style="text"
                  size="md"
                  label=""
                  show-symbol
                  symbol-icon="eds-wifi-fill"
                  :expanded="expanded"
                >
                  <template #message>
                    <span :class="styles.latencyText">
                      {{ displayLatencyStatus(selectedLatencyNetwork.statusLabel) }}
                    </span>
                  </template>
                </EgFlotationTrigger>
              </template>
              <template #content="{ close }">
                <EgFlotationMenu
                  class="signing-footer-latency-menu"
                  list-scroll
                  :show-add="false"
                  :show-divider="false"
                  width-mode="fixed"
                  :width="280"
                  height-mode="adaptive"
                >
                  <template #header>
                    <p :class="styles.latencyMenuTitle">
                      {{ SIGNING_FOOTER_LATENCY_MENU_TITLE }}
                    </p>
                  </template>
                  <EgFlotationMenuItem
                    v-for="(network, index) in signingFooterLatencyNetworkItems"
                    :key="network.key"
                    box-type="text"
                    :label="network.label"
                    :focused="selectedLatencyIndex === index"
                    :show-tag="false"
                    @click="selectLatencyNetwork(index, close)"
                  >
                    <template #message>
                      <span
                        :class="styles.latencyMenuStatus"
                        :style="{ color: network.statusColor }"
                      >
                        {{ displayLatencyStatus(network.statusLabel) }}
                      </span>
                    </template>
                  </EgFlotationMenuItem>
                </EgFlotationMenu>
              </template>
            </EgFlotation>
          </div>

          <div
            v-if="showActions"
            :class="[styles.toolbarActions, styles.toolbarActionsRight]"
          >
            <slot name="actions" />
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
