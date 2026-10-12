export const BUSINESS_TABS = ['info', 'booking', 'notifications', 'legal', 'web', 'gallery'] as const;
export type BusinessTab = (typeof BUSINESS_TABS)[number];

export type BusinessSearch = { tab?: BusinessTab; doc?: string };

/** Tabs that use the `doc` search parameter for the selected CMS item. */
export const BUSINESS_DOC_TABS = ['legal', 'web'] as const;
export type BusinessDocTab = (typeof BUSINESS_DOC_TABS)[number];

export function isBusinessDocTab(tab: BusinessTab): tab is BusinessDocTab {
  return (BUSINESS_DOC_TABS as readonly string[]).includes(tab);
}

/** The tab in the URL; missing means `info`, as Flutter's `businessPath` does. */
export function tabOf(search: BusinessSearch): BusinessTab {
  return search.tab ?? 'info';
}

/** `/business` for info; `/business?tab=` for the others. Clears `doc` off legal/web. */
export function searchWithTab(tab: BusinessTab, doc?: string): BusinessSearch {
  const next: BusinessSearch = { tab: tab === 'info' ? undefined : tab };
  if (isBusinessDocTab(tab) && doc) next.doc = doc;
  return next;
}

/** Keep the tab; set or clear the CMS document code. */
export function searchWithDoc(search: BusinessSearch, doc: string | undefined): BusinessSearch {
  const tab = tabOf(search);
  if (!isBusinessDocTab(tab)) return searchWithTab(tab);
  return searchWithTab(tab, doc);
}
