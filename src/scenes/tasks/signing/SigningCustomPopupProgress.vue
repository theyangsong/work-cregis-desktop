<script setup lang="ts">
import { EgIcon, EgMotionProcessing } from '@eds/desktop-components';
import type { SigningCustomPopupProgressStep } from './signingCustomPopupProgress.types';
import styles from './SigningCustomPopupProgress.module.css';

const props = defineProps<{
  steps: SigningCustomPopupProgressStep[];
}>();

type ConnectorVisualState = 'done' | 'animating' | 'pending' | 'failed';

function connectorStateBetween(
  from: SigningCustomPopupProgressStep,
  to: SigningCustomPopupProgressStep,
): ConnectorVisualState {
  if (to.state === 'failed') return 'failed';
  if (from.state === 'done' && to.state === 'active') return 'animating';
  if (from.state === 'done') return 'done';
  return 'pending';
}

function connectorClass(
  from: SigningCustomPopupProgressStep,
  to: SigningCustomPopupProgressStep,
) {
  const state = connectorStateBetween(from, to);
  if (state === 'failed') return styles.stepConnectorFailed;
  if (state === 'done') return styles.stepConnectorDone;
  if (state === 'animating') return styles.stepConnectorAnimating;
  return styles.stepConnectorPending;
}
</script>

<template>
  <section :class="styles.progress" aria-label="Progress">
    <div :class="styles.stepTrack">
      <template v-for="(step, index) in props.steps" :key="step.key">
        <div
          :class="[
            styles.stepColumn,
            step.key === 'on-chain' && styles.stepColumnTemporarilyHidden,
          ]"
        >
          <span
            :class="[
              styles.stepIconWrap,
              step.state === 'pending' && styles.stepIconWrapPending,
              step.state === 'active' && styles.stepIconWrapActive,
              step.state === 'done' && styles.stepIconWrapDone,
              step.state === 'failed' && styles.stepIconWrapFailed,
            ]"
          >
            <EgMotionProcessing
              v-if="step.state === 'active'"
              :class="styles.stepIconMotionProcessing"
            />
            <EgIcon
              v-else-if="step.state === 'failed'"
              :class="styles.stepIconFailedClose"
              name="eds-close-mini"
              size="sm"
              fit
            />
            <EgIcon
              v-else-if="step.state === 'done'"
              :class="styles.stepIconDoneTick"
              name="oval-tick-mini"
              size="sm"
              fit
            />
          </span>
          <p
            :class="[
              styles.stepLabel,
              step.state === 'pending' && styles.stepLabelPending,
            ]"
          >
            {{ step.label }}
          </p>
        </div>
        <span
          v-if="
            index < props.steps.length - 1
            && step.key !== 'on-chain'
            && props.steps[index + 1]?.key !== 'on-chain'
          "
          :class="[
            styles.stepConnector,
            connectorClass(step, props.steps[index + 1]!),
          ]"
          aria-hidden="true"
        />
      </template>
    </div>
  </section>
</template>
