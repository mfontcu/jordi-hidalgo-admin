import type { SVGProps } from 'react';

import { cn } from '@/shared/lib/cn';

import { iconPaths, type IconName } from './icons.gen';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  name: IconName;
  /** Size in px. Flutter's default icon size is 24; button icons are 18. */
  size?: number;
  /** Accessible name. Without it the icon is decorative and hidden from assistive technology. */
  label?: string;
};

/** A Material Symbols icon, drawn in the current text color. */
export function Icon({ name, size = 24, label, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill="currentColor"
      className={cn('shrink-0', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...props}
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

export type { IconName };

/** Every icon in icons.json, for pickers and the kit page. */
export const ICON_NAMES = Object.keys(iconPaths) as IconName[];
