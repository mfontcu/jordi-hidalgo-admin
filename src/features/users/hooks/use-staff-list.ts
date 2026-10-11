import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { businessToday } from '@/shared/lib/business-time';
import { useDebouncedText } from '@/shared/lib/use-debounced-text';

import { usersListQueryOptions } from '../api/users.queries';
import { dateFilterOf, dateFilterRange, type DateFilter, type DateQuickPick } from '../model/date-filter';
import {
  searchWithDate,
  searchWithFilter,
  searchWithPage,
  searchWithText,
  staffFilterOf,
  staffListParamsOf,
  type StaffFilter,
} from '../model/staff-search';

/** Flutter waits for the date sheet to close before it opens the range picker. */
const RANGE_PICKER_DELAY_MS = 180;

/**
 * Staff list (StaffAdminsScreen): the page of the URL's filters, the summary, the debounced search,
 * the status and date filters, and the page.
 */
export function useStaffList() {
  const search = useSearch({ from: '/_authed/admins/' });
  const navigate = useNavigate({ from: '/admins/' });
  const today = businessToday();

  const list = useQuery({
    ...usersListQueryOptions(staffListParamsOf(search, today)),
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

  const filter = staffFilterOf(search);
  const applyFilter = (next: StaffFilter) => {
    void navigate({
      search: (previous) => searchWithFilter({ ...previous, search: query || undefined }, next),
    });
  };

  const dateFilter = dateFilterOf(search);
  const applyDate = (next: DateFilter) => {
    void navigate({
      search: (previous) => searchWithDate({ ...previous, search: query || undefined }, next),
    });
  };

  // "Choose a range…" opens the range picker once the date sheet has closed.
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangePending, setRangePending] = useState(false);
  useEffect(() => {
    if (!rangePending) return;
    const timer = setTimeout(() => {
      setRangePending(false);
      setRangeOpen(true);
    }, RANGE_PICKER_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [rangePending]);

  const page = list.data;
  return {
    page,
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

    today,
    dateFilter,
    /** The days the date filter covers, which the range picker opens on. */
    dateRange: dateFilterRange(dateFilter, today),
    pickDate: (pick: DateQuickPick) => {
      if (pick === 'custom') setRangePending(true);
      else applyDate({ kind: pick === 'allTime' ? 'all' : pick === 'today' ? 'today' : 'month' });
    },
    rangeOpen,
    setRangeOpen,
    applyRange: (from: string, to: string) => {
      setRangeOpen(false);
      applyDate({ kind: 'range', from, to });
    },
    clearDate: () => {
      applyDate({ kind: 'all' });
    },

    goToPage: (next: number) => {
      void navigate({ search: (previous) => searchWithPage(previous, next) });
    },
    openStaff: (staffId: string) => {
      void navigate({ to: '/admins/$staffId', params: { staffId } });
    },
    newStaff: () => {
      void navigate({ to: '/admins/form' });
    },
  };
}
