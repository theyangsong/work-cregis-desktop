<script setup lang="ts">
import { computed, toRef, withDefaults } from 'vue';
import { EgButton, EgPopup } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import { usePopupShellLifecycle } from '../shared/usePopupShellLifecycle';
import ApprovalRemarkPopover from '../approval/ApprovalRemarkPopover.vue';
import remarkTriggerStyles from '../shared/remarkPopoverTrigger.module.css';
import {
  resolveMinerFeeProfileFromDetail,
} from '../shared/minerFeeProfile';
import type { MinerFeeSelection } from '../shared/minerFeeProfile';
import { buildMultiSignWaitingPanelModel } from './buildMultiSignWaitingPanelModel';
import MultiSignWaitingPanel from './MultiSignWaitingPanel.vue';
import {
  MULTI_SIGN_WAITING_POPUP_HEIGHT,
  MULTI_SIGN_WAITING_POPUP_WIDTH,
} from './multiSignWaiting.constants';
import type { MultiSignRoomPhase, MultiSignWaitingPerspective, SigningDetail } from './types';

const props = withDefaults(
  defineProps<{
    open: boolean;
    detail: SigningDetail | null;
    phase: MultiSignRoomPhase;
    perspective?: MultiSignWaitingPerspective;
    joinedCount: number;
    remark: string;
    minerFeeDisplay?: string | null;
    dismissWithoutAnimation?: boolean;
  }>(),
  {
    perspective: 'signer',
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:remark': [value: string];
  close: [];
  readyConfirm: [selection: MinerFeeSelection | null];
}>();

const { ui } = useAppI18n();

const { popupMounted, popupOpen, onPopupClosed } = usePopupShellLifecycle({
  open: toRef(props, 'open'),
  dismissWithoutAnimation: toRef(props, 'dismissWithoutAnimation'),
  onClosed: () => {
    emit('update:open', false);
    emit('close');
  },
});

const minerFeeProfile = computed(() =>
  props.detail ? resolveMinerFeeProfileFromDetail(props.detail) : null,
);

const panelModel = computed(() =>
  props.detail
    ? buildMultiSignWaitingPanelModel(props.detail, props.joinedCount, ui)
    : null,
);

const isSignerPerspective = computed(() => props.perspective === 'signer');

const isSignEnabled = computed(
  () => isSignerPerspective.value && props.phase === 'ready',
);

const guardedPopupOpen = computed({
  get: () => popupOpen.value,
  set: (value: boolean) => {
    if (value) {
      popupOpen.value = true;
    }
  },
});

function onClose() {
  popupOpen.value = false;
}

function onReadyConfirm(selection: MinerFeeSelection | null) {
  emit('readyConfirm', selection);
}

function onRemarkDismiss() {
  emit('update:remark', '');
}
</script>

<template>
  <EgPopup
    v-if="popupMounted"
    v-model:open="guardedPopupOpen"
    uses="custom"
    :box-width="MULTI_SIGN_WAITING_POPUP_WIDTH"
    :box-height="MULTI_SIGN_WAITING_POPUP_HEIGHT"
    @close="onPopupClosed"
  >
    <MultiSignWaitingPanel
      v-if="detail && panelModel"
      :model="panelModel"
      :phase="phase"
      :perspective="perspective"
      @close="onClose"
    >
      <template v-if="isSignerPerspective" #actions>
        <ApprovalRemarkPopover
          v-if="isSignEnabled && minerFeeProfile"
          skip-remark-step
          boundary-selector=".app-preview"
          :title="ui('Miner Fee')"
          :remark="remark"
          :miner-fee-profile="minerFeeProfile"
          require-miner-fee
          @update:remark="emit('update:remark', $event)"
          @confirm="onReadyConfirm"
          @dismiss="onRemarkDismiss"
        >
          <template #trigger="{ active, onClick }">
            <span
              :class="[
                remarkTriggerStyles.remarkTrigger,
                active && remarkTriggerStyles.remarkTriggerPassPressed,
              ]"
            >
              <EgButton
                tone="decor"
                variant="solid"
                size="md"
                :aria-expanded="active"
                @click.stop="onClick"
              >
                {{ ui('Sign') }}
              </EgButton>
            </span>
          </template>
        </ApprovalRemarkPopover>
        <EgButton
          v-else
          tone="decor"
          variant="solid"
          size="md"
          :disabled="!isSignEnabled"
          @click="isSignEnabled ? onReadyConfirm(null) : undefined"
        >
          {{ ui('Sign') }}
        </EgButton>
      </template>
    </MultiSignWaitingPanel>
  </EgPopup>
</template>
