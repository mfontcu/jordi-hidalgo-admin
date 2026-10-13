import type { CSSProperties } from 'react';
import { toast, Toaster as Sonner, type ToasterProps } from 'sonner';

/*
 * Toast: ink on a light page and paper in dark, with a border and an 8px radius.
 * One at a time, at the bottom, for 4 seconds. Errors use the danger fill.
 */

const toastClassNames = {
  toast:
    'flex min-h-10 w-full items-center gap-3 rounded-lg border border-border bg-foreground px-4 py-3 text-body text-background',
  title: 'font-normal',
};

const errorToastClassName = 'border-destructive! bg-destructive! text-destructive-foreground!';

const toasterStyle = { '--width': 'calc(100vw - 32px)' } as CSSProperties;

/** Render once per subtree that shows toasts. `id` targets a specific toaster (see `toasterId`). */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      offset={16}
      mobileOffset={16}
      visibleToasts={1}
      duration={4000}
      style={toasterStyle}
      toastOptions={{ unstyled: true, classNames: toastClassNames }}
      {...props}
    />
  );
}

type ToastOptions = { toasterId?: string };

/** Success or neutral notice. The message comes from the message files. */
export function showToast(message: string, options?: ToastOptions) {
  return toast(message, options);
}

/** Error notice. */
export function showErrorToast(message: string, options?: ToastOptions) {
  return toast(message, { ...options, className: errorToastClassName });
}
