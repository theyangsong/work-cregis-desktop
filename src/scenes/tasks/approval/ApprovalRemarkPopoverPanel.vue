<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import {
  EgButton,
  EgComboTextareaItem,
  EgFormSubmission,
  EgRadio,
  EgTextarea,
} from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './ApprovalRemarkPopoverPanel.module.css';

const REMARK_MAX_LENGTH = 256;

const MINER_FEE_OPTIONS = [
  { id: 'slow', labelKey: 'Miner fee option slow' },
  { id: 'normal', labelKey: 'Miner fee option normal' },
  { id: 'fast', labelKey: 'Miner fee option fast' },
  { id: 'custom', labelKey: 'Custom' },
] as const;

type MinerFeeOptionId = (typeof MINER_FEE_OPTIONS)[number]['id'];

const props = defineProps<{
  selectedCount: number;
  remark: string;
  showMinerFee?: boolean;
}>();

const emit = defineEmits<{
  'update:remark': [value: string];
  confirm: [];
  cancel: [];
}>();

const { ui } = useAppI18n();

const fieldRef = ref<HTMLElement | null>(null);
const minerFee = ref<MinerFeeOptionId>('normal');

const remarkModel = computed({
  get: () => props.remark,
  set: (value: string) => emit('update:remark', value.slice(0, REMARK_MAX_LENGTH)),
});

onMounted(async () => {
  emit('update:remark', '');
  if (!props.showMinerFee) {
    await focusRemarkTextarea();
  }
});

function getTextareaElement() {
  return fieldRef.value?.querySelector('textarea') ?? null;
}

async function focusRemarkTextarea() {
  await nextTick();
  getTextareaElement()?.focus();

  window.requestAnimationFrame(() => {
    getTextareaElement()?.focus();
  });

  window.setTimeout(() => {
    getTextareaElement()?.focus();
  }, 120);
}

async function pasteFromClipboard() {
  const textarea = getTextareaElement();
  if (!textarea) return;

  try {
    const text = await navigator.clipboard.readText();
    if (!text) {
      textarea.focus();
      return;
    }

    const current = props.remark;
    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? current.length;
    const merged = current.slice(0, start) + text + current.slice(end);
    const next = merged.slice(0, REMARK_MAX_LENGTH);
    emit('update:remark', next);

    await nextTick();
    const cursor = Math.min(start + text.length, next.length);
    textarea.setSelectionRange(cursor, cursor);
    textarea.focus();
  } catch {
    textarea.focus();
  }
}

function onFieldCaptureClick(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest('a.eds-link');
  if (link?.textContent?.trim() !== 'Paste') return;

  event.preventDefault();
  event.stopPropagation();
  void pasteFromClipboard();
}

function onClear() {
  emit('update:remark', '');
  void nextTick(() => getTextareaElement()?.focus());
}
</script>

<template>
  <div :class="styles.root">
    <section v-if="showMinerFee" :class="styles.minerFee">
      <p :class="styles.sectionLabel">{{ ui('Miner Fee') }}</p>
      <div role="radiogroup" :class="styles.minerFeeOptions" :aria-label="ui('Miner Fee')">
        <div
          v-for="option in MINER_FEE_OPTIONS"
          :key="option.id"
          role="radio"
          :aria-checked="minerFee === option.id"
          :class="styles.minerFeeOption"
          tabindex="0"
          @click="minerFee = option.id"
          @keydown.enter.prevent="minerFee = option.id"
          @keydown.space.prevent="minerFee = option.id"
        >
          <EgRadio
            :model-value="minerFee === option.id"
            @update:model-value="() => { minerFee = option.id; }"
          />
          <span :class="styles.minerFeeOptionLabel">{{ ui(option.labelKey) }}</span>
        </div>
      </div>
    </section>

    <EgComboTextareaItem
      feedback
      :label="showMinerFee ? ui('Remark') : ''"
      :class="[styles.field, showMinerFee && styles.fieldWithSectionLabel]"
      :placeholder="ui('Please enter remark')"
    >
      <div ref="fieldRef" @click.capture="onFieldCaptureClick">
        <EgTextarea
          v-model="remarkModel"
          width-mode="full"
          :placeholder="ui('Please enter remark')"
          @clear="onClear"
        />
      </div>
      <template #feedback>
        <EgFormSubmission
          type="notes"
          :text="ui('Optional, Max. 256 characters')"
          :show-link="false"
        />
      </template>
    </EgComboTextareaItem>
    <EgButton
      :class="styles.confirm"
      tone="decor"
      variant="solid"
      size="md"
      @click="emit('confirm')"
    >
      {{ ui('Confirm') }}
    </EgButton>
  </div>
</template>
