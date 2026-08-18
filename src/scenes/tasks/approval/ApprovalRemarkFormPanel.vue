<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import {
  EgButton,
  EgComboTextareaItem,
  EgFormSubmission,
  EgTextarea,
  REMARK_POPOVER_MAX_LENGTH,
  type ButtonTone,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './ApprovalRemarkFormPanel.module.css';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    maxLength?: number;
    label?: string;
    placeholder?: string;
    feedbackText?: string;
    hideLabel?: boolean;
    hideConfirm?: boolean;
    confirmLabel?: string;
    confirmTone?: ButtonTone;
    autofocus?: boolean;
    resetOnMount?: boolean;
  }>(),
  {
    modelValue: '',
    maxLength: REMARK_POPOVER_MAX_LENGTH,
    label: 'Remark',
    placeholder: 'Please Enter',
    feedbackText: 'Optional, up to 256 characters.',
    hideLabel: true,
    hideConfirm: false,
    confirmLabel: 'Confirm',
    confirmTone: 'decor',
    autofocus: true,
    resetOnMount: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  confirm: [];
}>();

const { ui } = useAppI18n();
const remarkFieldRef = ref<HTMLElement | null>(null);

const remarkModel = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value.slice(0, props.maxLength)),
});

function getRemarkControlElement() {
  return remarkFieldRef.value?.querySelector('input, textarea') as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;
}

async function focusRemarkInput() {
  await nextTick();
  getRemarkControlElement()?.focus();

  window.requestAnimationFrame(() => {
    getRemarkControlElement()?.focus();
  });

  window.setTimeout(() => {
    getRemarkControlElement()?.focus();
  }, 120);
}

function resetRemark() {
  emit('update:modelValue', '');
}

onMounted(async () => {
  if (props.resetOnMount) {
    resetRemark();
  }
  if (props.autofocus) {
    await focusRemarkInput();
  }
});

function onConfirm() {
  emit('confirm');
}

defineExpose({
  focusRemarkInput,
  resetRemark,
});
</script>

<template>
  <div :class="styles.root">
    <div
      ref="remarkFieldRef"
      :class="[
        styles.remarkField,
        hideLabel && styles.remarkFieldHideLabel,
      ]"
    >
      <EgComboTextareaItem
        v-model="remarkModel"
        feedback
        :label="ui(label)"
        :placeholder="ui(placeholder)"
      >
        <EgTextarea
          v-model="remarkModel"
          :placeholder="ui(placeholder)"
          width-mode="full"
          :paste-label="ui('Paste')"
          :clear-label="ui('Clear')"
        />
        <template #feedback>
          <EgFormSubmission
            type="notes"
            :text="ui(feedbackText)"
            :show-link="false"
          />
        </template>
      </EgComboTextareaItem>
    </div>

    <EgButton
      v-if="!hideConfirm"
      :class="styles.confirm"
      :tone="confirmTone"
      variant="solid"
      size="md"
      @click="onConfirm"
    >
      {{ ui(confirmLabel) }}
    </EgButton>
  </div>
</template>
