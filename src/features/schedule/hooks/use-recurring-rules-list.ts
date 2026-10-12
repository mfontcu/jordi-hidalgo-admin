import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';

import { businessToday, type Weekday } from '@/shared/lib/business-time';

import { deleteRule } from '../api/schedule.mutations';
import { recurringRulesQueryOptions } from '../api/schedule.queries';
import {
  recurringRuleListParamsOf,
  searchWithPage,
  searchWithStatus,
  searchWithWeekday,
  statusFilterOf,
  weekdayFilterOf,
  type RecurringStatusFilter,
} from '../model/blocked-slots-search';
import { RECURRING_RULES_PAGE_SIZE, rulesPage, type RecurringRule } from '../model/recurring-rule';

type Feedback = {
  onDeleted: () => void;
  onError: (error: unknown, context: 'scheduleRecurringBlockedSlotDeleteError') => void;
};

/**
 * The recurring tab (RecurringBlockedSlotsScreen): every rule of the weekday and status filters,
 * paged here as Flutter does, the summary, and delete with a confirmation and a toast.
 */
export function useRecurringRulesList(feedback: Feedback) {
  const search = useSearch({ from: '/_authed/schedule/blocked-slots/' });
  const navigate = useNavigate({ from: '/schedule/blocked-slots/' });
  const queryClient = useQueryClient();

  const list = useQuery({
    ...recurringRulesQueryOptions(recurringRuleListParamsOf(search)),
    placeholderData: keepPreviousData,
  });

  const [deleting, setDeleting] = useState<RecurringRule | null>(null);
  const removal = useMutation({
    mutationFn: (rule: RecurringRule) => deleteRule(queryClient, rule.id),
    onSuccess: feedback.onDeleted,
    onError: (error) => {
      feedback.onError(error, 'scheduleRecurringBlockedSlotDeleteError');
    },
  });

  const rules = list.data?.items ?? [];
  const page = search.page ?? 1;
  return {
    list: list.data,
    today: businessToday(),
    rows: rulesPage(rules, page),
    pageInfo: { page, pageSize: RECURRING_RULES_PAGE_SIZE, totalItems: rules.length },
    isLoading: list.isPending,
    isRefreshing: list.isFetching && list.isPlaceholderData,
    error: list.isError ? list.error : null,
    retry: () => {
      void list.refetch();
    },

    weekday: weekdayFilterOf(search),
    applyWeekday: (weekday: Weekday | null) => {
      void navigate({ search: (previous) => searchWithWeekday(previous, weekday) });
    },
    status: statusFilterOf(search),
    applyStatus: (status: RecurringStatusFilter) => {
      void navigate({ search: (previous) => searchWithStatus(previous, status) });
    },

    goToPage: (next: number) => {
      void navigate({ search: (previous) => searchWithPage(previous, next) });
    },
    open: (rule: RecurringRule) => {
      void navigate({ to: '/schedule/recurring-blocked-slots/$ruleId', params: { ruleId: rule.id } });
    },
    create: () => {
      void navigate({ to: '/schedule/recurring-blocked-slots/form' });
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
