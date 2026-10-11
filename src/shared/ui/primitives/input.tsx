import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { fieldBase } from './field-styles';

/** Single-line text field. Mark an invalid value with `aria-invalid`. */
export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input type={type} className={cn(fieldBase, className)} {...props} />;
}
