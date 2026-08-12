import { buildTransferTypeRowValues } from './tasksListFieldBusinessTypeRowData';
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
};

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

/** 当前登录用户（Me Tag 行统一展示同一发起人）。 */
const CURRENT_USER_INITIATOR = {
  displayName: 'Name',
  email: 'testabc@gmail.com',
} as const;

function currentUserInitiatorValue(): string {
  return formatInitiatorValue(
    CURRENT_USER_INITIATOR.displayName,
    CURRENT_USER_INITIATOR.email,
  );
}

function buildMeInitiatorRow(secondaryValue: string): GeneralStructureRowValues {
  return {
    value: currentUserInitiatorValue(),
    secondaryValue,
    showLeftTag: true,
    leftLabel: 'Me',
    leftSystemType: 'stroke-solid',
  };
}

const GENERAL_STRUCTURE_ROW_PRESETS: readonly GeneralStructureRowValues[] = [
  {
    value: formatInitiatorValue('Name', 'testabc@gmail.com'),
    secondaryValue: '2026-07-19 14:30:00',
  },
  buildMeInitiatorRow('2026-07-18 09:15:42'),
  buildMeInitiatorRow('2026-07-17 22:08:11'),
  {
    value: formatInitiatorValue('Ops Team', 'ops@cregis.com'),
    secondaryValue: '2026-07-16 11:02:33',
  },
  {
    value: 'Ben (b******n@gmail.com)',
    secondaryValue: '2026-07-15 16:44:05',
  },
  {
    value: formatInitiatorValue('Treasury', 'treasury@cregis.com'),
    secondaryValue: '2026-07-14 08:20:18',
  },
  {
    value: 'Chris (c******s@proton.me)',
    secondaryValue: '2026-07-13 19:55:27',
  },
  {
    value: formatInitiatorValue('Finance Bot', 'bot@cregis.com'),
    secondaryValue: '2026-07-12 03:12:09',
  },
] as const;

function seededFraction(rowIndex: number, salt: number): number {
  const x = Math.sin((rowIndex + 1) * 9973 + salt * 7919) * 10000;
  return x - Math.floor(x);
}

function buildRandomGeneralStructureRowValues(rowIndex: number): GeneralStructureRowValues {
  const hour = String(Math.floor(seededFraction(rowIndex, 2) * 24)).padStart(2, '0');
  const minute = String(Math.floor(seededFraction(rowIndex, 3) * 60)).padStart(2, '0');
  const day = String((rowIndex % 27) + 1).padStart(2, '0');
  const secondaryValue = `2026-07-${day} ${hour}:${minute}:00`;

  if (rowIndex === 1 || rowIndex === 2) {
    return buildMeInitiatorRow(secondaryValue);
  }

  const names = ['Dana', 'Evan', 'Faye', 'Glen', 'Hana', 'Ivan', 'Jade', 'Kyle'];
  const domains = ['gmail.com', 'company.io', 'outlook.com', 'proton.me', 'cregis.com'];
  const name = names[rowIndex % names.length] ?? 'User';
  const domain = domains[Math.floor(seededFraction(rowIndex, 1) * domains.length)] ?? 'gmail.com';
  const rawLocal = `${name.toLowerCase()}${rowIndex + 1}`;

  return {
    value: formatInitiatorValue(name, `${rawLocal}@${domain}`),
    secondaryValue,
  };
}

export function buildGeneralStructureRowValues(rowIndex: number): GeneralStructureRowValues {
  const transferType = buildTransferTypeRowValues(rowIndex);
  const preset = GENERAL_STRUCTURE_ROW_PRESETS[rowIndex];
  const base = preset ?? buildRandomGeneralStructureRowValues(rowIndex);

  if (isWaasPayoutTransferType(transferType.value)) {
    return {
      ...base,
      value: resolveWaasProjectNameForRow(rowIndex),
      showLeftTag: false,
      leftLabel: undefined,
      leftSystemType: undefined,
    };
  }

  return base;
}
