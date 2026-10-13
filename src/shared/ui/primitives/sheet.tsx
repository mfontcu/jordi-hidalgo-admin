import { Dialog as SheetPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { usePortalContainer } from '../portal-container';
import { DialogOverlay } from './dialog';

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

/**
 * Bottom sheet: 8px radius on the top corners, full width under 768px and at most 480px from
 * there. No drag handle. `handle` stays on the props so existing call sites still type-check.
 */
export function SheetContent({
  className,
  overlayClassName,
  children,
  handle: _handle = true, // eslint-disable-line @typescript-eslint/no-unused-vars -- kept off the DOM; call sites still pass it
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & { handle?: boolean; overlayClassName?: string }) {
  const container = usePortalContainer();
  return (
    <SheetPrimitive.Portal container={container}>
      <DialogOverlay className={overlayClassName} />
      <SheetPrimitive.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-dvh w-full flex-col overflow-y-auto min-[768px]:max-w-[480px]',
          'rounded-t-lg bg-card text-foreground outline-none',
          'data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out',
          className,
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

/** Body of a sheet: 20px padding. */
export function SheetBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col p-5', className)} {...props} />;
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mb-5 flex flex-col gap-2', className)} {...props} />;
}

export function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-5 flex gap-3 [&>*]:flex-1', className)} {...props} />;
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn('text-heading text-foreground', className)} {...props} />;
}

export function SheetDescription({ className, ...props }: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description className={cn('text-body text-muted-foreground', className)} {...props} />
  );
}
