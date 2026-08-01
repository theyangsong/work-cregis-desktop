import { buildTransferTypeRowValues } from './tasksListFieldBusinessTypeRowData';
import { buildApplicationTimeSecondaryValue } from './businessTypeDisplay';
import {
  isWaasPayoutTransferType,
  resolveWaasProjectNameForRow,
} from '../shared/waasProjectNames';

export type GeneralStructureRowValues = {
  value: string;
  secondaryValue: string;
  showLeftTag?: boolean;
  showRightTag?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  leftSystemType?: string;
  rightSystemType?: string;
  initiatorIconKind?: 'avatar' | 'app' | 'none';
  initiatorAppIcon?: string;
};

/** 当前登录用户（Me Tag 行统一展示同一发起人）。 */
const CURRENT_USER_INITIATOR = {
  displayName: 'Name',
  email: 'testabc@gmail.com',
} as const;

function maskEmailLocalPart(local: string): string {
  const trimmed = local.trim();
  if (!trimmed) return trimmed;
  if (trimmed.length === 1) return trimmed;
  if (trimmed.length <= 4) return `${trimmed[0]}***${trimmed.at(-1) ?? ''}`;
  return `${trimmed[0]}******${trimmed.at(-1) ?? ''}`;
}

function maskEmailAddress(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${maskEmailLocalPart(local)}@${domain}`;
}

function formatInitiatorValue(displayName: string, email: string): string {
  return `${displayName} (${maskEmailAddress(email)})`;
}

function currentUserInitiatorValue(): string {
  return formatInitiatorValue(
    CURRENT_USER_INITIATOR.displayName,
    CURRENT_USER_INITIATOR.email,
  );
}

function buildMeInitiatorRow(value: string): GeneralStructureRowValues {
  return {
    value,
    secondaryValue: '',
    showLeftTag: true,
    leftLabel: 'Me',
    leftSystemType: 'stroke-solid',
  };
}

/** 发起方主行 demo（0–7）；副行申请时间见 APPLICATION_TIME_ROW_PRESETS。 */
const INITIATOR_PRIMARY_PRESETS: readonly GeneralStructureRowValues[] = [
  {
    value: formatInitiatorValue('Treasury', 'treasury@cregis.com'),
    secondaryValue: '',
  },
  buildMeInitiatorRow(currentUserInitiatorValue()),
  buildMeInitiatorRow(currentUserInitiatorValue()),
  {
    value: formatInitiatorValue('Ops Team', 'ops@cregis.com'),
    secondaryValue: '',
  },
  {
    value: 'Ben (b******n@gmail.com)',
    secondaryValue: '',
  },
  {
    value: formatInitiatorValue('Name', 'testabc@gmail.com'),
    secondaryValue: '',
  },
  {
    value: 'Chris (c******s@proton.me)',
    secondaryValue: '',
  },
  {
    value: formatInitiatorValue('Finance Bot', 'bot@cregis.com'),
    secondaryValue: '',
  },
] as const;

function seededFraction(rowIndex: number, salt: number): number {
  const x = Math.sin((rowIndex + 1) * 9973 + salt * 7919) * 10000;
  return x - Math.floor(x);
}

function buildRandomGeneralStructureRowValues(rowIndex: number): GeneralStructureRowValues {
  const names = ['Dana', 'Evan', 'Faye', 'Glen', 'Hana', 'Ivan', 'Jade', 'Kyle'];
  const domains = ['gmail.com', 'company.io', 'outlook.com', 'proton.me', 'cregis.com'];
  const name = names[rowIndex % names.length] ?? 'User';
  const domain = domains[Math.floor(seededFraction(rowIndex, 1) * domains.length)] ?? 'gmail.com';
  const rawLocal = `${name.toLowerCase()}${rowIndex + 1}`;

  return {
    value: formatInitiatorValue(name, `${rawLocal}@${domain}`),
    secondaryValue: buildApplicationTimeSecondaryValue(rowIndex),
  };
}

function resolveInitiatorPrimaryPreset(rowIndex: number): GeneralStructureRowValues {
  const preset = INITIATOR_PRIMARY_PRESETS[rowIndex];
  if (preset) {
    return {
      ...preset,
      secondaryValue: buildApplicationTimeSecondaryValue(rowIndex),
    };
  }
  return buildRandomGeneralStructureRowValues(rowIndex);
}

export function buildGeneralStructureRowValues(rowIndex: number): GeneralStructureRowValues {
  const transferType = buildTransferTypeRowValues(rowIndex);
  const base = resolveInitiatorPrimaryPreset(rowIndex);

  if (isWaasPayoutTransferType(transferType.value)) {
    return {
      ...base,
      value: resolveWaasProjectNameForRow(rowIndex),
      showLeftTag: false,
      leftLabel: undefined,
      leftSystemType: undefined,
      initiatorIconKind: 'none',
    };
  }

  return {
    ...base,
    initiatorIconKind: 'avatar',
  };
}
