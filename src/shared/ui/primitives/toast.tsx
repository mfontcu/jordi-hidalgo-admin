import type { CSSProperties, ReactNode } from 'react';
import { toast, Toaster as Sonner, type ToasterProps } from 'sonner';

/*
 * Toast: ink on a light page and paper in dark, with a border and an 8px radius.
 * One at a time, at the bottom right, about 360px wide, for 4 seconds.
 * It slides in and out from the right. Errors use the danger fill.
 */

const toastClassNames = {
  toast:
    'flex min-h-10 w-full items-start gap-3 rounded-lg border border-border bg-foreground px-4 py-3 text-body text-background',
  title: 'font-normal',
  actionButton: 'shrink-0 text-body-strong underline',
};

const errorToastClassName = 'border-destructive! bg-destructive! text-destructive-foreground!';

const toasterStyle = { '--width': '360px' } as CSSProperties;

/** Render once per subtree that shows toasts. `id` targets a specific toaster (see `toasterId`). */
export function Toaster({ style, ...props }: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      offset={16}
      mobileOffset={16}
      visibleToasts={1}
      duration={4000}
      toastOptions={{ unstyled: true, classNames: toastClassNames }}
      {...props}
      style={{ ...toasterStyle, ...style }}
    />
  );
}

type ToastOptions = {
  toasterId?: string;
  /** A button on the toast. The activity notice uses it to open the row's screen. */
  action?: { label: string; onClick: () => void };
};

/** Success or neutral notice. The message comes from the message files. */
export function showToast(message: ReactNode, options?: ToastOptions) {
  return toast(message, options);
}

/** Error notice. */
export function showErrorToast(message: string, options?: ToastOptions) {
  return toast(message, { ...options, className: errorToastClassName });
}
