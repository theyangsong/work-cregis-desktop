<script setup lang="ts">
import { EgDivider } from '@eds/desktop-components';
import comboActionStyles from '@eds/desktop-components/molecules/combo/ComboAction.module.css';
import { ref, watch } from 'vue';
import { useAppI18n } from '@/composables/useAppI18n';
import { useScrollChromeScrim } from '@/scenes/tasks/shared/useScrollChromeScrim';
import MultiSignInvitationCard from './MultiSignInvitationCard.vue';
import type { MultiSignInvitation } from './types';
import './multiSignInvitationPanel.css';

const props = defineProps<{
  invitations: MultiSignInvitation[];
}>();

const emit = defineEmits<{
  join: [id: string];
  close: [];
}>();

const { ui } = useAppI18n();

const scrollRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

const { topScrim, bottomScrim, update } = useScrollChromeScrim(scrollRef, {
  contentRef,
});

watch(
  () => props.invitations.length,
  () => {
    update();
  },
);
</script>

<template>
  <div
    class="multiSignInvitationFlotationRoot desktopTokens multi-sign-invitation-panel-root"
  >
    <div class="multiSignInvitationFlotationRows">
      <header class="multiSignInvitationPanelHeader">
        <h3 class="multiSignInvitationPanelTitle">
          {{ ui('Pending') }}
        </h3>
      </header>

      <EgDivider
        v-if="topScrim"
        type="module"
        direction="horizontal"
        :class="[
          comboActionStyles.divider,
          comboActionStyles.dividerAnimated,
          'multiSignInvitationPanelHeaderDivider',
        ]"
      />

      <div
        ref="scrollRef"
        class="multiSignInvitationPanelListScroll"
        :class="{ multiSignInvitationPanelListScrollFadeBottom: bottomScrim }"
      >
        <div ref="contentRef" class="multiSignInvitationPanelList">
          <MultiSignInvitationCard
            v-for="invitation in invitations"
            :key="invitation.id"
            :invitation="invitation"
            @join="emit('join', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
