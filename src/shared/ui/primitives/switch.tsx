import { Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root> & {
  /**
   * `material` is the kit switch. `adaptive` is Flutter's `Switch.adaptive` on the recurring-rule
   * form: Cupertino green when on, white thumb.
   */
  tone?: 'material' | 'adaptive';
};

/**
 * Material 3 switch (Flutter's `Switch`): a 52x32 track inside a 60px-wide target of the control
 * height. Off: outlined track and a 16px thumb. On: primary track and a 24px thumb. The thumb grows
 * to 28px while pressed. Give it an accessible name (a `<label>` or `aria-label`).
 */
export function Switch({ className, tone = 'material', ...props }: SwitchProps) {
  const adaptive = tone === 'adaptive';
  return (
    <SwitchPrimitive.Root
      data-tone={adaptive ? 'adaptive' : undefined}
      className={cn(
        'group relative inline-flex h-control w-[60px] shrink-0 cursor-pointer items-center justify-center outline-none',
        'disabled:cursor-default',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'relative block h-8 w-[52px] rounded-pill border-2 transition-colors duration-200',
          'border-outline bg-surface-container-highest',
          adaptive
            ? 'group-data-[state=checked]:border-switch-adaptive group-data-[state=checked]:bg-switch-adaptive'
            : 'group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary',
          'group-disabled:border-disabled-container group-disabled:bg-[color-mix(in_srgb,var(--surface-container-highest)_12%,transparent)]',
          'group-disabled:group-data-[state=checked]:border-transparent group-disabled:group-data-[state=checked]:bg-disabled-container',
          'group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-focus',
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'absolute top-1/2 left-[14px] block size-4 -translate-x-1/2 -translate-y-1/2 rounded-pill',
            'transition-[left,width,height,background-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
            'bg-outline group-hover:bg-on-surface-variant',
            'data-[state=checked]:left-[34px] data-[state=checked]:size-6',
            adaptive
              ? 'data-[state=checked]:bg-switch-adaptive-thumb group-hover:data-[state=checked]:bg-switch-adaptive-thumb'
              : 'data-[state=checked]:bg-on-primary group-hover:data-[state=checked]:bg-primary-container',
            'group-active:size-7 group-active:data-[state=checked]:size-7',
            'group-disabled:bg-disabled-content group-disabled:data-[state=checked]:bg-surface group-disabled:group-active:size-4 group-disabled:group-active:data-[state=checked]:size-6',
            // State layer: a 40px circle around the thumb.
            adaptive
              ? 'text-on-surface data-[state=checked]:text-switch-adaptive'
              : 'text-on-surface data-[state=checked]:text-primary',
            'before:absolute before:top-1/2 before:left-1/2 before:size-10 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-pill before:bg-current before:opacity-0 before:transition-opacity',
            'group-hover:before:opacity-[var(--state-hover)] group-focus-visible:before:opacity-[var(--state-focus)] group-active:before:opacity-[var(--state-pressed)] group-disabled:before:hidden',
          )}
        />
      </span>
    </SwitchPrimitive.Root>
  );
}
