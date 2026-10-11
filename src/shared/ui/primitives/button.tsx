import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon, type IconName } from '../icons/icon';
import { Spinner } from './spinner';

// Material state layer: the foreground color over the button at 8% (hover) or 10% (pressed).
const stateLayer =
  'relative isolate overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-[var(--state-hover)] active:before:opacity-[var(--state-pressed)] focus-visible:before:opacity-[var(--state-focus)] disabled:before:hidden';

// Flutter panel buttons (app/theme.dart and actions/admin_buttons.dart).
const buttonVariants = cva(
  [
    'inline-flex min-h-control shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap select-none',
    'disabled:cursor-default [&_svg]:pointer-events-none',
    stateLayer,
  ],
  {
    variants: {
      variant: {
        /** AdminPrimaryButton: filled, primary color. */
        primary:
          'rounded-md bg-primary px-[18px] text-button font-extrabold text-on-primary disabled:bg-disabled-container disabled:text-disabled-content',
        /** AdminSecondaryButton: outlined. */
        secondary:
          'rounded-md border border-border px-[18px] text-button font-extrabold text-on-surface disabled:border-disabled-container disabled:text-disabled-content',
        /** AdminDangerButton: filled, danger color. */
        danger:
          'rounded-md bg-danger-fg px-[18px] text-button font-extrabold text-surface disabled:bg-disabled-container disabled:text-disabled-content',
        /** ElevatedButton tinted with the success pair (activate a staff account). */
        successTonal:
          'rounded-md bg-success-bg px-[18px] text-button font-extrabold text-success-fg disabled:bg-disabled-container disabled:text-disabled-content',
        /** ElevatedButton tinted with the danger pair (deactivate a staff account). */
        dangerTonal:
          'rounded-md bg-danger-bg px-[18px] text-button font-extrabold text-danger-fg disabled:bg-disabled-container disabled:text-disabled-content',
        /** AdminTextButton: text only, brand blue, stadium shape. */
        text: 'rounded-pill px-3 text-button font-bold text-text-action disabled:text-disabled-content',
        /** IconButton: round, icon only. Give it an aria-label. */
        icon: 'size-control rounded-pill text-on-surface-variant disabled:text-disabled-content',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Leading icon (18px). In the `icon` variant, the only content (24px). */
    icon?: IconName;
    /** Shows a spinner in place of the icon and disables the button. */
    loading?: boolean;
    /** Renders the child element (for example a link) with the button's look. */
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  icon,
  loading = false,
  asChild = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant }), className);

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  const iconSize = variant === 'icon' ? 24 : 18;
  const leading = loading ? <Spinner size={18} /> : icon ? <Icon name={icon} size={iconSize} /> : null;

  return (
    <button
      type={type}
      className={classes}
      disabled={(disabled ?? false) || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {leading}
      {children}
    </button>
  );
}

export { buttonVariants };
