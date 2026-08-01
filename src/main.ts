import { createApp } from 'vue';
import {
  initEdsDesktopRuntime,
  initThemeProvider,
  rescanCornerSmoothing,
} from '@eds/desktop-components';
import { initLiquidGlass } from '@eds/desktop-tokens/liquid-glass';
import '@eds/desktop-tokens/fonts';
import '@eds/desktop-tokens';
import '@eds/desktop-components/style.css';

import App from './App.vue';
import { router } from './router';
import './styles/global.css';
import './styles/cregis-theme.css';

initLiquidGlass();
initEdsDesktopRuntime();
initThemeProvider();

createApp(App).use(router).mount('#app');

router.afterEach(() => {
  requestAnimationFrame(() => {
    rescanCornerSmoothing();
  });
});
