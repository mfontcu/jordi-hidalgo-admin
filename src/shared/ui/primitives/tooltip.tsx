import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { usePortalContainer } from '../portal-container';

/** Wrap the app once. Shows with no delay on hover. */
export function TooltipProvider({
  delayDuration = 0,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

/** Ink tooltip on a light page, paper tooltip in dark. Border, 8px radius, no shadow. */
export function TooltipContent({
  className,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  const container = usePortalContainer();
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={sideOffset}
        className={cn(
          'z-50 flex max-w-xs items-center rounded-lg border border-border bg-foreground px-2 py-1 text-caption text-background',
          'data-[state=delayed-open]:animate-fade-in data-[state=instant-open]:animate-fade-in data-[state=closed]:animate-fade-out',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
