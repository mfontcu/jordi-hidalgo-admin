/** How the kit page shows the components: one mode, or light and dark side by side. */
export const KIT_MODES = ['both', 'light', 'dark'] as const;

export type KitMode = (typeof KIT_MODES)[number];

/** Semantic color tokens, grouped the way the system uses them. */
export const KIT_COLOR_GROUPS = {
  surface: [
    'background',
    'foreground',
    'card',
    'card-foreground',
    'muted',
    'muted-foreground',
    'border',
    'ring',
  ],
  action: ['primary', 'primary-foreground', 'primary-hover', 'brand', 'disabled', 'disabled-foreground'],
  status: [
    'destructive',
    'destructive-foreground',
    'destructive-wash',
    'success',
    'success-wash',
    'warning',
    'warning-wash',
    'selection',
    'selection-wash',
  ],
  sidebar: [
    'sidebar',
    'sidebar-foreground',
    'sidebar-muted',
    'sidebar-border',
    'sidebar-active',
    'sidebar-hover',
  ],
} as const;

/** Status washes shown as pills. */
export const KIT_TONES = ['success', 'warning', 'danger', 'info'] as const;

export const KIT_TYPE_SCALE = ['title', 'heading', 'body', 'body-strong', 'label', 'caption'] as const;

export const KIT_SPACING = [
  ['xs', 4],
  ['sm', 8],
  ['md', 12],
  ['lg', 16],
  ['xl', 24],
  ['xxl', 32],
] as const;

export const KIT_RADIUS = [
  ['sm', 6],
  ['md', 6],
  ['lg', 8],
  ['xl', 8],
  ['full', 999],
] as const;
