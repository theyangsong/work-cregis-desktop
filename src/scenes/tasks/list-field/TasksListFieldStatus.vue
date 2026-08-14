<script setup lang="ts">
import { computed } from 'vue';
import { EgTag, type TagStatus } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './TasksListFieldStatus.module.css';

const props = defineProps<{
  customize: Record<string, unknown>;
  alignEnd?: boolean;
}>();

function parsePreviewMinWidth(customize: Record<string, unknown>): number | undefined {
  const raw = String(customize.minWidth ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return parsed > 0 ? parsed : undefined;
}

const statusWidthConfigured = computed(() => parsePreviewMinWidth(props.customize) != null);

const cellMinWidthStyle = computed(() => {
  if (!statusWidthConfigured.value) return undefined;
  return { width: '100%', maxWidth: '100%', minWidth: '0' };
});

const tagStatus = computed(() => String(props.customize.status ?? 'success') as TagStatus);
const { ui } = useAppI18n();
const tagLabel = computed(() => ui(String(props.customize.label ?? 'Success')));
const tagTruncate = computed(() => Boolean(props.customize.truncate));
const alignEnd = computed(() => Boolean(props.alignEnd));
</script>

<template>
  <div
    class="list-field-status"
    :class="[styles.statusPreview, alignEnd && styles.statusPreviewAlignEnd]"
    :style="cellMinWidthStyle"
  >
    <EgTag family="status" :status="tagStatus" size="lg" :truncate="tagTruncate">
      {{ tagLabel }}
    </EgTag>
  </div>
</template>
