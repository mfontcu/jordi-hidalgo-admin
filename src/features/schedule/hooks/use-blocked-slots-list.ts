import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { businessToday } from '@/shared/lib/business-time';
import type { DateFilter } from '@/shared/lib/date-filter';
import { useDateFilter } from '@/shared/lib/use-date-filter';
import { useDebouncedText } from '@/shared/lib/use-debounced-text';

import { deleteBlockedSlot } from '../api/schedule.mutations';
import { blockedSlotsListQueryOptions } from '../api/schedule.queries';
import type { BlockedSlot } from '../model/blocked-slot';
import {
  blockedSlotListParamsOf,
  punctualDateFilterOf,
  searchWithDate,
  searchWithPage,
  searchWithText,
  searchWithType,
  typeFilterOf,
  type BlockedSlotTypeFilter,
} from '../model/blocked-slots-search';

type Feedback = { onError: (error: unknown, context: 'scheduleBlockedSlotDeleteError') => void };

/**
 * The punctual tab (`_BlockedSlotsContent`): the page of the URL's filters, the summary, the
 * debounced search, the date and type filters, the page, and delete with a confirmation.
 */
export function useBlockedSlotsList(feedback: Feedback) {
  const search = useSearch({ from: '/_authed/schedule/blocked-slots/' });
  const navigate = useNavigate({ from: '/schedule/blocked-slots/' });
  const queryClient = useQueryClient();
  const today = businessToday();

  const list = useQuery({
    ...blockedSlotsListQueryOptions(blockedSlotListParamsOf(search, today)),
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

  const typeFilter = typeFilterOf(search);
  const applyType = (next: BlockedSlotTypeFilter) => {
    void navigate({
      search: (previous) => searchWithType({ ...previous, search: query || undefined }, next),
    });
  };

  const date = useDateFilter(punctualDateFilterOf(search), today, (next: DateFilter) => {
    void navigate({
      search: (previous) => searchWithDate({ ...previous, search: query || undefined }, next),
    });
  });

  const [deleting, setDeleting] = useState<BlockedSlot | null>(null);
  const removal = useMutation({
    mutationFn: (slot: BlockedSlot) => deleteBlockedSlot(queryClient, slot.id),
    onError: (error) => {
      feedback.onError(error, 'scheduleBlockedSlotDeleteError');
    },
  });

  return {
    page: list.data,
    isLoading: list.isPending,
    isRefreshing: list.isFetching && list.isPlaceholderData,
    error: list.isError ? list.error : null,
    retry: () => {
      void list.refetch();
    },

    searchText,
    setSearchText,

    typeFilter,
    applyType,
    clearType: () => {
      applyType('all');
    },

    ...date,

    goToPage: (next: number) => {
      void navigate({ search: (previous) => searchWithPage(previous, next) });
    },
    open: (slot: BlockedSlot) => {
      void navigate({ to: '/schedule/blocked-slots/$blockedSlotId', params: { blockedSlotId: slot.id } });
    },
    create: () => {
      void navigate({ to: '/schedule/blocked-slots/form' });
    },

    deleting,
    askDelete: setDeleting,
    cancelDelete: () => {
      setDeleting(null);
    },
    confirmDelete: () => {
      if (deleting) removal.mutate(deleting);
      setDeleting(null);
    },
  };
}
