import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';

import { businessToday } from '@/shared/lib/business-time';
import { useGoBack } from '@/shared/lib/use-go-back';

import { deleteRule, setRuleActive } from '../api/schedule.mutations';
import { recurringRuleDetailQueryOptions, ruleExceptionsQueryOptions } from '../api/schedule.queries';

type Feedback = {
  onError: (
    error: unknown,
    context: 'scheduleRecurringBlockedSlotUpdateError' | 'scheduleRecurringBlockedSlotDeleteError',
  ) => void;
};

/**
 * Recurring-rule detail (RecurringBlockedSlotDetailScreen): the rule, its exceptions, and its
 * actions. Activating and deactivating wait for the server, as Flutter does, and report a failure,
 * which Flutter does not.
 */
export function useRecurringRuleDetail(feedback: Feedback) {
  const { ruleId } = useParams({ from: '/_authed/schedule/recurring-blocked-slots/$ruleId/' });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery(recurringRuleDetailQueryOptions(ruleId));
  const exceptions = useQuery(ruleExceptionsQueryOptions(ruleId));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const rule = query.data;

  const activation = useMutation({
    mutationFn: (isActive: boolean) => {
      if (!rule) throw new Error('No rule loaded');
      return setRuleActive(queryClient, rule, isActive);
    },
    onError: (error) => {
      feedback.onError(error, 'scheduleRecurringBlockedSlotUpdateError');
    },
  });

  const removal = useMutation({
    mutationFn: () => deleteRule(queryClient, ruleId),
    onSuccess: () => navigate({ to: '/schedule/blocked-slots', search: { tab: 'recurring' }, replace: true }),
    onError: (error) => {
      feedback.onError(error, 'scheduleRecurringBlockedSlotDeleteError');
    },
  });

  return {
    rule,
    today: businessToday(),
    isLoading: query.isPending,
    error: query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    exceptions: exceptions.data,
    exceptionsError: exceptions.isError ? exceptions.error : null,
    retryExceptions: () => {
      void exceptions.refetch();
    },
    goBack: useGoBack('/schedule/blocked-slots'),
    edit: () => {
      void navigate({ to: '/schedule/recurring-blocked-slots/$ruleId/form', params: { ruleId } });
    },
    toggleActive: () => {
      if (rule && !activation.isPending) activation.mutate(!rule.isActive);
    },
    isChangingActive: activation.isPending,
    confirmingDelete,
    setConfirmingDelete,
    remove: () => {
      removal.mutate();
    },
  };
}
