import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';

import {
  businessToday,
  dayEndInstant,
  dayStartInstant,
  formatDay,
  weekDaysOf,
  type BusinessDay,
  type DateLocale,
} from '@/shared/lib/business-time';
import { useDebouncedText } from '@/shared/lib/use-debounced-text';

import { changeAppointmentStatus, sendCustomerPush } from '../api/appointments.mutations';
import {
  agendaBlockedSlotsQueryOptions,
  agendaRecurringRulesQueryOptions,
  agendaWorkingHoursQueryOptions,
  appointmentsListQueryOptions,
} from '../api/appointments.queries';
import {
  canSendCustomerPush,
  isFinalStatus,
  pushBodyOf,
  rowActionsOf,
  type AppointmentItem,
} from '../model/appointment';
import {
  agendaSummaryOf,
  blocksForDay,
  filterAgendaAppointments,
  isWorkingDayClosed,
  servicesInDay,
  sortAppointmentsForAgenda,
  timelineRangeForDay,
  timelineRangeForWeek,
  weekRangeLabel,
  workingDayOf,
  type AgendaAppointment,
} from '../model/day-agenda';
import {
  agendaBoundsOf,
  dayOf,
  hasActiveAgendaFilters,
  layoutScopeOf,
  scopeOf,
  searchShiftPeriod,
  searchWithAppointments,
  searchWithBlocked,
  searchWithDay,
  searchWithScope,
  searchWithService,
  searchWithText,
  searchWithView,
  showAppointmentsOf,
  showBlockedSlotsOf,
  viewFilterOf,
  type DayAgendaScope,
  type DayAgendaSearch,
  type DayAgendaViewFilter,
} from '../model/day-agenda-search';

type SuccessMessage = 'appointmentCompletedSnackbar' | 'customerPushSentSnackbar';
type FailureContext = 'appointmentCompleteFailed' | 'customerPushFailed';
type TooEarlyMessage = 'appointmentBulkCompleteBeforeStartError';

type Options = {
  onSuccess: (message: SuccessMessage) => void;
  onError: (error: unknown, context: FailureContext) => void;
  onTooEarly: (message: TooEarlyMessage) => void;
  locale: DateLocale;
  /** Compact layouts force the day timeline, as Flutter does under 900 px. */
  isCompact: boolean;
};

/**
 * Day agenda (`/schedule/day-agenda`): URL day/scope/filters, appointments + blocks + hours,
 * complete and customer push.
 */
