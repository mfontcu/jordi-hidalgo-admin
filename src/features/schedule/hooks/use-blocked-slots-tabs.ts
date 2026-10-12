import { useNavigate, useSearch } from '@tanstack/react-router';

import { searchWithTab, tabOf, type BlockedSlotTab } from '../model/blocked-slots-search';

/**
 * The tabs of `/schedule/blocked-slots` (`_BlockedSlotsSectionSwitcher`): the tab lives in the URL,
 * replaced in place as Flutter's `updateCurrentRoute` does; each tab opens without filters.
 */
export function useBlockedSlotsTabs() {
  const search = useSearch({ from: '/_authed/schedule/blocked-slots/' });
  const navigate = useNavigate({ from: '/schedule/blocked-slots/' });
  const tab = tabOf(search);
  return {
    tab,
    setTab: (next: BlockedSlotTab) => {
      if (next !== tab) void navigate({ search: searchWithTab(next), replace: true });
    },
  };
}
