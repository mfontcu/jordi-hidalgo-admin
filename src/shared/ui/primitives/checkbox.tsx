import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';

/**
 * Material 3 checkbox: an 18px box with a 2px border inside a round target of the control height.
 * The state layer uses on-surface when unchecked and primary when checked. Supports
 * `checked="indeterminate"`; give it an accessible name (a `<label>` or `aria-label`).
 */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'group relative inline-flex size-control shrink-0 cursor-pointer items-center justify-center rounded-pill text-on-surface',
        'before:absolute before:inset-0 before:rounded-pill before:bg-current before:opacity-0 before:transition-opacity',
        'hover:before:opacity-[var(--state-hover)] focus-visible:before:opacity-[var(--state-focus)] active:before:opacity-[var(--state-pressed)]',
        'data-[state=checked]:text-primary data-[state=indeterminate]:text-primary',
        'aria-invalid:text-error disabled:cursor-default disabled:before:hidden',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'relative flex size-[18px] items-center justify-center rounded-m3-checkbox border-2 border-on-surface-variant text-on-primary',
          'group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary',
          'group-data-[state=indeterminate]:border-primary group-data-[state=indeterminate]:bg-primary',
          'group-aria-invalid:border-error group-aria-invalid:group-data-[state=checked]:bg-error',
          'group-disabled:border-disabled-content group-disabled:group-data-[state=checked]:border-transparent group-disabled:group-data-[state=checked]:bg-disabled-content',
          'group-disabled:group-data-[state=indeterminate]:border-transparent group-disabled:group-data-[state=indeterminate]:bg-disabled-content group-disabled:text-surface',
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <Icon name="check_rounded" size={18} className="group-data-[state=indeterminate]:hidden" />
          <span className="hidden h-0.5 w-2.5 rounded-pill bg-current group-data-[state=indeterminate]:block" />
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  );
}
