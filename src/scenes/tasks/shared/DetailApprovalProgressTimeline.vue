<script setup lang="ts">
import { ref } from 'vue';
import { EgIcon, EgMotionProcessing, EgTag, EgTextOverflowTooltip } from '@eds/desktop-components';
import { copyToClipboard } from '@eds/desktop-components/utils/copyToClipboard';
import { useAppI18n } from '@/composables/useAppI18n';
import DetailApprovalProgressMemberRows from './DetailApprovalProgressMemberRows.vue';
import DetailValueActionIcon from './DetailValueActionIcon.vue';
import type {
  DetailApprovalProgressStep,
  DetailAutomationSignatureRule,
} from './detailApprovalProgress.types';
import { resolveDetailApprovalProgressMarkerVisual } from './resolveDetailApprovalProgressMarkerVisual';
import styles from './DetailApprovalProgressTimeline.module.css';

defineProps<{
  steps: DetailApprovalProgressStep[];
}>();

const { ui } = useAppI18n();
const copiedAutomationRuleKey = ref<string | null>(null);
let copiedAutomationRuleResetTimer: ReturnType<typeof setTimeout> | undefined;

function markerVisual(step: DetailApprovalProgressStep) {
  return resolveDetailApprovalProgressMarkerVisual(step);
}

function automationSignatureRuleDisplay(rule: DetailAutomationSignatureRule): string {
  return `${rule.name} (${rule.id})`;
}

function automationSignatureRuleCopyKey(step: DetailApprovalProgressStep): string {
  return `${step.key}-${step.automationSignatureRule?.id ?? ''}`;
}

/** 自动签名标识（非状态 Tag）：仅签名完成且存在规则数据时展示。 */
function showAutoSignatureIdentifier(step: DetailApprovalProgressStep): boolean {
  return step.key === 'signature' && step.completed && Boolean(step.automationSignatureRule);
}

async function onCopyAutomationRule(
  step: DetailApprovalProgressStep,
  event?: MouseEvent,
) {
  const rule = step.automationSignatureRule;
  if (!rule) return;

  event?.stopPropagation();
  event?.preventDefault();

  const copied = await copyToClipboard(automationSignatureRuleDisplay(rule));
  if (!copied) return;

  const copyKey = automationSignatureRuleCopyKey(step);
  copiedAutomationRuleKey.value = copyKey;
  if (copiedAutomationRuleResetTimer) clearTimeout(copiedAutomationRuleResetTimer);
  copiedAutomationRuleResetTimer = setTimeout(() => {
    if (copiedAutomationRuleKey.value === copyKey) {
      copiedAutomationRuleKey.value = null;
    }
  }, 2000);
}
</script>

<template>
  <ol :class="styles.timeline">
    <li v-for="step in steps" :key="step.key" :class="styles.step">
      <div :class="styles.markerColumn" aria-hidden="true">
        <span
          :class="[
            styles.marker,
            markerVisual(step) === 'default' && styles.markerDefault,
            markerVisual(step) === 'completed' && styles.markerCompleted,
            markerVisual(step) === 'processing' && styles.markerProcessing,
            markerVisual(step) === 'rejected' && styles.markerRejected,
            markerVisual(step) === 'withdrawn' && styles.markerWithdrawn,
          ]"
        >
          <EgMotionProcessing
            v-if="markerVisual(step) === 'processing'"
            :class="styles.markerMotionProcessing"
          />
          <EgIcon
            v-else-if="markerVisual(step) === 'completed'"
            :class="styles.markerCompletedGlyph"
            name="oval-tick-mini"
            size="sm"
            fit
          />
          <EgIcon
            v-else-if="markerVisual(step) === 'withdrawn'"
            :class="styles.markerWithdrawnGlyph"
            name="eds-arrow-refuses-mini"
            size="sm"
            fit
          />
          <EgIcon
            v-else-if="markerVisual(step) === 'rejected'"
            :class="styles.markerRejectedGlyph"
            name="eds-close-mini"
            size="sm"
            fit
          />
        </span>
        <span :class="styles.markerLine" />
      </div>

      <div :class="styles.stepContent">
        <div :class="styles.stepHeader">
          <div :class="styles.stepTitleCluster">
            <div :class="styles.stepTitleGroup">
              <span
                :class="[
                  styles.stepTitle,
                  step.markerTone === 'danger' && styles.stepTitleDanger,
                ]"
              >{{ ui(step.title) }}</span>
              <span v-if="step.subtitle" :class="styles.stepSubtitle">
                <template v-if="step.subtitleWrapParens">({{ ui(step.subtitle) }})</template>
                <template v-else>{{ step.subtitle }}</template>
              </span>
            </div>
            <EgTag
              v-if="showAutoSignatureIdentifier(step)"
              size="sm"
              system-type="stroke-solid"
            >
              {{ ui('Auto Signature') }}
            </EgTag>
          </div>
          <div
            v-if="showAutoSignatureIdentifier(step)"
            :class="styles.automationRuleRow"
            role="button"
            tabindex="0"
            @click="onCopyAutomationRule(step, $event)"
            @keydown.enter.prevent="onCopyAutomationRule(step)"
            @keydown.space.prevent="onCopyAutomationRule(step)"
          >
            <EgTextOverflowTooltip
              :tooltip-text="automationSignatureRuleDisplay(step.automationSignatureRule!)"
              :typography-class="styles.automationRuleTextTypography"
              :host-class="styles.automationRuleTextHost"
              boundary-selector=".eds-popup"
              target-tone="secondary"
            >
              {{ automationSignatureRuleDisplay(step.automationSignatureRule!) }}
            </EgTextOverflowTooltip>
            <span
              :class="[
                styles.automationRuleCopyButton,
                copiedAutomationRuleKey === automationSignatureRuleCopyKey(step)
                  && styles.automationRuleCopyButtonCopied,
              ]"
              @click.stop
            >
              <DetailValueActionIcon
                :label="ui('Copy')"
                :icon="
                  copiedAutomationRuleKey === automationSignatureRuleCopyKey(step)
                    ? 'eds-enable-fill'
                    : 'eds-copy'
                "
                @click="onCopyAutomationRule(step, $event)"
              />
            </span>
          </div>
        </div>

        <DetailApprovalProgressMemberRows
          :members="step.members"
          :list-key="step.key"
          :presentation="step.memberPresentation ?? 'acted-rows'"
        />
      </div>
    </li>
  </ol>
</template>
