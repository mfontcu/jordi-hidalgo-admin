import { Select as SelectPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import { usePortalContainer } from '../portal-container';
import { fieldBase } from './field-styles';

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
        'flex cursor-pointer items-center justify-between gap-2 text-left data-placeholder:text-muted-foreground',
        '[&>span]:truncate',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <Icon name="keyboard_arrow_down_rounded" size={20} className="text-muted-foreground" />
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
          'relative z-50 max-h-(--radix-select-content-available-height) min-w-[112px] overflow-hidden rounded-lg border border-border bg-card py-1 text-foreground',
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
      className={cn('px-3 py-1.5 text-label text-muted-foreground', className)}
      {...props}
    />
  );
}

export function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex min-h-control cursor-pointer items-center gap-3 px-3 text-body outline-none select-none',
        'data-highlighted:bg-muted data-[state=checked]:text-foreground',
        'data-disabled:cursor-default data-disabled:text-disabled-foreground',
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
  return <SelectPrimitive.Separator className={cn('my-1 h-px bg-border', className)} {...props} />;
}
