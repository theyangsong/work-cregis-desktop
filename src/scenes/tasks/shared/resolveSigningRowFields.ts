import type { ApprovalProgressMember } from '../approval/types';
import { isMultiSignRow } from '../list-field/tasksListFieldBusinessTypeRowData';
import { parseSigningThreshold } from '../signing/multiSignWaiting.constants';

/** 多签演示门限：4 人签完即通过（共 5 个钱包签名人）。 */
export const MULTI_SIGN_THRESHOLD = '4 / 5';

function resolveMultiSignParticipantCount(): number {
  return parseSigningThreshold(MULTI_SIGN_THRESHOLD).required;
}

const PASSED_SIGNATURE_AT_DISPLAYS = [
  '2027-12-23 10:28:40',
  '2027-12-23 10:28:45',
  '2027-12-23 10:28:50',
] as const;

const defaultDeviceInfo: ApprovalProgressMember['deviceInfo'] = {
  deviceType: 'MacOS(v3.6.0)',
  deviceId: 'AXSMJSAXJQ',
  ip: '192.168.2.1',
};

export type SignerSeeds = {
  ethan: ApprovalProgressMember;
  jordan: ApprovalProgressMember;
  taylor: ApprovalProgressMember;
};

export function resolveSigningModeForRow(rowIndex: number): 'single' | 'multi' {
  return isMultiSignRow(rowIndex) ? 'multi' : 'single';
}

export function resolveSigningThresholdForRow(rowIndex: number): string | null {
  return isMultiSignRow(rowIndex) ? MULTI_SIGN_THRESHOLD : null;
}

export function stripSignerActionFields(
  member: ApprovalProgressMember,
): ApprovalProgressMember {
  const { atDisplay: _atDisplay, deviceInfo: _deviceInfo, ...rest } = member;
  return rest;
}

/** 与列表多签 Tag 对齐；详情 signer 人数 = 门限 required（4/5 → 4 人）。 */
export function resolveSignerPoolForRow(
  rowIndex: number,
  seeds: SignerSeeds,
): ApprovalProgressMember[] {
  if (isMultiSignRow(rowIndex)) {
    const participantCount = resolveMultiSignParticipantCount();
    return [seeds.ethan, seeds.jordan, seeds.taylor].slice(0, participantCount);
  }
  return [seeds.ethan];
}

/** 待签名：池内成员无个人签名时间。 */
export function resolvePendingSignersForRow(
  rowIndex: number,
  seeds: SignerSeeds,
): ApprovalProgressMember[] {
  return resolveSignerPoolForRow(rowIndex, seeds).map(stripSignerActionFields);
}

/** 签名通过：单签 1 人；多签展示门限 required 人数的已签成员。 */
export function resolvePassedSignersForRow(
  rowIndex: number,
  seeds: SignerSeeds,
): ApprovalProgressMember[] {
  const pool = resolveSignerPoolForRow(rowIndex, seeds);

  return pool.map((signer, index) => ({
    ...signer,
    atDisplay: PASSED_SIGNATURE_AT_DISPLAYS[index] ?? PASSED_SIGNATURE_AT_DISPLAYS[0],
    deviceInfo: defaultDeviceInfo,
  }));
}

export function attachSigningMeta<T extends Record<string, unknown>>(
  rowIndex: number,
  fields: T,
): T & {
  signingMode: 'single' | 'multi';
  signingThreshold: string | null;
} {
  return {
    ...fields,
    signingMode: resolveSigningModeForRow(rowIndex),
    signingThreshold: resolveSigningThresholdForRow(rowIndex),
  };
}
