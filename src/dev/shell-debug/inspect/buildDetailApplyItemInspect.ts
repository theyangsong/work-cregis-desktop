import type { InspectPropertyItem } from './buildElementInspectInfo';

function readRowText(row: Element, classFragment: string): string {
  const node = row.querySelector(`[class*="${classFragment}"]`);
  return node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/** Apply_Item（Detail `itemRow` 区域）语义属性；由 R4 区域表调用。 */
export function buildDetailApplyItemProps(row: Element): InspectPropertyItem[] {
  const title = readRowText(row, 'itemTitleText');
  const value = readRowText(row, 'itemValueText');
  const tagText = row.querySelector('.eds-tag')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  const props: InspectPropertyItem[] = [
    {
      label: '标题',
      value: title || '—',
      token: null,
      copyLine: title ? `title="${title}"` : '',
    },
    {
      label: '值',
      value: value || '—',
      token: null,
      copyLine: value ? `value="${value}"` : '',
    },
  ];

  if (tagText) {
    props.push({
      label: '标签',
      value: tagText,
      token: null,
      copyLine: `tag="${tagText}"`,
    });
  }

  return props;
}