export function useDayAgenda({ onSuccess, onError, onTooEarly, locale, isCompact }: Options) {
  const search = useSearch({ from: '/_authed/schedule/day-agenda' });
  const navigate = useNavigate({ from: '/schedule/day-agenda' });
  const queryClient = useQueryClient();
  const today = businessToday();

  const day = dayOf(search, today);
  const urlScope = scopeOf(search);
  const layoutScope = layoutScopeOf(search, isCompact);
  const viewFilter = viewFilterOf(search);
  const showAppointments = showAppointmentsOf(search);
  const showBlockedSlots = showBlockedSlotsOf(search);
  // Load by the URL scope (Flutter): a compact day view may still hold a week's data.
  const loadScope = urlScope;
  const bounds = agendaBoundsOf(day, loadScope);
  const pageSize = loadScope === 'week' ? 500 : 100;
  const blockedPageSize = loadScope === 'week' ? 200 : 50;

  const listParams = {
    page: 1,
    pageSize,
    search: '',
    status: 'all' as const,
    dateFrom: dayStartInstant(bounds.dateFrom),
    dateTo: dayEndInstant(bounds.dateTo),
  };

  const appointmentsQuery = useQuery({
    ...appointmentsListQueryOptions(listParams),
    placeholderData: keepPreviousData,
  });
  const hoursQuery = useQuery({ ...agendaWorkingHoursQueryOptions(), placeholderData: keepPreviousData });
  const blockedQuery = useQuery({
    ...agendaBlockedSlotsQueryOptions(listParams.dateFrom, listParams.dateTo, blockedPageSize),
    placeholderData: keepPreviousData,
  });
  const recurringQuery = useQuery({
    ...agendaRecurringRulesQueryOptions(),
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

  const patchSearch = useCallback(
    (next: (previous: DayAgendaSearch) => DayAgendaSearch) => {
      void navigate({ search: next, replace: true });
    },
    [navigate],
  );

  const allAppointments = sortAppointmentsForAgenda(appointmentsQuery.data?.items ?? []);
  const services = servicesInDay(allAppointments);
  const filteredAppointments: AgendaAppointment[] = showAppointments
    ? filterAgendaAppointments(allAppointments, {
        viewFilter,
        search: query,
        serviceId: search.serviceId ?? null,
      })
    : [];

  const weekDays = weekDaysOf(day);
  const workingDays = hoursQuery.data ?? [];

  const blockedSlots = (() => {
    if (!showBlockedSlots) return [];
    const punctual = blockedQuery.data ?? [];
    const rules = recurringQuery.data ?? [];
    if (layoutScope === 'week') {
      return weekDays.flatMap((weekDay) => blocksForDay(punctual, rules, weekDay));
    }
    return blocksForDay(punctual, rules, day);
  })();

  const timelineRange =
    layoutScope === 'week'
      ? timelineRangeForWeek(weekDays, workingDays)
      : timelineRangeForDay(day, workingDays);

  const hasAppointmentFilters = viewFilter !== 'all' || Boolean(query) || Boolean(search.serviceId);
  const summary = agendaSummaryOf(filteredAppointments, hasAppointmentFilters);

  const selectedDayClosed = isWorkingDayClosed(workingDayOf(workingDays, day));
  const isCurrentPeriod = layoutScope === 'week' ? weekDaysOf(today)[0] === weekDays[0] : day === today;

  const periodLabel =
    layoutScope === 'week' ? weekRangeLabel(day, locale) : formatDay(day, locale, 'longDate');

  const completeMutation = useMutation({
    mutationFn: (item: AppointmentItem) => changeAppointmentStatus(queryClient, item, 'completed'),
    onSuccess: () => {
      onSuccess('appointmentCompletedSnackbar');
    },
    onError: (error) => {
      onError(error, 'appointmentCompleteFailed');
    },
  });

  const pushMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => sendCustomerPush(queryClient, id, body),
    onSuccess: () => {
      onSuccess('customerPushSentSnackbar');
    },
    onError: (error) => {
      onError(error, 'customerPushFailed');
    },
  });

  const openDetail = (item: AppointmentItem) => {
    void navigate({ to: '/appointments/$appointmentId', params: { appointmentId: item.id } });
  };

  const complete = (item: AppointmentItem) => {
    if (!rowActionsOf(item).completeOrNoShow) {
      onTooEarly('appointmentBulkCompleteBeforeStartError');
      return;
    }
    completeMutation.mutate(item);
  };

  const sendPush = (item: AppointmentItem, text: string) => {
    const body = pushBodyOf(text);
    if (!body || !canSendCustomerPush(item.userId)) return;
    pushMutation.mutate({ id: item.id, body });
  };

  const isLoading =
    appointmentsQuery.isFetching ||
    hoursQuery.isFetching ||
    blockedQuery.isFetching ||
    recurringQuery.isFetching;
  const isError =
    appointmentsQuery.isError || hoursQuery.isError || blockedQuery.isError || recurringQuery.isError;
  const error = appointmentsQuery.error ?? hoursQuery.error ?? blockedQuery.error ?? recurringQuery.error;

  return {
    day,
    today,
    urlScope,
    layoutScope,
    viewFilter,
    showAppointments,
    showBlockedSlots,
    searchText,
    setSearchText,
    services,
    serviceId: search.serviceId ?? null,
    filteredAppointments,
    blockedSlots,
    workingDays,
    weekDays,
    timelineRange,
    summary,
    hasAppointmentFilters,
    hasActiveFilters: hasActiveAgendaFilters({ ...search, search: query || undefined }),
    selectedDayClosed,
    isCurrentPeriod,
    periodLabel,
    isLoading,
    isError,
    error,
    isEmpty: filteredAppointments.length === 0 && blockedSlots.length === 0,
    canComplete: (item: AppointmentItem) =>
      !isFinalStatus(item.status) && rowActionsOf(item).completeOrNoShow,
    canPush: (item: AppointmentItem) => canSendCustomerPush(item.userId),
    openDetail,
    complete,
    sendPush,
    completing: completeMutation.isPending,
    pushing: pushMutation.isPending,
    retry: () => {
      void appointmentsQuery.refetch();
      void hoursQuery.refetch();
      void blockedQuery.refetch();
      void recurringQuery.refetch();
    },
    setDay: (next: BusinessDay) => {
      patchSearch((previous) => searchWithDay(previous, next));
    },
    setScope: (scope: DayAgendaScope) => {
      patchSearch((previous) => searchWithScope(previous, scope));
    },
    setViewFilter: (view: DayAgendaViewFilter) => {
      patchSearch((previous) => searchWithView(previous, view));
    },
    setServiceId: (serviceId: string | null) => {
      patchSearch((previous) => searchWithService(previous, serviceId));
    },
    setShowAppointments: (show: boolean) => {
      patchSearch((previous) => searchWithAppointments(previous, show));
    },
    setShowBlockedSlots: (show: boolean) => {
      patchSearch((previous) => searchWithBlocked(previous, show));
    },
    shiftPeriod: (delta: number) => {
      patchSearch((previous) => searchShiftPeriod(previous, delta, layoutScope, today));
    },
    goToday: () => {
      patchSearch((previous) => searchWithDay(previous, today));
    },
  };
}
