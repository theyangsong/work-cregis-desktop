<script setup lang="ts">
import { ref } from 'vue';
import {
  EgAnchoredTooltip,
  EgButton,
  EgPopover,
  POPOVER_PRESET_WIDTH_BASE,
  closeAllAnchoredTooltips,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import sharedStyles from '../signingConfirmPopover.shared.module.css';
import styles from './SigningBatchStopConfirmPopover.module.css';

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
    placement="top"
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
        placement="top"
        align="center"
        width-mode="fixed"
        :width="POPOVER_PRESET_WIDTH_BASE"
        height-mode="adaptive"
        top-tool
        :top-tool-title="ui('Stop Signing')"
        top-tool-closable
        @top-tool-close="closePopover"
      >
        <div :class="styles.panel" data-stop-sign-confirm-popover>
          <p :class="sharedStyles.message">
            {{
              ui(
                'After stopping, transactions that have not completed signing will not continue. Completed signatures are not affected. Stop the current batch signing task?',
              )
            }}
          </p>
          <div :class="sharedStyles.actions">
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
