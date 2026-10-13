import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon, type IconName } from '../icons/icon';
import { Spinner } from './spinner';

const buttonVariants = cva(
  [
    'inline-flex h-control shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md px-3 whitespace-nowrap select-none',
    'text-body-strong transition-colors duration-150 ease-out',
    'disabled:cursor-default',
  ],
  {
    variants: {
      variant: {
        /** Filled ink button. */
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-disabled disabled:text-disabled-foreground disabled:hover:bg-disabled',
        /** Outlined button. */
        secondary:
          'border border-border bg-transparent text-foreground hover:bg-muted disabled:border-disabled disabled:text-disabled-foreground disabled:hover:bg-transparent',
        /** Filled danger button. */
        danger:
          'bg-destructive text-destructive-foreground disabled:bg-disabled disabled:text-disabled-foreground',
        /** Tonal success (activate a staff account). */
        successTonal:
          'bg-success-wash text-success hover:bg-muted disabled:bg-disabled disabled:text-disabled-foreground disabled:hover:bg-disabled',
        /** Tonal danger (deactivate a staff account). */
        dangerTonal:
          'bg-destructive-wash text-destructive hover:bg-muted disabled:bg-disabled disabled:text-disabled-foreground disabled:hover:bg-disabled',
        /** Text only. Same radius as the other controls. */
        text: 'bg-transparent text-foreground hover:bg-muted disabled:text-disabled-foreground disabled:hover:bg-transparent',
        /** Icon only. A 6px square, the control height on each side. Give it an aria-label. */
        icon: 'size-control p-0 text-muted-foreground hover:bg-muted disabled:text-disabled-foreground disabled:hover:bg-transparent',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Leading icon (20px). In the `icon` variant, the only content. */
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

  const leading = loading ? <Spinner size={20} /> : icon ? <Icon name={icon} size={20} /> : null;

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
