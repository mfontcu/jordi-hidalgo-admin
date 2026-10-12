import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { businessToday } from '@/shared/lib/business-time';
import { useDateFilter } from '@/shared/lib/use-date-filter';
import { useDebouncedText } from '@/shared/lib/use-debounced-text';

import {
  bulkCancelAppointments,
  bulkChangeStatus,
  cancelAppointment,
  changeAppointmentStatus,
} from '../api/appointments.mutations';
import { appointmentsListQueryOptions } from '../api/appointments.queries';
import { isBulkSelectable, rowActionsOf, type AppointmentItem } from '../model/appointment';
import {
  appointmentDateFilterOf,
  hasActiveListFilters,
  listParamsOf,
  searchWithDate,
  searchWithPage,
  searchWithStatus,
  searchWithText,
  statusFilterOf,
  type AppointmentStatusFilter,
} from '../model/appointments-search';

type SuccessMessage =
  | 'appointmentCompletedSnackbar'
  | 'appointmentNoShowSnackbar'
  | 'appointmentCancelledSnackbar'
  | 'appointmentBulkSuccessSnackbar';
type FailureContext =
  'appointmentCompleteFailed' | 'appointmentStatusUpdateFailed' | 'appointmentCancelFailed';
type TooEarlyMessage = 'appointmentBulkCompleteBeforeStartError' | 'appointmentStatusChangeBeforeStartError';

type Options = {
  onSuccess: (message: SuccessMessage) => void;
  onError: (error: unknown, context: FailureContext) => void;
  onTooEarly: (message: TooEarlyMessage) => void;
  onBulkPartial: (failed: { id: string; error: unknown }[]) => void;
};

/**
 * Appointments list (AppointmentScreen): URL filters (today by default), bulk selection, and row
 * actions. Flutter kept the filters in the screen; the panel keeps them in the URL.
 */
export function useAppointmentsList({ onSuccess, onError, onTooEarly, onBulkPartial }: Options) {
  const search = useSearch({ from: '/_authed/appointments/' });
  const navigate = useNavigate({ from: '/appointments/' });
  const queryClient = useQueryClient();
  const today = businessToday();
  const params = listParamsOf(search, today);

  const list = useQuery({
    ...appointmentsListQueryOptions(params),
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

  const date = useDateFilter(appointmentDateFilterOf(search), today, (filter) => {
    void navigate({
      search: (previous) => searchWithDate({ ...previous, search: query || undefined }, filter),
    });
  });

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    clearSelection();
  };

  const statusChange = useMutation({
    mutationFn: ({ item, status }: { item: AppointmentItem; status: 'completed' | 'no_show' }) =>
      changeAppointmentStatus(queryClient, item, status),
    onSuccess: (_, { status }) => {
      onSuccess(status === 'completed' ? 'appointmentCompletedSnackbar' : 'appointmentNoShowSnackbar');
    },
    onError: (error, { status }) => {
      onError(error, status === 'completed' ? 'appointmentCompleteFailed' : 'appointmentStatusUpdateFailed');
    },
  });

  const cancellation = useMutation({
    mutationFn: (item: AppointmentItem) => cancelAppointment(queryClient, item),
    onSuccess: () => {
      onSuccess('appointmentCancelledSnackbar');
    },
    onError: (error) => {
      onError(error, 'appointmentCancelFailed');
    },
  });

  const bulk = useMutation({
    mutationFn: async (input: {
      items: AppointmentItem[];
      action: 'completed' | 'no_show' | 'cancel';
      reason?: string;
    }) => {
      if (input.action === 'cancel') {
        return bulkCancelAppointments(queryClient, input.items, input.reason ?? '');
      }
      return bulkChangeStatus(queryClient, input.items, input.action);
    },
    onSuccess: (result) => {
      if (result.ok > 0) onSuccess('appointmentBulkSuccessSnackbar');
      if (result.failed.length > 0) onBulkPartial(result.failed);
      exitSelectMode();
    },
    onError: (error) => {
      onError(error, 'appointmentStatusUpdateFailed');
    },
  });

  const changeStatus = (item: AppointmentItem, status: 'completed' | 'no_show') => {
    if (!rowActionsOf(item).completeOrNoShow) {
      onTooEarly(
        status === 'completed'
          ? 'appointmentBulkCompleteBeforeStartError'
          : 'appointmentStatusChangeBeforeStartError',
      );
      return;
    }
    statusChange.mutate({ item, status });
  };

  const page = list.data;
  const selectableOnPage = (page?.items ?? []).filter((item) => isBulkSelectable(item.status));

  const selectedItems = () =>
    (page?.items ?? []).filter((item) => selectedIds.has(item.id) && isBulkSelectable(item.status));

  const runBulk = (action: 'completed' | 'no_show' | 'cancel', reason?: string) => {
    const items = selectedItems();
    if (items.length === 0) return;
    if (action === 'completed' || action === 'no_show') {
      const tooEarly = items.some((item) => !rowActionsOf(item).completeOrNoShow);
      if (tooEarly) {
        onTooEarly('appointmentBulkCompleteBeforeStartError');
        return;
      }
    }
    bulk.mutate({ items, action, reason });
  };

  return {
    page,
    isLoading: list.isPending,
    isRefreshing: list.isFetching && list.isPlaceholderData,
    error: list.isError ? list.error : null,
    retry: () => {
      void list.refetch();
    },
    filtersActive: hasActiveListFilters(search),

    searchText,
    setSearchText,

    statusFilter: statusFilterOf(search),
    applyStatus: (status: AppointmentStatusFilter) => {
      void navigate({
        search: (previous) => searchWithStatus({ ...previous, search: query || undefined }, status),
      });
    },
    clearStatus: () => {
      void navigate({
        search: (previous) => searchWithStatus({ ...previous, search: query || undefined }, 'all'),
      });
    },

    today: date.today,
    dateFilter: date.dateFilter,
    dateRange: date.dateRange,
    pickDate: date.pickDate,
    rangeOpen: date.rangeOpen,
    setRangeOpen: date.setRangeOpen,
    applyRange: date.applyRange,
    clearDate: () => {
      void navigate({
        search: (previous) => searchWithDate({ ...previous, search: query || undefined }, { kind: 'today' }),
      });
    },

    goToPage: (next: number) => {
      clearSelection();
      void navigate({ search: (previous) => searchWithPage(previous, next) });
    },

    selectMode,
    enterSelectMode: () => {
      setSelectMode(true);
      clearSelection();
    },
    exitSelectMode,
    selectedIds,
    selectableOnPage,
    toggleSelected: (id: string) => {
      setSelectedIds((previous) => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    selectAllPage: () => {
      setSelectedIds(new Set(selectableOnPage.map((item) => item.id)));
    },
    clearSelection,
    bulkComplete: () => {
      runBulk('completed');
    },
    bulkNoShow: () => {
      runBulk('no_show');
    },
    bulkCancel: (reason: string) => {
      runBulk('cancel', reason);
    },

    open: (appointmentId: string) => {
      void navigate({ to: '/appointments/$appointmentId', params: { appointmentId } });
    },
    complete: (item: AppointmentItem) => {
      changeStatus(item, 'completed');
    },
    markNoShow: (item: AppointmentItem) => {
      changeStatus(item, 'no_show');
    },
    cancel: (item: AppointmentItem) => {
      cancellation.mutate(item);
    },
    newAppointment: () => {
      void navigate({ to: '/appointments/form' });
    },
    isBusy: statusChange.isPending || cancellation.isPending || bulk.isPending,
  };
}
