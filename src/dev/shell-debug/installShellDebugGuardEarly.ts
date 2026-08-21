import { installShellDebugFloatLayerGuard } from './installShellDebugFloatLayerGuard';

/** 与 AppRoot 一致：Pages preview / CI 也开 Shell Debug 时须装 guard，否则 4174 点 Dev 会关业务 Popover。 */
const shellDebugEnabled = import.meta.env.VITE_SHELL_DEBUG !== 'false';

if (shellDebugEnabled) {
  installShellDebugFloatLayerGuard();
}
