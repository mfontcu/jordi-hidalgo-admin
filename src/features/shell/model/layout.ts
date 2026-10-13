/**
 * Shell layout by window width: under 768px a drawer and the mobile header; 768–1023px a 60px
 * icon rail that opens the labeled sidebar as an overlay; from 1024px the 240px sidebar, which
 * staff can collapse.
 */
export type ShellLayout = 'mobile' | 'tablet' | 'desktop';

export const TABLET_MIN_WIDTH = 768;
export const DESKTOP_MIN_WIDTH = 1024;

export function shellLayoutFor(width: number): ShellLayout {
  if (width < TABLET_MIN_WIDTH) return 'mobile';
  if (width < DESKTOP_MIN_WIDTH) return 'tablet';
  return 'desktop';
}
