import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { instantFromEpoch, type BusinessDay } from '@/shared/lib/business-time';
import { useDebouncedText } from '@/shared/lib/use-debounced-text';

import { cancelSlotWatch } from '../api/slot-watches.mutations';
import { slotWatchesQueryOptions } from '../api/slot-watches.queries';
import { slotWatchKeys } from '../api/slot-watches.keys';
import {
  clampPage,
  filterWatches,
  pageOf,
  serviceOptions,
  SLOT_WATCH_PAGE_SIZE,
  watchCounts,
  type SlotWatch,
  type SlotWatchStatus,
} from '../model/slot-watch';
import {
  searchWithDate,
  searchWithPage,
  searchWithService,
  searchWithStatus,
  searchWithText,
} from '../model/slot-watches-search';

const NONE: SlotWatch[] = [];

type SlotWatchesCallbacks = {
  onCancelled: () => void;
  onCancelError: (error: unknown) => void;
};

/**
 * Slot-watch demand (SlotWatchDemandScreen): the list for the URL's day, client-side filters, and
 * cancel. Toasts stay in the screen.
 */
export function useSlotWatches({ onCancelled, onCancelError }: SlotWatchesCallbacks) {
  const search = useSearch({ from: '/_authed/schedule/slot-watches' });
  const navigate = useNavigate({ from: '/schedule/slot-watches' });
  const queryClient = useQueryClient();
  const [cancellingIds, setCancellingIds] = useState<ReadonlySet<string>>(() => new Set());

  const list = useQuery({
    ...slotWatchesQueryOptions(search.date ?? null),
    placeholderData: keepPreviousData,
  });
  const items = list.data ?? NONE;

  const applySearch = useCallback(
    (query: string) => {
      void navigate({ search: (previous) => searchWithText(previous, query), replace: true });
    },
    [navigate],
  );
  const { text: searchText, setText: setSearchText } = useDebouncedText(search.search ?? '', applySearch);

  const filtered = filterWatches(items, {
    serviceId: search.service,
    status: search.status,
    search: search.search ?? '',
  });
  const requestedPage = search.page ?? 1;
  const page = clampPage(filtered.length, requestedPage, SLOT_WATCH_PAGE_SIZE);

  useEffect(() => {
    if (!list.data || requestedPage === page) return;
    void navigate({ search: (previous) => searchWithPage(previous, page), replace: true });
  }, [list.data, navigate, page, requestedPage]);

  const cancellation = useMutation({
    mutationFn: async (watchId: string) => {
      setCancellingIds((current) => new Set(current).add(watchId));
      try {
        await cancelSlotWatch(queryClient, watchId);
      } finally {
        setCancellingIds((current) => {
          const next = new Set(current);
          next.delete(watchId);
          return next;
        });
      }
    },
    onSuccess: () => {
      onCancelled();
    },
    onError: (error) => {
      // The watch may have closed (booked, expired) while the request was in flight.
      void queryClient.invalidateQueries({ queryKey: slotWatchKeys.lists() });
      onCancelError(error);
    },
  });

  return {
    items,
    rows: pageOf(filtered, page, SLOT_WATCH_PAGE_SIZE),
    total: filtered.length,
    page,
    pageSize: SLOT_WATCH_PAGE_SIZE,
    counts: watchCounts(items, instantFromEpoch()),
    services: serviceOptions(items),
    isLoading: list.isPending,
    isRefreshing: list.isFetching && list.isPlaceholderData,
    error: list.isError ? list.error : null,
    retry: () => {
      void list.refetch();
    },
    refresh: () => {
      void list.refetch();
    },

    searchText,
    setSearchText,
    date: search.date,
    serviceId: search.service,
    status: search.status,

    setDate: (date: BusinessDay | null) => {
      void navigate({ search: (previous) => searchWithDate(previous, date) });
    },
    setService: (serviceId: string | null) => {
      void navigate({ search: (previous) => searchWithService(previous, serviceId) });
    },
    setStatus: (status: SlotWatchStatus | null) => {
      void navigate({ search: (previous) => searchWithStatus(previous, status) });
    },
    goToPage: (next: number) => {
      void navigate({ search: (previous) => searchWithPage(previous, next) });
    },

    isCancelling: (watchId: string) => cancellingIds.has(watchId),
    cancel: (watchId: string) => {
      cancellation.mutate(watchId);
    },
    openClient: (userId: string) => {
      if (!userId) return;
      void navigate({ to: '/clients/$clientId', params: { clientId: userId } });
    },
    openAppointment: (appointmentId: string) => {
      if (!appointmentId) return;
      void navigate({ to: '/appointments/$appointmentId', params: { appointmentId } });
    },
  };
}
