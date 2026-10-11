import type { QueryClient } from '@tanstack/react-query';

import { useLocaleStore } from '@/shared/i18n';

/**
 * On a language change, refetches the queries whose content the backend localizes
 * (`meta.localized`): the next request already carries the new `Accept-Language`.
 * Returns the function that stops it.
 */
export function wireLocalizedQueries(queryClient: QueryClient): () => void {
  return useLocaleStore.subscribe((state, previous) => {
    if (state.locale === previous.locale) return;
    void queryClient.invalidateQueries({ predicate: (query) => query.meta?.localized === true });
  });
}
