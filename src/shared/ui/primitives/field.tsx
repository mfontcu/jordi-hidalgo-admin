import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

/** Label above a field: bold foreground text (the label Text the Flutter forms place over a TextFormField). */
export function Label({ className, ...props }: ComponentProps<'label'>) {
  // The caller links the control with `htmlFor`.
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  return <label className={cn('block font-bold text-foreground', className)} {...props} />;
}

/**
 * A field's validation message (InputDecoration errorText): bodySmall in the error color, aligned
 * with the field's 16px content padding. Link it to the field with `aria-describedby`.
 */
export function FieldError({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('mt-1 px-4 text-caption text-destructive', className)} {...props} />;
}
