#!/usr/bin/env node
/**
 * 确保 listFieldCryptoSampleAddresses.ts 仍含业务扩展导出。
 * eds-desktop sync 已跳过该文件；若被手动覆盖，predev 会在此失败并提示。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TARGET = join(
  process.cwd(),
  'src/scenes/tasks/list-field/listFieldCryptoSampleAddresses.ts',
);

const REQUIRED_MARKERS = [
  'getPinnedAddressForRow',
  'DEMO_ADDRESS_POOL_MIN = 23',
  "'ton'",
  'familyOverride',
];

let content;
try {
  content = readFileSync(TARGET, 'utf8');
} catch {
  console.error(`[verify-list-field-crypto] missing ${TARGET}`);
  process.exit(1);
}

const missing = REQUIRED_MARKERS.filter((marker) => !content.includes(marker));
if (missing.length > 0) {
  console.error(
    `[verify-list-field-crypto] ${TARGET} 已被 showcase 精简版覆盖，缺少: ${missing.join(', ')}`,
  );
  console.error('  请从 git 历史恢复，或参考 AGENTS.md § list-field 本地扩展。');
  process.exit(1);
}

console.log('✓ verify-list-field-crypto passed');
