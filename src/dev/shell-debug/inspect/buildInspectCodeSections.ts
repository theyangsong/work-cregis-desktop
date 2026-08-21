import type { InspectCodeSection } from './buildIconInspect';
import type { InspectPropertyItem } from './buildElementInspectInfo';
import { canInspectAsText } from './buildTextInspect';

const COMPONENT_SECTION_SKIP = new Set(['布局', '样式', '字体排版']);

function sectionFromItems(title: string, items: InspectPropertyItem[]): InspectCodeSection | null {
  if (items.length === 0) return null;
  return {
    title,
    content: items.map((item) => item.copyLine).join('\n'),
  };
}

/**
 * 全组件统一代码区块：
 * - Text：字体排版优先（专用 builder），布局用 Text 区块或 Dev Mode 回退
 * - 其它 DS 组件：Dev Mode 布局 + 样式（buildDeclaredInspectCode @ style target）
 * - Icon / Crypto / Avatar：仅追加 SVG 等专用块
 */
export function buildInspectCodeSections(
  element: Element,
  _preview: Element,
  componentSections: InspectCodeSection[] | undefined,
  declaredCode: { layout: InspectPropertyItem[]; styleItems: InspectPropertyItem[] },
): InspectCodeSection[] {
  const sections: InspectCodeSection[] = [];
  const isText = canInspectAsText(element);

  if (isText && componentSections) {
    const textLayout = componentSections.find((section) => section.title === '布局');
    const typography = componentSections.find((section) => section.title === '字体排版');

    const layoutSection = textLayout ?? sectionFromItems('布局', declaredCode.layout);
    if (layoutSection) sections.push(layoutSection);
    if (typography) sections.push(typography);
  } else {
    const layoutSection = sectionFromItems('布局', declaredCode.layout);
    if (layoutSection) sections.push(layoutSection);

    const styleSection = sectionFromItems('样式', declaredCode.styleItems);
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
