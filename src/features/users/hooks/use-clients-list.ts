import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';

import { businessToday } from '@/shared/lib/business-time';
import { useDateFilter } from '@/shared/lib/use-date-filter';
import { useDebouncedText } from '@/shared/lib/use-debounced-text';

import { usersListQueryOptions } from '../api/users.queries';
import {
  clientFilterOf,
  clientsListParamsOf,
  searchWithClientFilter,
  type ClientFilter,
} from '../model/clients-search';
import { dateFilterOf, type DateFilter } from '@/shared/lib/date-filter';
import { searchWithDate, searchWithPage, searchWithText } from '../model/list-search';

/**
 * Clients list (ClientsScreen): the page of the URL's filters, the summary, the debounced search,
 * the status and date filters, and the page.
 */
export function useClientsList() {
  const search = useSearch({ from: '/_authed/clients/' });
  const navigate = useNavigate({ from: '/clients/' });
  const today = businessToday();

  const list = useQuery({
    ...usersListQueryOptions(clientsListParamsOf(search, today)),
    placeholderData: keepPreviousData,
  });

  const applySearch = useCallback(
    (query: string) => {
      void navigate({ search: (previous) => searchWithText(previous, query), replace: true });
    },
    [navigate],
  );
  const {
    text: searchText,
    setText: setSearchText,
    query,
  } = useDebouncedText(search.search ?? '', applySearch);

  const filter = clientFilterOf(search);
  const applyFilter = (next: ClientFilter) => {
    void navigate({
      search: (previous) => searchWithClientFilter({ ...previous, search: query || undefined }, next),
    });
  };

  const date = useDateFilter(dateFilterOf(search), today, (next: DateFilter) => {
    void navigate({
      search: (previous) => searchWithDate({ ...previous, search: query || undefined }, next),
    });
  });

  return {
    page: list.data,
    /** First load: nothing to show yet. */
    isLoading: list.isPending,
    /** A new page or filter is loading over the previous rows. */
    isRefreshing: list.isFetching && list.isPlaceholderData,
    error: list.isError ? list.error : null,
    retry: () => {
      void list.refetch();
    },

    searchText,
    setSearchText,

    filter,
    applyFilter,
    clearFilter: () => {
      applyFilter('all');
    },

    ...date,

    goToPage: (next: number) => {
      void navigate({ search: (previous) => searchWithPage(previous, next) });
    },
    openClient: (clientId: string) => {
      void navigate({ to: '/clients/$clientId', params: { clientId } });
    },
    newClient: () => {
      void navigate({ to: '/clients/form' });
    },
  };
}
