<script setup lang="ts">
import { EgAnchoredPopover, EgButton, POPOVER_PRESET_WIDTH_BASE } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './SigningBatchStopConfirmPopover.module.css';

const emit = defineEmits<{
  confirm: [];
}>();

const { ui } = useAppI18n();

function onConfirm(close: () => void) {
  emit('confirm');
  close();
}
</script>

<template>
  <EgAnchoredPopover
    boundary-selector=".eds-popup"
    teleport-to=".app-preview"
    placement="top"
    width-mode="fixed"
    :width="POPOVER_PRESET_WIDTH_BASE"
    :top-tool-title="ui('Stop signing')"
    top-tool
    top-tool-closable
  >
    <template #trigger="triggerSlot">
      <slot name="trigger" v-bind="triggerSlot" />
    </template>
    <template #default="{ close }">
      <div :class="styles.panel" data-stop-sign-confirm-popover>
        <p :class="styles.message">
          {{
            ui(
              'After stopping, transactions that have not completed signing will not continue. Completed signatures are not affected. Stop the current batch signing task?',
            )
          }}
        </p>
        <div :class="styles.actions">
          <EgButton
            tone="decor"
            variant="solid"
            size="md"
            @click="onConfirm(close)"
          >
            {{ ui('Confirm') }}
          </EgButton>
        </div>
      </div>
    </template>
  </EgAnchoredPopover>
</template>
