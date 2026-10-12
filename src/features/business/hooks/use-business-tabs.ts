import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';

import {
  isBusinessDocTab,
  searchWithDoc,
  searchWithTab,
  tabOf,
  type BusinessTab,
} from '../model/business-tab';

/**
 * The section switcher of `/business`: `tab` and optional `doc` (legal/web) live in the URL,
 * replaced in place as Flutter's `updateCurrentRoute` does.
 */
export function useBusinessTabs() {
  const search = useSearch({ from: '/_authed/business' });
  const navigate = useNavigate({ from: '/business' });
  const tab = tabOf(search);
  const doc = isBusinessDocTab(tab) ? search.doc : undefined;

  const setTab = useCallback(
    (next: BusinessTab) => {
      if (next === tab) return;
      void navigate({
        search: searchWithTab(next, isBusinessDocTab(next) ? search.doc : undefined),
        replace: true,
      });
    },
    [navigate, search.doc, tab],
  );

  const setDoc = useCallback(
    (code: string) => {
      if (!isBusinessDocTab(tab) || code === doc) return;
      void navigate({ search: searchWithDoc(search, code), replace: true });
    },
    [doc, navigate, search, tab],
  );

  return { tab, doc, setTab, setDoc };
}
