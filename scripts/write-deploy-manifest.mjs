import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';

const distAssets = 'dist/assets';
const bundle =
  readdirSync(distAssets).find((name) => name.startsWith('index-') && name.endsWith('.js')) ?? '';

const sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const archive = execSync('git tag --points-at HEAD 2>/dev/null | head -1', { encoding: 'utf8' }).trim();
const builtAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

/** 与 .github/workflows/deploy-pages.yml 写入格式一致。 */
const manifest = { sha, builtAt, bundle };
if (archive) {
  manifest.archiveName = archive;
}

writeFileSync('dist/deploy-manifest.json', `${JSON.stringify(manifest)}\n`);
