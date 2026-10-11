import { useSyncExternalStore } from 'react';

import { DESKTOP_MIN_WIDTH, type ShellLayout, TABLET_MIN_WIDTH } from '../model/layout';

const tabletQuery = `(min-width: ${TABLET_MIN_WIDTH}px)`;
const desktopQuery = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(tabletQuery), window.matchMedia(desktopQuery)];
  for (const query of queries) query.addEventListener('change', onChange);
  return () => {
    for (const query of queries) query.removeEventListener('change', onChange);
  };
}

function layoutNow(): ShellLayout {
  if (window.matchMedia(desktopQuery).matches) return 'desktop';
  if (window.matchMedia(tabletQuery).matches) return 'tablet';
  return 'mobile';
}

/** The shell layout for the current window width (`shellLayoutFor`), updated on resize. */
export function useShellLayout(): ShellLayout {
  return useSyncExternalStore(subscribe, layoutNow);
}
