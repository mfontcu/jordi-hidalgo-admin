/**
 * Shared look of text fields and the select trigger (app/theme.dart inputDecorationTheme): filled
 * with the surface color, 1px border, AdminRadius.md, 16px padding, and a 1.4px focus border.
 */
export const fieldBase = [
  'w-full min-w-0 rounded-md border border-border bg-surface px-4 py-(--input-padding-y)',
  'text-body-lg text-on-surface placeholder:text-on-surface-muted',
  'outline-none transition-[border-color,box-shadow]',
  'focus-visible:border-focus focus-visible:shadow-[inset_0_0_0_0.4px_var(--focus)]',
  'aria-invalid:border-error aria-invalid:focus-visible:shadow-[inset_0_0_0_0.4px_var(--error)]',
  'disabled:cursor-default disabled:border-disabled-container disabled:text-disabled-content',
].join(' ');
