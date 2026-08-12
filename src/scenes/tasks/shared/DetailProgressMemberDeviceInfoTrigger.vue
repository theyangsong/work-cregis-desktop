<script setup lang="ts">
import { ref } from 'vue';
import { EgAnchoredTooltip, EgIcon, EgIconButton } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import type { DetailProgressMemberDeviceInfo } from './detailProgressMemberDeviceInfo.types';
import styles from './DetailProgressMemberDeviceInfoTrigger.module.css';

const props = defineProps<{
  deviceInfo: DetailProgressMemberDeviceInfo;
}>();

const { ui } = useAppI18n();

const rows = [
  { key: 'device-type', labelKey: 'Device Type', valueKey: 'deviceType' as const },
  { key: 'device-id', labelKey: 'Device ID', valueKey: 'deviceId' as const },
  { key: 'ip', labelKey: 'IP', valueKey: 'ip' as const },
];

const copiedRowKey = ref<string | null>(null);
let copiedResetTimer: ReturnType<typeof setTimeout> | undefined;

async function onCopyRow(
  rowKey: string,
  value: string,
  event?: MouseEvent,
) {
  event?.stopPropagation();
  event?.preventDefault();
  try {
    await navigator.clipboard.writeText(value);
    copiedRowKey.value = rowKey;
    if (copiedResetTimer) clearTimeout(copiedResetTimer);
    copiedResetTimer = setTimeout(() => {
      if (copiedRowKey.value === rowKey) copiedRowKey.value = null;
    }, 2000);
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <EgAnchoredTooltip
    :class="styles.deviceInfoTooltip"
    trigger="hover"
    placement="bottom"
    align="start"
    boundary-selector=".eds-popup"
    close-on-scroll
    width-mode="adaptive"
    height-mode="adaptive"
    :open-delay="120"
    :close-delay="80"
  >
    <EgIconButton
      shape="square"
      size="xs"
      :class="styles.infoButton"
      :label="ui('Device information')"
      @click.stop
    >
      <EgIcon :class="styles.iconOutline" name="eds-information" fit />
      <EgIcon :class="styles.iconFill" name="eds-information-fill" fit />
    </EgIconButton>

    <template #content>
      <div :class="styles.rows">
        <div
          v-for="row in rows"
          :key="row.key"
          :class="styles.row"
          role="button"
          tabindex="0"
          @click="onCopyRow(row.key, deviceInfo[row.valueKey], $event)"
          @keydown.enter.prevent="onCopyRow(row.key, deviceInfo[row.valueKey])"
          @keydown.space.prevent="onCopyRow(row.key, deviceInfo[row.valueKey])"
        >
          <span :class="styles.label">{{ ui(row.labelKey) }}</span>
          <span :class="styles.valueCluster">
            <span :class="styles.value">{{ deviceInfo[row.valueKey] }}</span>
            <span
              :class="[
                styles.copyButton,
                copiedRowKey === row.key && styles.copyButtonCopied,
              ]"
              @click.stop
            >
              <EgIconButton
                shape="square"
                size="xs"
                label="复制"
                @click="onCopyRow(row.key, deviceInfo[row.valueKey], $event)"
              >
                <EgIcon
                  :name="copiedRowKey === row.key ? 'eds-enable-fill' : 'eds-copy'"
                  fit
                />
              </EgIconButton>
            </span>
          </span>
        </div>
      </div>
    </template>
  </EgAnchoredTooltip>
</template>
