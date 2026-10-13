import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

/** Paper surface: 8px radius, 1px border. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card text-card-foreground', className)}
      {...props}
    />
  );
}
