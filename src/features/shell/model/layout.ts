/**
 * Shell layout by window width (admin_shell.dart): under 700px a drawer and the mobile header;
 * 700–1099px the compact sidebar, which cannot expand; from 1100px the full sidebar, which staff
 * can collapse.
 */
export type ShellLayout = 'mobile' | 'tablet' | 'desktop';

export const TABLET_MIN_WIDTH = 700;
export const DESKTOP_MIN_WIDTH = 1100;

export function shellLayoutFor(width: number): ShellLayout {
  if (width < TABLET_MIN_WIDTH) return 'mobile';
  if (width < DESKTOP_MIN_WIDTH) return 'tablet';
  return 'desktop';
}
