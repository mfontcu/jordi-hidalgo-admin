import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { fieldBase } from './field-styles';

/** Multi-line text field. Defaults to three rows, like `TextField(minLines: 3)`. */
export function Textarea({ className, rows = 3, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(fieldBase, 'resize-y', className)} {...props} />;
}
