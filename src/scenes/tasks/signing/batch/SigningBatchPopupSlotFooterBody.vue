<script setup lang="ts">
import { useSlots } from 'vue';
import { EgButton, EgDivider, type ButtonTone, type ButtonVariant } from '@eds/desktop-components';
import comboActionStyles from '@eds/desktop-components/molecules/combo/ComboAction.module.css';
import styles from './SigningBatchPopupSlotChrome.module.css';

defineProps<{
  showToolbarDivider: boolean;
  showPaginerRow: boolean;
  showToolbarRow: boolean;
  showToolbarCancel: boolean;
  showToolbarConfirm: boolean;
  toolbarConfirmDisabled: boolean;
  toolbarCancelLabel: string;
  toolbarConfirmLabel: string;
  toolbarCancelTone: ButtonTone;
  toolbarCancelVariant: ButtonVariant;
  toolbarConfirmTone: ButtonTone;
}>();

const emit = defineEmits<{
  'toolbar-cancel': [];
  'toolbar-confirm': [];
}>();

const slots = useSlots();
</script>

<template>
  <EgDivider
    v-if="showToolbarDivider"
    :class="[
      comboActionStyles.divider,
      comboActionStyles.dividerAnimated,
    ]"
    type="module"
    direction="horizontal"
  />
  <div
    v-if="showPaginerRow"
    :class="styles.toolbarPaginerRow"
  >
    <div :class="styles.toolbarPaginerHost">
      <slot name="footer" />
    </div>
    <div v-if="slots['footer-actions']" :class="styles.toolbarPaginerActions">
      <slot name="footer-actions" />
    </div>
  </div>
  <div
    v-else-if="showToolbarRow"
    :class="styles.toolbarBar"
  >
    <EgButton
      v-if="showToolbarCancel"
      :tone="toolbarCancelTone"
      :variant="toolbarCancelVariant"
      size="md"
      @click="emit('toolbar-cancel')"
    >
      {{ toolbarCancelLabel }}
    </EgButton>
    <EgButton
      v-if="showToolbarConfirm"
      :tone="toolbarConfirmTone"
      variant="solid"
      size="md"
      :disabled="toolbarConfirmDisabled"
      @click="emit('toolbar-confirm')"
    >
      {{ toolbarConfirmLabel }}
    </EgButton>
  </div>
</template>
