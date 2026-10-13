import { Popover as PopoverPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { usePortalContainer } from '../portal-container';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

/** Floating panel anchored to its trigger: card fill, 8px radius, border, no shadow. */
export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  const container = usePortalContainer();
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-[calc(100vw-32px)] rounded-lg border border-border bg-card p-4 text-foreground outline-none',
          'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
