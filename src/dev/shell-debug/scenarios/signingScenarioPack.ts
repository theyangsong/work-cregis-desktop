import { replaceShellDebugScenariosForPage } from '../registry';
import {
  applyMultiSignParticipantAutoFlowFailedScenario,
  applyMultiSignParticipantAutoFlowScenario,
  applyMultiSignParticipantReadyScenario,
  applyMultiSignParticipantSignFailedScenario,
  applyMultiSignParticipantSigningScenario,
  applyMultiSignParticipantSuccessScenario,
  applyMultiSignParticipantWaitingScenario,
  applyMultiSignReadyScenario,
  applyMultiSignWaitingScenario,
  applySigningBatchQuotaAlertScenario,
  applySigningFailedScenario,
  applyWalletShardMissingScenario,
} from './signingScenarioActions';

export function registerSigningScenarioPack() {
  replaceShellDebugScenariosForPage('Tasks:Signing', [
    // —— 多签 · 签名人 ——
    {
      id: 'multi-sign-waiting',
      pageKey: 'Tasks:Signing',
      label: '多签签名人（等待）',
      description: '签名人视角：多签等待室 · 等待阶段。',
      apply: applyMultiSignWaitingScenario,
    },
    {
      id: 'multi-sign-ready',
      pageKey: 'Tasks:Signing',
      label: '多签签名人（就绪）',
      description: '签名人视角：多签等待室 · 准备就绪，可开始签名。',
      apply: applyMultiSignReadyScenario,
    },
    {
      id: 'signing-failed',
      pageKey: 'Tasks:Signing',
      label: '多签签名人（签名失败）',
      description: '签名人视角：签名进度弹窗 · MPC 网络异常。',
      apply: applySigningFailedScenario,
    },
    {
      id: 'signing-batch-quota',
      pageKey: 'Tasks:Signing',
      label: '多签签名人（额度告警）',
      description: '签名人视角：批签确认弹窗 · 提现额度告警。',
      apply: applySigningBatchQuotaAlertScenario,
    },

    // —— 多签 · 参与人（全流程在前，分态在后）——
    {
      id: 'multi-sign-participant-auto-flow',
      pageKey: 'Tasks:Signing',
      label: '多签参与人-全流程（成功）',
      description: '等待 → 就绪 → 签名中 → 关弹窗 + 成功反馈。',
      apply: applyMultiSignParticipantAutoFlowScenario,
    },
    {
      id: 'multi-sign-participant-auto-flow-failed',
      pageKey: 'Tasks:Signing',
      label: '多签参与人-全流程（失败）',
      description: '等待 → 就绪 → 签名中 → 签名失败 + MPC 引导。',
      apply: applyMultiSignParticipantAutoFlowFailedScenario,
    },
    {
      id: 'multi-sign-participant-waiting',
      pageKey: 'Tasks:Signing',
      label: '多签参与人（等待）',
      description: '参与人视角：等待中，无签名按钮。',
      apply: applyMultiSignParticipantWaitingScenario,
    },
    {
      id: 'multi-sign-participant-ready',
      pageKey: 'Tasks:Signing',
      label: '多签参与人（就绪）',
      description: '参与人视角：准备就绪，无签名按钮。',
      apply: applyMultiSignParticipantReadyScenario,
    },
    {
      id: 'multi-sign-participant-signing',
      pageKey: 'Tasks:Signing',
      label: '多签参与人（签名中）',
      description: '参与人视角：签名中（eds-signature-pen-mini-fill）。',
      apply: applyMultiSignParticipantSigningScenario,
    },
    {
      id: 'multi-sign-participant-sign-failed',
      pageKey: 'Tasks:Signing',
      label: '多签参与人（签名失败）',
      description: '参与人视角：签名失败 + MPC 网络引导 Popover。',
      apply: applyMultiSignParticipantSignFailedScenario,
    },
    {
      id: 'multi-sign-participant-success',
      pageKey: 'Tasks:Signing',
      label: '多签参与人（签名成功）',
      description: '仅展示 EgEndFeedbackCard（签名成功）。',
      apply: applyMultiSignParticipantSuccessScenario,
    },

    // —— 多签 · 邀请 / 加入 ——
    {
      id: 'multi-sign-shard-missing',
      pageKey: 'Tasks:Signing',
      label: '多签邀请（分片缺失）',
      description: '将钱包分片设为未导入，触发浮标加入提示。',
      apply: applyWalletShardMissingScenario,
    },
  ]);
}

registerSigningScenarioPack();
