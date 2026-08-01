import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5178,
    strictPort: true,
    fs: {
      allow: [resolve(__dirname), resolve(__dirname, '../eds-desktop')],
    },
  },
});
