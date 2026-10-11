/** How the kit page shows the components: one mode, or light and dark side by side. */
export const KIT_MODES = ['both', 'light', 'dark'] as const;

export type KitMode = (typeof KIT_MODES)[number];

/** Color tokens shown as swatches, grouped as in the Flutter theme. */
export const KIT_COLOR_GROUPS = {
  colorScheme: [
    'background',
    'surface',
    'on-surface',
    'on-surface-variant',
    'on-surface-secondary',
    'on-surface-muted',
    'primary',
    'on-primary',
    'primary-container',
    'secondary',
    'error',
    'outline',
    'outline-variant',
    'border',
    'surface-container',
    'surface-container-highest',
    'inverse-surface',
    'on-inverse-surface',
    'focus',
  ],
  adminExtension: [
    'surface-muted',
    'row-hover',
    'fade-edge',
    'brand-red',
    'brand-blue',
    'success-bg',
    'success-fg',
    'warning-bg',
    'warning-fg',
    'danger-bg',
    'danger-fg',
    'info-bg',
    'info-fg',
  ],
  derived: [
    'content-secondary',
    'content-muted',
    'accent-fg',
    'selection-bg',
    'selection-border',
    'selection-bg-strong',
    'icon-accent-bg',
    'unsaved-fg',
    'unsaved-bg',
  ],
} as const;

/** Semantic chip pairs (adminAppointmentStatusColors). */
export const KIT_TONES = ['success', 'warning', 'danger', 'info'] as const;

export const KIT_TYPE_SCALE = [
  'headline-lg',
  'headline-md',
  'headline-sm',
  'title-lg',
  'title-md',
  'title-sm',
  'body-lg',
  'body-md',
  'body-sm',
  'label-lg',
  'label-md',
  'label-sm',
  'button',
] as const;

export const KIT_SPACING = [
  ['xs', 4],
  ['sm', 8],
  ['md', 12],
  ['lg', 16],
  ['xl', 24],
  ['xxl', 32],
] as const;

export const KIT_RADIUS = [
  ['xs', 8],
  ['sm', 12],
  ['md', 16],
  ['lg', 20],
  ['xl', 24],
  ['pill', 999],
] as const;
