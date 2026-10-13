import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The panel's own scales (shared/ui/styles/index.css). Without them tailwind-merge reads
// `text-body` as a color and drops it next to `text-foreground`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['title', 'heading', 'body', 'body-strong', 'label', 'caption'],
      radius: ['xs', 'sm', 'md', 'lg', 'xl', 'pill'],
      spacing: ['control'],
    },
  },
});

/** Joins class names and resolves conflicting Tailwind utilities (the last one wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
