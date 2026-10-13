import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';

/**
 * 16px box with a 4px radius, centered in the control target. Checked fill is primary.
 * Supports `checked="indeterminate"`. Give it an accessible name (a `<label>` or `aria-label`).
 */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'group inline-flex size-control shrink-0 cursor-pointer items-center justify-center text-foreground',
        'disabled:cursor-default',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'flex size-4 items-center justify-center overflow-hidden rounded-[4px] border border-border bg-card text-primary-foreground',
          'group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary',
          'group-data-[state=indeterminate]:border-primary group-data-[state=indeterminate]:bg-primary',
          'group-aria-invalid:border-destructive',
          'group-aria-invalid:group-data-[state=checked]:border-destructive group-aria-invalid:group-data-[state=checked]:bg-destructive',
          'group-aria-invalid:group-data-[state=indeterminate]:border-destructive group-aria-invalid:group-data-[state=indeterminate]:bg-destructive',
          'group-disabled:border-disabled group-disabled:bg-disabled group-disabled:text-disabled-foreground',
          'group-disabled:group-data-[state=checked]:border-disabled group-disabled:group-data-[state=checked]:bg-disabled',
          'group-disabled:group-data-[state=indeterminate]:border-disabled group-disabled:group-data-[state=indeterminate]:bg-disabled',
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <Icon name="check_rounded" size={14} className="group-data-[state=indeterminate]:hidden" />
          <span className="hidden h-0.5 w-2 bg-current group-data-[state=indeterminate]:block" />
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  );
}
