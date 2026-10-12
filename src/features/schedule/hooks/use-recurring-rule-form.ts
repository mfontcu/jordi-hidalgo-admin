import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useRouter } from '@tanstack/react-router';
import { useForm, useWatch } from 'react-hook-form';

import type { ClockTime, Weekday } from '@/shared/lib/business-time';
import { useGoBack } from '@/shared/lib/use-go-back';

import { createRule, updateRule } from '../api/schedule.mutations';
import { recurringRuleDetailQueryOptions, ruleExceptionsQueryOptions } from '../api/schedule.queries';
import type { RecurringRule } from '../model/recurring-rule';
import {
  recurringRuleFormDefaults,
  recurringRuleFormSchema,
  type RecurringRuleFormErrorKey,
  type RecurringRuleFormInput,
  type RecurringRuleInput,
} from '../model/recurring-rule-form';
import { endAfterStartChange } from '../model/working-hours';

/** What the form screen needs first: for an edit, the rule and its exceptions. */
export function useRecurringRuleFormData() {
  const params = useParams({ strict: false });
  const id = params.ruleId ?? null;
  const query = useQuery({ ...recurringRuleDetailQueryOptions(id ?? ''), enabled: id !== null });
  const exceptions = useQuery({ ...ruleExceptionsQueryOptions(id ?? ''), enabled: id !== null });
  return {
    isEdit: id !== null,
    rule: id === null ? null : query.data,
    exceptions: exceptions.data,
    exceptionsError: exceptions.isError ? exceptions.error : null,
    retryExceptions: () => {
      void exceptions.refetch();
    },
    isLoading: id !== null && query.isPending,
    error: id !== null && query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    goBack: useGoBack('/schedule/blocked-slots'),
  };
}

type FormOptions = {
  rule: RecurringRule | null;
  onSaved: (isEdit: boolean) => void;
  onError: (error: unknown, context: 'scheduleRecurringBlockedSlotFormSaveError') => void;
};

/**
 * The recurring-rule form: weekday, times, status, and reason, validated on submit. A new rule
 * opens its detail, replacing the form in the history; an edit goes back to its detail.
 */
export function useRecurringRuleForm({ rule, onSaved, onError }: FormOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const form = useForm<RecurringRuleFormInput, unknown, RecurringRuleInput>({
    resolver: zodResolver(recurringRuleFormSchema),
    defaultValues: recurringRuleFormDefaults(rule),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const save = useMutation({
    mutationFn: (input: RecurringRuleInput) =>
      rule ? updateRule(queryClient, rule.id, input) : createRule(queryClient, input),
    onSuccess: (saved) => {
      onSaved(rule !== null);
      if (rule && router.history.canGoBack()) {
        router.history.back({ ignoreBlocker: true });
        return;
      }
      void navigate({
        to: '/schedule/recurring-blocked-slots/$ruleId',
        params: { ruleId: saved.id },
        replace: true,
        ignoreBlocker: true,
      });
    },
    onError: (error) => {
      onError(error, 'scheduleRecurringBlockedSlotFormSaveError');
    },
  });

  const values = useWatch({ control: form.control });
  const { errors, isDirty } = form.formState;
  const dirty = { shouldDirty: true } as const;
  const defaults = recurringRuleFormDefaults(rule);

  return {
    form,
    endError: errors.end?.message as RecurringRuleFormErrorKey | undefined,
    values: {
      weekday: (values.weekday ?? defaults.weekday) as Weekday,
      start: values.start ?? defaults.start,
      end: values.end ?? defaults.end,
      isActive: values.isActive ?? defaults.isActive,
      reason: values.reason ?? '',
    },
    setWeekday: (weekday: Weekday) => {
      form.setValue('weekday', weekday, dirty);
    },
    setStart: (start: ClockTime) => {
      form.setValue('start', start, dirty);
      form.setValue('end', endAfterStartChange(start, form.getValues('end')) ?? start, dirty);
    },
    setEnd: (end: ClockTime) => {
      form.setValue('end', end, dirty);
    },
    setActive: (isActive: boolean) => {
      form.setValue('isActive', isActive, dirty);
    },
    submit: form.handleSubmit((input) => {
      save.mutate(input);
    }),
    isSaving: save.isPending,
    hasUnsavedChanges: isDirty && !save.isPending && !save.isSuccess,
  };
}
