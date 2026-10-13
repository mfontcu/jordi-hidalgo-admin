/**
 * Shared look of text fields and the select trigger: card fill, 1px border, 6px radius,
 * 12px horizontal and 8px vertical padding. Focus is the global 2px ring.
 */
export const fieldBase = [
  'w-full min-w-0 rounded-md border border-border bg-card px-3 py-2',
  'text-body text-foreground text-ellipsis placeholder:text-muted-foreground',
  'transition-colors duration-150 ease-out',
  'aria-invalid:border-destructive',
  'disabled:cursor-default disabled:border-disabled disabled:text-disabled-foreground',
].join(' ');
