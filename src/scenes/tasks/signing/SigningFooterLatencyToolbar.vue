<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  EgDivider,
  EgFlotation,
  EgFlotationMenu,
  EgFlotationMenuItem,
  EgFlotationTrigger,
  EgIcon,
} from '@eds/desktop-components';
import comboActionStyles from '@eds/desktop-components/molecules/combo/ComboAction.module.css';
import chromeScrimStyles from '@eds/desktop-components/styles/popupChromeScrim.module.css';
import {
  SIGNING_FOOTER_LATENCY_MENU_TITLE,
  signingFooterLatencyNetworkItems,
} from './signingFooterLatencyMenu';
import { formatGroupedLatencyLabel } from '@/utils/formatGroupedDisplay';
import { useAppI18n } from '@/composables/useAppI18n';
import './signingFooterLatencyMenu.css';
import MultiSignParticipantMpcGuideAnchored from './MultiSignParticipantMpcGuideAnchored.vue';
import styles from './SigningCustomPopupPanel.module.css';

const props = withDefaults(
  defineProps<{
    scrollOverflows?: boolean;
    showActions?: boolean;
    /** true：可展开 MPC 网络菜单并切换；false：仅展示延迟文本。 */
    networkPicker?: boolean;
    /** 参与人签名失败：在 flotation trigger 上方展示 MPC 切换引导 Popover。 */
    mpcNetworkGuideActive?: boolean;
    defaultLatencyIndex?: number;
    /** 只读展示时覆盖延迟文案（如 `122ms`）。 */
    latencyLabel?: string;
    /** 只读展示时覆盖状态色（如 `var(--status-success)`）。 */
    latencyColor?: string;
    /** true：module 分割线常驻（对齐 PopupCustomSlotChrome / 批处理确认弹窗）。 */
    toolbarDividerPinned?: boolean;
    /** 656×480 签名进度/广播弹窗底栏间距；不影响多人等待页。 */
    toolbarBarPreset?: 'default' | 'customPopup';
  }>(),
  {
    scrollOverflows: false,
    showActions: false,
    networkPicker: false,
    mpcNetworkGuideActive: false,
    defaultLatencyIndex: 0,
    toolbarDividerPinned: true,
    toolbarBarPreset: 'default',
  },
);

const { ui } = useAppI18n();

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
  if (/^\d/.test(label.trim()) || /ms$/i.test(label.trim())) {
    return formatGroupedLatencyLabel(label);
  }
  return ui(label);
}

const displayLatencyText = computed(() => {
  const label = props.latencyLabel ?? selectedLatencyNetwork.value.statusLabel;
  return displayLatencyStatus(label);
});

const displayLatencyColor = computed(
  () => props.latencyColor ?? selectedLatencyNetwork.value.statusColor,
);

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
        <div
          :class="[
            styles.toolbarBar,
            toolbarBarPreset === 'customPopup' && styles.toolbarBarCustomPopup,
          ]"
        >
          <div :class="styles.toolbarStart">
            <span
              v-if="!networkPicker"
              :class="[
                styles.latencyDisplay,
                toolbarBarPreset === 'customPopup' && styles.latencyDisplayCustomPopup,
              ]"
              :style="{ '--latency-status-color': displayLatencyColor }"
            >
              <EgIcon
                :class="styles.latencyIcon"
                name="eds-wifi-fill"
                size="md"
              />
              <span :class="styles.latencyText">
                {{ displayLatencyText }}
              </span>
            </span>

            <MultiSignParticipantMpcGuideAnchored
              v-else-if="mpcNetworkGuideActive"
              :active="mpcNetworkGuideActive"
            >
              <template #default="{ guideOpen, dismissGuide }">
                <EgFlotation
                  :class="[
                    styles.latencyFlotationPicker,
                    toolbarBarPreset === 'customPopup' && styles.latencyFlotationPickerCustomPopup,
                  ]"
                  :style="{ '--latency-status-color': selectedLatencyNetwork.statusColor }"
                  placement="top"
                  trigger-style="text"
                  trigger-size="md"
                  :show-add="false"
                  boundary-selector=".app-preview"
                  flip
                  close-on-scroll
                  @open="dismissGuide"
                >
                  <template #trigger="{ expanded }">
                    <EgFlotationTrigger
                      trigger-style="text"
                      size="md"
                      label=""
                      show-symbol
                      symbol-icon="eds-wifi-fill"
                      :expanded="expanded || guideOpen"
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
                          {{ ui(SIGNING_FOOTER_LATENCY_MENU_TITLE) }}
                        </p>
                      </template>
                      <EgFlotationMenuItem
                        v-for="(network, index) in signingFooterLatencyNetworkItems"
                        :key="network.key"
                        box-type="text"
                        :label="ui(network.label)"
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
              </template>
            </MultiSignParticipantMpcGuideAnchored>

            <EgFlotation
              v-else
              :class="[
                styles.latencyFlotationPicker,
                toolbarBarPreset === 'customPopup' && styles.latencyFlotationPickerCustomPopup,
              ]"
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
                      {{ ui(SIGNING_FOOTER_LATENCY_MENU_TITLE) }}
                    </p>
                  </template>
                  <EgFlotationMenuItem
                    v-for="(network, index) in signingFooterLatencyNetworkItems"
                    :key="network.key"
                    box-type="text"
                    :label="ui(network.label)"
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
