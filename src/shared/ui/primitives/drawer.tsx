import { Dialog as DrawerPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { usePortalContainer } from '../portal-container';
import { DialogOverlay } from './dialog';

export const Drawer = DrawerPrimitive.Root;
export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;
export const DrawerTitle = DrawerPrimitive.Title;

/**
 * Mobile navigation drawer. Slides in from the left over the scrim. A border stands in for the
 * old elevation. The content draws its own background. Give it a DrawerTitle, visible or not.
 * On open, focus goes to the drawer itself rather than to its first control.
 */
export function DrawerContent({
  className,
  children,
  onOpenAutoFocus,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Content>) {
  const container = usePortalContainer();
  return (
    <DrawerPrimitive.Portal container={container}>
      <DialogOverlay />
      <DrawerPrimitive.Content
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[304px] max-w-[calc(100vw-56px)] flex-col border-r border-sidebar-border outline-none',
          'data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out',
          className,
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}
