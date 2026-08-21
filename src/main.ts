import { createApp } from 'vue';
import {
  initEdsDesktopRuntime,
  initThemeProvider,
  rescanCornerSmoothing,
} from '@eds/desktop-components';
import { initLiquidGlass } from '@eds/desktop-tokens/liquid-glass';
import '@eds/desktop-tokens/fonts';
import '@eds/desktop-tokens';
import './styles/desktop-components-scope.css';

import { initAppLocale } from './composables/useAppLocale';
import AppRoot from './AppRoot.vue';
import { router } from './router';
import { installPageCopyGuard } from './utils/preventPageCopy';
import './styles/global.css';
import './styles/cregis-theme.css';
import { installShellDebugFloatLayerGuard } from '@/dev/shell-debug/installShellDebugFloatLayerGuard';

if (import.meta.env.DEV) {
  installShellDebugFloatLayerGuard();
}

initLiquidGlass();
initEdsDesktopRuntime();
initThemeProvider();
initAppLocale();
installPageCopyGuard();

createApp(AppRoot).use(router).mount('#app');

router.afterEach(() => {
  requestAnimationFrame(() => {
    rescanCornerSmoothing();
  });
});
