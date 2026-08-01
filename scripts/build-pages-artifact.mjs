/**
 * 与 GitHub Actions deploy-pages 同链：prebuild → vite build → manifest → 404 → verify。
 * 须设置 VITE_BASE_PATH（CI 按仓库名）；VITE_SHELL_DEBUG 默认 true。
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';

const basePath = process.env.VITE_BASE_PATH || '/work-cregis-desktop/';
const env = {
  ...process.env,
  VITE_BASE_PATH: basePath,
  VITE_SHELL_DEBUG: process.env.VITE_SHELL_DEBUG ?? 'true',
};

function run(command, args) {
  const result = spawnSync(command, args, {
    env,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('pnpm', ['prebuild']);
run('pnpm', ['exec', 'vite', 'build']);
run('node', ['scripts/write-deploy-manifest.mjs']);
copyFileSync('dist/index.html', 'dist/404.html');
run('node', ['scripts/verify-pages-artifact.mjs']);
