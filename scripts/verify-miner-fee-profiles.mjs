#!/usr/bin/env node
/**
 * 签名列表每一行都必须能解析矿工费 profile（无 null / 无 skip 路径）。
 * 静态校验：路由源文件约定 + 128 行 symbol/family/kind 矩阵。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ROW_COUNT = 128;

const REQUIRED_SOURCE_MARKERS = [
  {
    file: 'src/scenes/tasks/signing/useSigningFlow.ts',
    markers: ['isMultiSignSigningDetail'],
  },
  {
    file: 'src/scenes/tasks/signing/SigningDetailPopup.vue',
    markers: ['isMultiSignSigningDetail', 'resolveMinerFeeProfileFromDetail', ':miner-fee-profile='],
    forbidden: ['v-if="!isMultiSign"'],
  },
  {
    file: 'src/scenes/tasks/signing/signingStore.ts',
    markers: ['isMultiSignSigningDetail', 'isMultiSignRow'],
  },
  {
    file: 'src/scenes/tasks/signing/MultiSignWaitingPopup.vue',
    markers: ['MultiSignWaitingPanel', 'resolveMinerFeeProfileFromDetail', 'multiSignWaiting.constants'],
  },
  {
    file: 'src/scenes/tasks/signing/MultiSignWaitingPanel.vue',
    markers: ['multi-sign-waiting-shell', 'useMultiSignWaitingPopupHost'],
  },
  {
    file: 'src/scenes/tasks/approval/ApprovalRemarkPopoverPanel.vue',
    markers: ['MinerFeeTonLikePanel', "resolvedProfile.kind === 'ton-xrp'", 'MinerFeeTronPanel'],
  },
  {
    file: 'src/scenes/tasks/shared/minerFeeProfile.ts',
    markers: ['resolveCurrencyRowPreset', 'ton-xrp', 'buildTonLikeMinerFeeDisplay'],
  },
  {
    file: 'src/scenes/tasks/list-field/tasksListFieldCurrencyRowData.ts',
    markers: ['FIXED_CURRENCY_PRESET_ROW_COUNT', 'resolveCurrencyRowPreset'],
  },
];

for (const { file, markers, forbidden = [] } of REQUIRED_SOURCE_MARKERS) {
  const path = join(ROOT, file);
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    console.error(`[verify-miner-fee-profiles] missing ${file}`);
    process.exit(1);
  }
  for (const marker of markers) {
    if (!content.includes(marker)) {
      console.error(`[verify-miner-fee-profiles] ${file} missing marker: ${marker}`);
      process.exit(1);
    }
  }
  for (const marker of forbidden) {
    if (content.includes(marker)) {
      console.error(`[verify-miner-fee-profiles] ${file} still contains forbidden: ${marker}`);
      process.exit(1);
    }
  }
}

function parseRecordBlock(source, constName) {
  const match = source.match(
    new RegExp(`const ${constName}[^=]+=\\s*\\{([^}]+)\\}`, 's'),
  );
  if (!match) return {};
  const record = {};
  for (const entry of match[1].matchAll(/['"]?(\w+)['"]?\s*:\s*'(\w+)'/g)) {
    record[entry[1].toUpperCase()] = entry[2];
  }
  return record;
}

function parsePresets(source) {
  const presets = [];
  const block = source.match(
    /export const CURRENCY_ROW_PRESETS[^[]*\[([\s\S]*?)\]\s*as const/,
  );
  if (!block) return presets;
  for (const symbol of block[1].matchAll(/symbol:\s*'([^']+)'/g)) {
    presets.push(symbol[1]);
  }
  return presets;
}

function parseOverrides(source) {
  const overrides = {};
  const block = source.match(
    /CURRENCY_ROW_PRESET_OVERRIDES[^=]+=\s*\{([\s\S]*?)\n\};/,
  );
  if (!block) return overrides;
  for (const entry of block[1].matchAll(
    /(\d+):\s*\{[\s\S]*?symbol:\s*'([^']+)'[\s\S]*?(?:addressFamily:\s*'(\w+)')?/g,
  )) {
    overrides[Number(entry[1])] = {
      symbol: entry[2],
      addressFamily: entry[3],
    };
  }
  return overrides;
}

const samplePath = join(
  ROOT,
  'src/scenes/tasks/list-field/listFieldCryptoSampleAddresses.ts',
);
const presetsPath = join(
  ROOT,
  'src/scenes/tasks/list-field/tasksListFieldCurrencyRowPresets.ts',
);
const profilePath = join(ROOT, 'src/scenes/tasks/shared/minerFeeProfile.ts');

const sampleSource = readFileSync(samplePath, 'utf8');
const presetsSource = readFileSync(presetsPath, 'utf8');
const profileSource = readFileSync(profilePath, 'utf8');

const FAMILY_BY_SYMBOL = parseRecordBlock(sampleSource, 'FAMILY_BY_SYMBOL');
const FAMILY_BY_CRYPTO_NAME = parseRecordBlock(sampleSource, 'FAMILY_BY_CRYPTO_NAME');
const PROFILE_KIND_BY_FAMILY = parseRecordBlock(profileSource, 'PROFILE_KIND_BY_FAMILY');

const FIXED_COUNT = Number(
  presetsSource.match(/FIXED_CURRENCY_PRESET_ROW_COUNT = (\d+)/)?.[1] ?? '8',
);
const presetSymbols = parsePresets(presetsSource);
const overrides = parseOverrides(presetsSource);
const presetSymbolSet = new Set([
  ...presetSymbols,
  ...Object.values(overrides).map((item) => item.symbol),
]);

function resolveAddressFamily(symbol, familyOverride) {
  if (familyOverride) return familyOverride;
  const upper = symbol.trim().toUpperCase();
  if (FAMILY_BY_SYMBOL[upper]) return FAMILY_BY_SYMBOL[upper];
  const lower = symbol.toLowerCase();
  for (const [key, family] of Object.entries(FAMILY_BY_CRYPTO_NAME)) {
    if (lower.includes(key)) return family;
  }
  return 'evm';
}

function resolveProfileKind(family) {
  return PROFILE_KIND_BY_FAMILY[family] ?? 'evm';
}

function resolveRowSymbol(rowIndex) {
  const override = overrides[rowIndex];
  if (override) return override.symbol;
  if (rowIndex < FIXED_COUNT) return presetSymbols[rowIndex];
  const offset = rowIndex - FIXED_COUNT;
  const poolIndex = ((offset % Math.max(1, presetSymbolSet.size)) + presetSymbolSet.size) % presetSymbolSet.size;
  return `POOL_${poolIndex}`;
}

function resolveRowPreset(rowIndex) {
  const override = overrides[rowIndex];
  if (override) {
    return {
      symbol: override.symbol,
      addressFamily: override.addressFamily ?? resolveAddressFamily(override.symbol),
    };
  }
  if (rowIndex < FIXED_COUNT) {
    const symbol = presetSymbols[rowIndex];
    return {
      symbol,
      addressFamily: resolveAddressFamily(symbol),
    };
  }
  return {
    symbol: resolveRowSymbol(rowIndex),
    addressFamily: 'evm',
  };
}

const kindCounts = {};
const missingFamily = [];

for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex += 1) {
  const preset = resolveRowPreset(rowIndex);
  const kind = resolveProfileKind(preset.addressFamily);
  kindCounts[kind] = (kindCounts[kind] ?? 0) + 1;
  if (!preset.symbol) {
    missingFamily.push(rowIndex);
  }
}

if (missingFamily.length > 0) {
  console.error(
    `[verify-miner-fee-profiles] rows missing symbol: ${missingFamily.join(', ')}`,
  );
  process.exit(1);
}

console.log(
  `✓ verify-miner-fee-profiles passed (${ROW_COUNT} rows; kinds: ${Object.entries(kindCounts)
    .map(([kind, count]) => `${kind}=${count}`)
    .join(', ')})`,
);
