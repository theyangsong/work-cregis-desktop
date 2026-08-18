<script setup lang="ts">
import { ref } from 'vue';
import {
  EgAnchoredTooltip,
  EgButton,
  EgIcon,
  EgIconButton,
  EgPopover,
  closeAllAnchoredTooltips,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { MULTI_SIGN_WAITING_EXIT_CONFIRM_POPOVER_WIDTH } from './multiSignWaiting.constants';
import styles from './signingConfirmPopover.shared.module.css';

const emit = defineEmits<{
  confirm: [];
}>();

const { ui } = useAppI18n();

const anchorRef = ref<{ close?: () => void; openPanel?: () => void } | null>(null);
const expanded = ref(false);

function closePopover() {
  anchorRef.value?.close?.();
}

function onTriggerClick() {
  if (expanded.value) return;
  closeAllAnchoredTooltips();
  anchorRef.value?.openPanel?.();
}

function onAnchoredClose() {
  expanded.value = false;
}

function onConfirm() {
  emit('confirm');
  closePopover();
}
</script>

<template>
  <EgAnchoredTooltip
    ref="anchorRef"
    placement="bottom"
    align="center"
    trigger="click"
    :wrap-tooltip="false"
    :click-toggle="false"
    boundary-selector=".eds-popup"
    teleport-to=".app-preview"
    token-scope-class="desktopTokens"
    @open="expanded = true"
    @close="onAnchoredClose"
  >
    <slot
      name="trigger"
      :active="expanded"
      :on-click="onTriggerClick"
    />
    <template #content>
      <EgPopover
        placement="bottom"
        align="center"
        width-mode="fixed"
        :width="MULTI_SIGN_WAITING_EXIT_CONFIRM_POPOVER_WIDTH"
        height-mode="adaptive"
      >
        <div :class="styles.panel" data-multi-sign-exit-confirm-popover>
          <div :class="styles.topTool">
            <p :class="styles.topToolTitle">
              {{ ui('Warm reminder') }}
            </p>
            <div :class="styles.topToolClose">
              <EgIconButton
                shape="square"
                size="sm"
                :label="ui('Close')"
                motion="ease"
                @click="closePopover"
              >
                <EgIcon name="eds-close-circle-fill" fit />
              </EgIconButton>
            </div>
          </div>
          <p :class="styles.message">
            {{
              ui(
                'After exiting, this signing will fail. Are you sure you want to exit?',
              )
            }}
          </p>
          <div :class="styles.actions">
            <EgButton
              tone="danger"
              variant="solid"
              size="md"
              @click="onConfirm"
            >
              {{ ui('Confirm') }}
            </EgButton>
          </div>
        </div>
      </EgPopover>
    </template>
  </EgAnchoredTooltip>
</template>
