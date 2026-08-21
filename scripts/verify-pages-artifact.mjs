import { readFileSync, existsSync, readdirSync } from 'node:fs';

const basePath = process.env.VITE_BASE_PATH || '/work-cregis-desktop/';
const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
const indexHtml = readFileSync('dist/index.html', 'utf8');
const manifestRaw = readFileSync('dist/deploy-manifest.json', 'utf8');
const manifest = JSON.parse(manifestRaw);

const errors = [];

if (!existsSync('dist/404.html')) {
  errors.push('dist/404.html missing (SPA fallback)');
}

const scriptMatch = indexHtml.match(/src="([^"]+index-[^"]+\.js)"/);
if (!scriptMatch) {
  errors.push('dist/index.html: no index-*.js script tag');
} else if (!scriptMatch[1].startsWith(`${normalizedBase}assets/`)) {
  errors.push(
    `dist/index.html script src=${scriptMatch[1]} does not match base ${normalizedBase}assets/`,
  );
}

if (!manifest.bundle || !existsSync(`dist/assets/${manifest.bundle}`)) {
  errors.push(`deploy-manifest bundle missing: ${manifest.bundle ?? '(empty)'}`);
}

if (!manifest.sha) {
  errors.push('deploy-manifest sha missing');
}

const bundleJs = readFileSync(`dist/assets/${manifest.bundle}`, 'utf8');
if (!bundleJs.includes('list-field-operation-type')) {
  errors.push('production bundle missing list-field-operation-type (业务类型列组件)');
}
if (!bundleJs.includes('SentRequestOperationTypeListCell')) {
  errors.push('production bundle missing SentRequestOperationTypeListCell');
}

/** Pages 与本地 dev 排版 parity：pin 须含 DS Text Style + mono 字体（见 eds-desktop 88b7b9a+）。 */
const cssFiles = readdirSync('dist/assets').filter((name) => name.endsWith('.css'));
const cssBlob = cssFiles.map((name) => readFileSync(`dist/assets/${name}`, 'utf8')).join('\n');
if (!cssBlob.includes('typography-footnote')) {
  errors.push('production CSS missing .typography-footnote (DS Text Style 未进 Pages 构建)');
}
if (!cssBlob.includes('--eds-family-mono')) {
  errors.push('production CSS missing --eds-family-mono (IBM Plex Mono token 未进 Pages 构建)');
}
const assetNames = readdirSync('dist/assets');
if (!assetNames.some((name) => name.includes('IBMPlexMono'))) {
  errors.push('dist/assets missing IBMPlexMono font files');
}

if (errors.length > 0) {
  console.error('✗ verify-pages-artifact failed:');
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log('✓ verify-pages-artifact passed');
console.log(`  base: ${normalizedBase}`);
console.log(`  bundle: ${manifest.bundle}`);
console.log(`  sha: ${manifest.sha}`);
