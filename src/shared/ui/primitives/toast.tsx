import type { CSSProperties } from 'react';
import { toast, Toaster as Sonner, type ToasterProps } from 'sonner';

/*
 * Floating Material snackbar (admin_snackbar.dart): inverse-surface background, full width minus
 * 16px margins, at the bottom, one at a time, 4 seconds. Errors use the danger color.
 */

const toastClassNames = {
  toast:
    'flex min-h-12 w-full items-center gap-3 rounded-m3-small bg-inverse-surface px-4 py-3.5 text-body-md text-on-inverse-surface shadow-m3-3',
  title: 'font-normal',
};

// Not toast.error: Sonner would add a type icon, and the Flutter snackbar has none.
const errorToastClassName = 'bg-danger-fg!';

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

/** showAdminSuccessSnackBar. The message comes from the message files. */
export function showToast(message: string, options?: ToastOptions) {
  return toast(message, options);
}

/** showAdminErrorSnackBar. */
export function showErrorToast(message: string, options?: ToastOptions) {
  return toast(message, { ...options, className: errorToastClassName });
}
