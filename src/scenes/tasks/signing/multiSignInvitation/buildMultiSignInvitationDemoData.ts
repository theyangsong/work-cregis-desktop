import {
  resolveSampleAddressForSymbol,
  sideAddressPoolIndex,
} from '../../list-field/listFieldCryptoSampleAddresses';
import type { MultiSignInvitation } from './types';

export const MULTI_SIGN_INVITATION_DEMO_COUNT = 23;

const INVITER_NAMES = [
  '张三',
  '李四',
  '王五',
  '赵六',
  '钱七',
  '孙八',
  '周九',
  '吴十',
  '郑一',
  '冯二',
];

const EMAIL_LOCALS = [
  'zhang',
  'li',
  'wang',
  'zhao',
  'qian',
  'sun',
  'zhou',
  'wu',
  'zheng',
  'feng',
];

const CURRENCY_PRESETS = [
  { symbol: 'USDT', networkLabel: 'Ethereum', amountDisplay: '1,000.09837' },
  { symbol: 'USDC', networkLabel: 'Ethereum', amountDisplay: '500.00' },
  { symbol: 'BNB', networkLabel: 'BNB Smart Chain', amountDisplay: '50.00' },
  { symbol: 'ETH', networkLabel: 'Ethereum', amountDisplay: '2.5180' },
  { symbol: 'BTC', networkLabel: 'Bitcoin', amountDisplay: '0.12500' },
  { symbol: 'DAI', networkLabel: 'Ethereum', amountDisplay: '10,000.00' },
];

const SENDER_WALLET_NAMES = ['主钱包', '运营钱包', 'Treasury', 'Cold Wallet', 'Payroll'];

function maskInviterEmail(local: string, domain = 'gtc.com'): string {
  const trimmed = local.trim();
  if (!trimmed) {
    return `u***u@${domain}`;
  }
  if (trimmed.length === 1) {
    return `${trimmed}***@${domain}`;
  }
  return `${trimmed[0]}***${trimmed.slice(-1)}@${domain}`;
}

function formatInvitedAtDisplay(baseMs: number, offsetHours: number): string {
  const date = new Date(baseMs - offsetHours * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function seededFraction(index: number, salt: number): number {
  const x = Math.sin((index + 1) * 9973 + salt * 7919) * 10000;
  return x - Math.floor(x);
}

function resolveInvitationSideAddress(
  symbol: string,
  prefix: 'from' | 'to',
  index: number,
): string {
  const jitter = Math.floor(seededFraction(index, prefix === 'from' ? 11 : 29) * 14);
  const poolIndex = sideAddressPoolIndex(prefix, index) + 1 + index * 2 + jitter;
  return resolveSampleAddressForSymbol(symbol, poolIndex);
}

function resolveDistinctInvitationAddresses(
  symbol: string,
  index: number,
): { sender: string; receiver: string } {
  let sender = resolveInvitationSideAddress(symbol, 'from', index);
  let receiver = resolveInvitationSideAddress(symbol, 'to', index);

  let guard = 0;
  while (sender === receiver && guard < 8) {
    guard += 1;
    receiver = resolveSampleAddressForSymbol(
      symbol,
      sideAddressPoolIndex('to', index) + 1 + index * 2 + guard * 3,
    );
  }

  return { sender, receiver };
}

export function buildMultiSignInvitationDemoData(
  count = MULTI_SIGN_INVITATION_DEMO_COUNT,
): MultiSignInvitation[] {
  const baseInvitedAtMs = Date.parse('2026-08-04T09:30:00');

  return Array.from({ length: count }, (_, index) => {
    const preset = CURRENCY_PRESETS[index % CURRENCY_PRESETS.length]!;
    const inviterName = INVITER_NAMES[index % INVITER_NAMES.length]!;
    const emailLocal = EMAIL_LOCALS[index % EMAIL_LOCALS.length]!;
    const { sender: senderAddress, receiver: receiverAddress } =
      resolveDistinctInvitationAddresses(preset.symbol, index);

    return {
      id: `msi-${index + 1}`,
      status: 'pending' as const,
      inviterName,
      inviterEmailMasked: maskInviterEmail(emailLocal),
      invitedAtDisplay: formatInvitedAtDisplay(baseInvitedAtMs, index * 3 + (index % 5)),
      amountDisplay: preset.amountDisplay,
      amountSymbol: preset.symbol,
      networkLabel: preset.networkLabel,
      taskAvatarColorIndex: (index * 11 + 5) % 20,
      sender: {
        walletName: index % 4 === 0 ? undefined : SENDER_WALLET_NAMES[index % SENDER_WALLET_NAMES.length],
        address: senderAddress,
        tags: [],
      },
      receiver: {
        alias: index === 0 ? 'Alex Mah' : undefined,
        address: receiverAddress,
        tags: [],
      },
    };
  });
}
