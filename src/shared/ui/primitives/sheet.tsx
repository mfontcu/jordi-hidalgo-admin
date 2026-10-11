import { Dialog as SheetPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { usePortalContainer } from '../portal-container';
import { DialogOverlay } from './dialog';

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

/**
 * Modal bottom sheet (showAdminModalBottomSheet): rises from the bottom with a drag handle, surface
 * color, AdminRadius.xl top corners, full width on narrow screens and at most 720px wide otherwise.
 */
export function SheetContent({
  className,
  children,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content>) {
  const container = usePortalContainer();
  return (
    <SheetPrimitive.Portal container={container}>
      <DialogOverlay />
      <SheetPrimitive.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-dvh w-full flex-col overflow-y-auto min-[700px]:max-w-[720px]',
          'rounded-t-xl bg-surface text-on-surface outline-none',
          'data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out',
          className,
        )}
        {...props}
      >
        {/* Material 3 drag handle: 32x4, on-surface-variant at 40%, in a 48px-high area. */}
        <div aria-hidden className="flex h-12 shrink-0 items-center justify-center">
          <div className="h-1 w-8 rounded-pill bg-on-surface-variant/40" />
        </div>
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

/** Body of a sheet (AdminSheetScaffold): 20px side and bottom padding, 8px under the handle. */
export function SheetBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col px-5 pt-2 pb-5', className)} {...props} />;
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mb-5 flex flex-col gap-2', className)} {...props} />;
}

export function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-5 flex gap-3 [&>*]:flex-1', className)} {...props} />;
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      className={cn('text-dialog-title font-black text-on-surface', className)}
      {...props}
    />
  );
}

export function SheetDescription({ className, ...props }: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn('text-body-md leading-[1.5] text-content-secondary', className)}
      {...props}
    />
  );
}
