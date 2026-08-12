<script setup lang="ts">
import { EgTag } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import DetailApprovalProgressMemberRows from './DetailApprovalProgressMemberRows.vue';
import type { DetailApprovalProgressStep } from './detailApprovalProgress.types';
import styles from './DetailApprovalProgressTimeline.module.css';

defineProps<{
  steps: DetailApprovalProgressStep[];
}>();

const { ui } = useAppI18n();
</script>

<template>
  <ol :class="styles.timeline">
    <li v-for="step in steps" :key="step.key" :class="styles.step">
      <div :class="styles.markerTrack" aria-hidden="true">
        <span :class="styles.markerLine" />
        <span
          :class="[
            styles.marker,
            step.markerTone === 'danger' && styles.markerDanger,
            step.completed && step.markerTone !== 'danger' && styles.markerCompleted,
          ]"
        />
      </div>

      <div :class="styles.stepBody">
        <div :class="styles.stepHeader">
          <div :class="styles.stepTitleCluster">
            <div :class="styles.stepTitleGroup">
              <span
                :class="[
                  styles.stepTitle,
                  step.markerTone === 'danger' && styles.stepTitleDanger,
                ]"
              >{{ ui(step.title) }}</span>
              <span v-if="step.subtitle" :class="styles.stepSubtitle">{{ step.subtitle }}</span>
            </div>
            <EgTag
              v-if="step.statusLabel && step.statusTag"
              family="status"
              size="md"
              :status="step.statusTag"
            >
              {{ ui(step.statusLabel) }}
            </EgTag>
          </div>
        </div>

        <DetailApprovalProgressMemberRows
          :members="step.members"
          :list-key="step.key"
        />
      </div>
    </li>
  </ol>
</template>
