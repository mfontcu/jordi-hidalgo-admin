import { Select as SelectPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import { usePortalContainer } from '../portal-container';
import { fieldBase } from './field-styles';

/*
 * The Flutter panel picks values in bottom sheets and has no dropdown, so the select follows the
 * kit: the trigger looks like a text field and the list is a Material 3 menu surface.
 */

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        fieldBase,
        'flex cursor-pointer items-center justify-between gap-2 text-left data-placeholder:text-on-surface-muted',
        '[&>span]:truncate',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <Icon name="keyboard_arrow_down_rounded" className="text-on-surface-variant" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  const container = usePortalContainer();
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        position={position}
        sideOffset={4}
        className={cn(
          'relative z-50 max-h-(--radix-select-content-available-height) min-w-[112px] overflow-hidden rounded-m3-small bg-surface-container py-2 text-on-surface shadow-m3-2',
          'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
          position === 'popper' && 'w-(--radix-select-trigger-width)',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn('px-3 py-2 text-label-md text-on-surface-variant', className)}
      {...props}
    />
  );
}

export function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex min-h-control cursor-pointer items-center gap-3 px-3 text-label-lg outline-none select-none',
        'before:absolute before:inset-0 before:bg-on-surface before:opacity-0',
        'data-highlighted:before:opacity-[var(--state-hover)] data-[state=checked]:text-accent-fg',
        'data-disabled:cursor-default data-disabled:text-disabled-content',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-auto">
        <Icon name="check_rounded" size={20} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn('my-2 h-px bg-outline-variant', className)} {...props} />;
}
