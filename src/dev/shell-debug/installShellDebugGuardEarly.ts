import { installShellDebugFloatLayerGuard } from './installShellDebugFloatLayerGuard';

if (import.meta.env.DEV) {
  installShellDebugFloatLayerGuard();
}
