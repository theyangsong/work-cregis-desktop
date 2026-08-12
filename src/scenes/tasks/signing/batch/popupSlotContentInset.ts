/** 对齐 eds-desktop popupDocCustomize · popupCustomContentInsetPresets */
export const POPUP_SLOT_CONTENT_INSET_PRESETS = {
  lg: 'var(--spacing-3)',
  md: 'var(--spacing-2)',
  sm: 'var(--spacing-1)',
  xs: 'var(--spacing-0)',
} as const;

export type PopupSlotContentInsetPreset = keyof typeof POPUP_SLOT_CONTENT_INSET_PRESETS;
