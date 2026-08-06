import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const EDS_COMPONENTS_SRC = resolve(__dirname, '../eds-desktop/packages/components/src/index.ts');

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Dev/build：走组件源码 + 各 SFC CSS Modules（与 eds-desktop showcase 一致），避免 dist/index.css 过期
      '@eds/desktop-components': EDS_COMPONENTS_SRC,
    },
  },
  optimizeDeps: {
    exclude: ['@eds/desktop-components'],
  },
  server: {
    host: true,
    port: 5178,
    strictPort: true,
    fs: {
      allow: [resolve(__dirname), resolve(__dirname, '../eds-desktop')],
    },
    watch: {
      ignored: ['**/node_modules/**', '!**/eds-desktop/packages/components/**'],
    },
  },
});
