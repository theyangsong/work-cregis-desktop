import type { InspectCodeSection } from './buildIconInspect';
import {
  formatEffectSemanticLayoutLines,
  formatEffectSemanticStyleLine,
  lookupEffectSemanticSpec,
  resolveEffectSemanticClass,
} from './effectSemanticSpec';

function isBatchBarGlassShell(element: Element): boolean {
  return element.classList.contains('eds-batch-bar-glass')
    || Boolean(element.closest('.eds-batch-bar-glass'));
}

export function buildEffectSemanticCodeSections(element: Element): InspectCodeSection[] | null {
  const className = resolveEffectSemanticClass(element);
  if (!className) return null;

  const spec = lookupEffectSemanticSpec(className);
  if (!spec) return null;

  const sections: InspectCodeSection[] = [];

  const layoutLines = formatEffectSemanticLayoutLines(spec, {
    batchBarInnerPanel: isBatchBarGlassShell(element),
  });
  if (layoutLines.length > 0) {
    sections.push({ title: '布局', content: layoutLines.join('\n') });
  }

  sections.push({ title: '样式', content: formatEffectSemanticStyleLine(spec) });

  return sections;
}

/** EgTooltipPanel 用法：始终带上 panelKind（对应 effect 语义类）。 */
export function buildTooltipUsageSnippet(vueProps: Record<string, unknown>): string {
  const panelKind = String(vueProps.panelKind ?? 'flotation').trim() || 'flotation';
  const attrs: string[] = [`panelKind="${panelKind}"`];

  const panelRadius = vueProps.panelRadius;
  if (panelRadius != null && String(panelRadius).trim()) {
    attrs.push(`panelRadius="${String(panelRadius).trim()}"`);
  }

  if (vueProps.widthMode === 'fixed' && vueProps.width != null) {
    attrs.push(`width-mode="fixed"`, `:width="${vueProps.width}"`);
  }

  if (vueProps.heightMode === 'fixed' && vueProps.height != null) {
    attrs.push(`height-mode="fixed"`, `:height="${vueProps.height}"`);
  }

  if (vueProps.scrollable === false) attrs.push(':scrollable="false"');
  if (vueProps.panelFlush === true) attrs.push('panel-flush');
  if (vueProps.panelMicroFloat === true) attrs.push('panel-micro-float');
  if (vueProps.panelLayoutMotion === true) attrs.push('panel-layout-motion');

  return `<EgTooltipPanel ${attrs.join(' ')} />`;
}
