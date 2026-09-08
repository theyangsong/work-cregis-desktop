import type { InspectCodeSection } from './buildIconInspect';
import type { InspectPropertyItem } from './buildElementInspectInfo';
import { buildEffectSemanticCodeSections } from './buildEffectSemanticInspect';
import { canInspectAsText } from './buildTextInspect';

const COMPONENT_SECTION_SKIP = new Set(['布局', '样式', '字体排版']);

function sectionFromItems(title: string, items: InspectPropertyItem[]): InspectCodeSection | null {
  if (items.length === 0) return null;
  return {
    title,
    content: items.map((item) => item.copyLine).join('\n'),
  };
}

function resolveInspectableSection(
  title: string,
  declaredItems: InspectPropertyItem[],
  componentSections: InspectCodeSection[] | undefined,
  effectSections: InspectCodeSection[] | undefined,
): InspectCodeSection | null {
  const effectSection = effectSections?.find((section) => section.title === title);
  if (effectSection?.content.trim()) return effectSection;

  const componentSection = componentSections?.find((section) => section.title === title);
  if (componentSection?.content.trim()) return componentSection;

  return sectionFromItems(title, declaredItems);
}

/**
 * 全组件统一代码区块：
 * - 节点挂 effect-* 语义类时，布局/样式引用 spec（effect/semantic.json），覆盖项单独列出
 * - Text：字体排版优先；其它走 declared 或组件专用块
 */
export function buildInspectCodeSections(
  element: Element,
  _preview: Element,
  componentSections: InspectCodeSection[] | undefined,
  declaredCode: { layout: InspectPropertyItem[]; styleItems: InspectPropertyItem[] },
): InspectCodeSection[] {
  const sections: InspectCodeSection[] = [];
  const isText = canInspectAsText(element);
  const effectSections = buildEffectSemanticCodeSections(element) ?? undefined;

  if (isText && componentSections) {
    const layoutSection = resolveInspectableSection('布局', declaredCode.layout, componentSections, effectSections);
    const typography = componentSections.find((section) => section.title === '字体排版');
    if (layoutSection) sections.push(layoutSection);
    if (typography?.content.trim()) sections.push(typography);
  } else {
    const layoutSection = resolveInspectableSection('布局', declaredCode.layout, componentSections, effectSections);
    const styleSection = resolveInspectableSection('样式', declaredCode.styleItems, componentSections, effectSections);
    if (layoutSection) sections.push(layoutSection);
    if (styleSection) sections.push(styleSection);
  }

  if (componentSections) {
    for (const section of componentSections) {
      if (COMPONENT_SECTION_SKIP.has(section.title)) continue;
      if (!section.content.trim()) continue;
      sections.push(section);
    }
  }

  return sections;
}

export function buildFlowCodeSections(code: {
  layout: InspectPropertyItem[];
  style: InspectPropertyItem[];
}): InspectCodeSection[] {
  const sections: InspectCodeSection[] = [];
  const layout = sectionFromItems('布局', code.layout);
  const style = sectionFromItems('样式', code.style);
  if (layout) sections.push(layout);
  if (style) sections.push(style);
  return sections;
}
