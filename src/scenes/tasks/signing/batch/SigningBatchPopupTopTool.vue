<script setup lang="ts">
import { computed } from 'vue';
import { EgDivider, EgIcon, EgIconButton } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import styles from './SigningBatchPopupTopTool.module.css';

defineProps<{
  title: string;
}>();

const emit = defineEmits<{
  back: [];
}>();

const { ui } = useAppI18n();
</script>

<template>
  <div :class="styles.shell">
    <div :class="styles.root">
      <div :class="styles.leading">
        <EgIconButton size="md" :label="ui('Back')" @click="emit('back')">
          <EgIcon name="eds-arrow-left-ios" fit />
        </EgIconButton>
        <span :class="styles.title">{{ title }}</span>
      </div>
      <div v-if="$slots.actions" :class="styles.trailing">
        <slot name="actions" />
      </div>
    </div>
    <EgDivider type="module" direction="horizontal" :class="styles.divider" />
  </div>
</template>
