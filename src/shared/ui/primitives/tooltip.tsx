import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { usePortalContainer } from '../portal-container';

/** Wrap the app once. Like Flutter's Tooltip, it shows with no delay on hover. */
export function TooltipProvider({
  delayDuration = 0,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Material tooltip (Flutter defaults): grey 90% in light mode and white 90% in dark mode, 4px
 * radius, below the target; 12px text and 24px height on desktop, 14px and 32px on touch.
 */
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
          'z-50 flex min-h-6 max-w-xs items-center rounded-m3-small bg-tooltip-bg px-2 py-1 text-body-sm text-tooltip-fg',
          'pointer-coarse:min-h-8 pointer-coarse:px-4 pointer-coarse:text-body-md',
          'data-[state=delayed-open]:animate-fade-in data-[state=instant-open]:animate-fade-in data-[state=closed]:animate-fade-out',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
