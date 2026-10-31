import { Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root> & {
  /**
   * Kept so existing call sites compile. `adaptive` draws the same switch as `material`:
   * a 36×20 track whose checked fill is primary and whose off state is outlined. The thumb
   * does not grow on press.
   */
  tone?: 'material' | 'adaptive';
};

/** 36×20 switch. Give it an accessible name (a `<label>` or `aria-label`). */
export function Switch({ className, tone = 'material', ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-tone={tone}
      className={cn(
        'group relative inline-flex h-control w-9 shrink-0 cursor-pointer items-center justify-center',
        'disabled:cursor-default',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          // Off reads as available: an outlined track with a filled thumb. Disabled drops the
          // outline and greys both states, so the two never look alike.
          'relative block h-5 w-9 rounded-full bg-card ring-1 ring-muted-foreground ring-inset',
          'transition-colors duration-150 ease-out',
          'group-data-[state=checked]:bg-primary group-data-[state=checked]:ring-transparent',
          'group-disabled:bg-disabled group-disabled:ring-transparent group-disabled:group-data-[state=checked]:bg-disabled',
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'absolute top-0.5 left-0.5 block size-4 rounded-full border border-transparent bg-muted-foreground',
            'transition-transform duration-150 ease-out',
            'data-[state=checked]:translate-x-4 data-[state=checked]:bg-primary-foreground',
            'group-disabled:border-border group-disabled:bg-card group-disabled:data-[state=checked]:bg-card',
          )}
        />
      </span>
    </SwitchPrimitive.Root>
  );
}
