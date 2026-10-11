import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

/** Material Card as app/theme.dart cardTheme draws it: surface, no elevation, 1px border, AdminRadius.lg. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-lg border border-border bg-surface', className)} {...props} />;
}
