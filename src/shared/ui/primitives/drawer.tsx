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
 * Modal navigation drawer (Material Drawer as the admin shell uses it): slides in from the left
 * over the scrim, 304px wide (Material's default drawer width), square corners, full height.
 * The content draws its own background. Give it a DrawerTitle, visible or not. On open, focus
 * goes to the drawer itself, as in Flutter, rather than to its first control.
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
          'fixed inset-y-0 left-0 z-50 flex w-[304px] max-w-[calc(100vw-56px)] flex-col shadow-m3-3 outline-none',
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
