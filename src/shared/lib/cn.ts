import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The panel's own scales (shared/ui/styles/index.css). Without them tailwind-merge reads
// `text-body-md` as a color and drops it next to `text-on-surface`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'headline-lg',
        'headline-md',
        'headline-sm',
        'title-lg',
        'title-md',
        'title-sm',
        'body-lg',
        'body-md',
        'body-sm',
        'label-lg',
        'label-md',
        'label-sm',
        'dialog-title',
        'button',
      ],
      radius: ['xs', 'sm', 'md', 'lg', 'xl', 'pill', 'm3-checkbox', 'm3-small'],
      shadow: ['m3-1', 'm3-2', 'm3-3'],
      spacing: ['control'],
    },
  },
});

/** Joins class names and resolves conflicting Tailwind utilities (the last one wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
