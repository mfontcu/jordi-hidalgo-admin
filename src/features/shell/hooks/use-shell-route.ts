import { useLocation, useMatches } from '@tanstack/react-router';

import type { MessageId } from '@/shared/i18n';

import { SHELL_HEADERS, type ShellScreen } from '../model/header';
import { activeSectionFor, type SectionPath } from '../model/sections';

export type ScreenHeader = { title: MessageId; subtitle: MessageId; breadcrumbs?: readonly MessageId[] };

// Typed here, so a header naming a missing message is a compile error.
const HEADERS: Record<ShellScreen, ScreenHeader> = SHELL_HEADERS;

/** The header of the current screen, from its route's `staticData.screen`; none on a 404. */
export function useShellHeader(): ScreenHeader | undefined {
  const screen = useMatches({
    select: (matches) => matches.findLast((match) => match.staticData.screen)?.staticData.screen,
  });
  return screen ? HEADERS[screen] : undefined;
}

/** The highlighted sidebar section: `?sidebar=` or the path prefix. */
export function useActiveSection(): SectionPath {
  return useLocation({
    select: (location) =>
      activeSectionFor(location.pathname, (location.search as { sidebar?: unknown }).sidebar),
  });
}
