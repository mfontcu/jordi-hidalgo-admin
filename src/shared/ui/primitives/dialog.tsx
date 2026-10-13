import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { usePortalContainer } from '../portal-container';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/** Modal scrim: black at 40%. */
export function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className,
      )}
      {...props}
    />
  );
}

/** Centered dialog: 8px radius, 20px padding, at most 480px wide. */
export function DialogContent({
  className,
  overlayClassName,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { overlayClassName?: string }) {
  const container = usePortalContainer();
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto',
          'rounded-lg bg-card p-5 text-foreground outline-none',
          'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-2', className)} {...props} />;
}

/** Actions sit in a row at their own width. */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-5 flex flex-wrap items-center justify-end gap-3', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-heading text-foreground', className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn('text-body text-muted-foreground', className)} {...props} />
  );
}
