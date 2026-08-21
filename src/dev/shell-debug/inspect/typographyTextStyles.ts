/** Desktop typography Text Styles — labels / class names align Figma / DS spec/text/styles.json */
export type TypographyTextStyleRole = {
  label: string;
  className: string;
  sizeToken: string;
  weightToken: string;
  lineHeightToken: string;
};

export const TYPOGRAPHY_TEXT_STYLE_ROLES: TypographyTextStyleRole[] = [
  {
    label: 'Display',
    className: 'typography-display',
    sizeToken: '--eds-display-size',
    weightToken: '--eds-display-weight',
    lineHeightToken: '--eds-display-line-height',
  },
  {
    label: 'Headline',
    className: 'typography-headline',
    sizeToken: '--eds-headline-size',
    weightToken: '--eds-headline-weight',
    lineHeightToken: '--eds-headline-line-height',
  },
  {
    label: 'Title',
    className: 'typography-title',
    sizeToken: '--eds-title-size',
    weightToken: '--eds-title-weight',
    lineHeightToken: '--eds-title-line-height',
  },
  {
    label: 'Body Large',
    className: 'typography-body-large',
    sizeToken: '--eds-body-large-size',
    weightToken: '--eds-body-large-weight',
    lineHeightToken: '--eds-body-large-line-height',
  },
  {
    label: 'Body Large Strong',
    className: 'typography-body-large-strong',
    sizeToken: '--eds-body-large-strong-size',
    weightToken: '--eds-body-large-strong-weight',
    lineHeightToken: '--eds-body-large-strong-line-height',
  },
  {
    label: 'Body Medium',
    className: 'typography-body-medium',
    sizeToken: '--eds-body-medium-size',
    weightToken: '--eds-body-medium-weight',
    lineHeightToken: '--eds-body-medium-line-height',
  },
  {
    label: 'Body Medium Strong',
    className: 'typography-body-medium-strong',
    sizeToken: '--eds-body-medium-strong-size',
    weightToken: '--eds-body-medium-strong-weight',
    lineHeightToken: '--eds-body-medium-strong-line-height',
  },
  {
    label: 'Body Small',
    className: 'typography-body-small',
    sizeToken: '--eds-body-small-size',
    weightToken: '--eds-body-small-weight',
    lineHeightToken: '--eds-body-small-line-height',
  },
  {
    label: 'Body Small Strong',
    className: 'typography-body-small-strong',
    sizeToken: '--eds-body-small-strong-size',
    weightToken: '--eds-body-small-strong-weight',
    lineHeightToken: '--eds-body-small-strong-line-height',
  },
  {
    label: 'Footnote',
    className: 'typography-footnote',
    sizeToken: '--eds-footnote-size',
    weightToken: '--eds-footnote-weight',
    lineHeightToken: '--eds-footnote-line-height',
  },
  {
    label: 'Footnote Strong',
    className: 'typography-footnote-strong',
    sizeToken: '--eds-footnote-strong-size',
    weightToken: '--eds-footnote-strong-weight',
    lineHeightToken: '--eds-footnote-strong-line-height',
  },
  {
    label: 'Bar',
    className: 'typography-bar',
    sizeToken: '--eds-bar-size',
    weightToken: '--eds-bar-weight',
    lineHeightToken: '--eds-bar-line-height',
  },
];
