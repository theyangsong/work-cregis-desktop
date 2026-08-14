import vue from '@vitejs/plugin-vue';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

const EDS_ROOT = resolve(__dirname, '../eds-desktop');
const EDS_COMPONENTS_SRC = resolve(EDS_ROOT, 'packages/components/src/index.ts');
const EDS_COMPONENTS_SRC_DIR = resolve(EDS_ROOT, 'packages/components/src');
const EDS_ICONS_DIR = resolve(EDS_COMPONENTS_SRC_DIR, 'atoms/icons');
const EDS_ICON_REGISTRY = resolve(EDS_ICONS_DIR, 'iconRegistry.ts');
const EDS_TOKENS_SPEC_DIR = resolve(EDS_ROOT, 'packages/tokens/spec');
const EDS_TOKENS_DIST_DIR = resolve(EDS_ROOT, 'packages/tokens/dist');
const EDS_TOKENS_BUILD_SCRIPT = resolve(EDS_ROOT, 'packages/tokens/scripts/build.mjs');

/**
 * DS → 业务 实时：监听 sibling eds-desktop。
 * - tokens/spec 变更 → build:tokens → full-reload
 * - components 源码 → HMR / full-reload
 * - 仅读取 ../eds-desktop，不写业务代码回 DS
 */
function watchEdsDesktopPackages(): Plugin {
  let building = false;
  let queued = false;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let distReloadTimer: ReturnType<typeof setTimeout> | undefined;

  function scheduleFullReload(server: { ws: { send: (payload: unknown) => void } }) {
    clearTimeout(distReloadTimer);
    distReloadTimer = setTimeout(() => {
      server.ws.send({ type: 'full-reload' });
    }, 120);
  }

  function runTokenBuild(server: { ws: { send: (payload: unknown) => void } }) {
    if (building) {
      queued = true;
      return;
    }

    building = true;
    const child = spawn(process.execPath, [EDS_TOKENS_BUILD_SCRIPT], {
      cwd: resolve(EDS_ROOT, 'packages/tokens'),
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      building = false;
      if (code === 0) {
        scheduleFullReload(server);
      } else {
        console.error('[watch-eds-desktop] token build failed');
      }
      if (queued) {
        queued = false;
        runTokenBuild(server);
      }
    });
  }

  return {
    name: 'watch-eds-desktop-packages',
    configureServer(server) {
      server.watcher.add([
        EDS_COMPONENTS_SRC_DIR,
        EDS_TOKENS_SPEC_DIR,
        EDS_TOKENS_DIST_DIR,
      ]);

      server.watcher.on('change', (file) => {
        if (file.startsWith(EDS_TOKENS_SPEC_DIR)) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => runTokenBuild(server), 200);
          return;
        }

        if (
          !building &&
          file.startsWith(EDS_TOKENS_DIST_DIR) &&
          (file.endsWith('.css') || file.endsWith('.json'))
        ) {
          scheduleFullReload(server);
          return;
        }

        if (file.startsWith(EDS_COMPONENTS_SRC_DIR) && /\.(vue|css|ts)$/.test(file)) {
          scheduleFullReload(server);
          return;
        }

        if (file.startsWith(EDS_ICONS_DIR) && file.endsWith('.svg')) {
          const iconRegistryMod = server.moduleGraph.getModuleById(EDS_ICON_REGISTRY);
          if (iconRegistryMod) {
            server.moduleGraph.invalidateModule(iconRegistryMod);
          }
          scheduleFullReload(server);
        }
      });
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [vue(), watchEdsDesktopPackages()],
  resolve: {
    alias: [
      {
        find: '@eds/desktop-components/',
        replacement: `${EDS_COMPONENTS_SRC_DIR}/`,
      },
      {
        find: '@eds/desktop-components',
        replacement: EDS_COMPONENTS_SRC,
      },
      {
        find: '@',
        replacement: resolve(__dirname, 'src'),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['@eds/desktop-components'],
  },
  server: {
    host: true,
    port: 5178,
    strictPort: true,
    fs: {
      allow: [resolve(__dirname), EDS_ROOT],
    },
    watch: {
      ignored: [
        '**/node_modules/**',
        '!**/packages/components/**',
        '!**/packages/tokens/dist/**',
        '!**/packages/tokens/spec/**',
      ],
    },
  },
});
