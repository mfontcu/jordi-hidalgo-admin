/**
 * Shared look of text fields and the select trigger (app/theme.dart inputDecorationTheme): filled
 * with the surface color, 1px border, AdminRadius.md, and a 1.4px focus border. The text starts
 * 20px from the outer edge, as measured on the Flutter web fields (contentPadding 16 plus the
 * decorator's own inset), so the padding is 19px inside the 1px border.
 */
export const fieldBase = [
  'w-full min-w-0 rounded-md border border-border bg-surface px-[19px] py-(--input-padding-y)',
  // A hint that does not fit ends in an ellipsis, as InputDecoration.hintText does.
  'text-body-lg text-on-surface text-ellipsis placeholder:text-on-surface-muted',
  'outline-none transition-[border-color,box-shadow]',
  'focus-visible:border-focus focus-visible:shadow-[inset_0_0_0_0.4px_var(--focus)]',
  'aria-invalid:border-error aria-invalid:focus-visible:shadow-[inset_0_0_0_0.4px_var(--error)]',
  'disabled:cursor-default disabled:border-disabled-container disabled:text-disabled-content',
].join(' ');
