import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { businessToday, type BusinessDay } from '@/shared/lib/business-time';

import { createRuleException } from '../api/schedule.mutations';
import { exceptionDays, type RecurringRule } from '../model/recurring-rule';

type Feedback = {
  onSaved: () => void;
  onError: (error: unknown, context: 'scheduleRecurringBlockedSlotExceptionSaveError') => void;
};

/**
 * The exception sheet (`_showAddRecurringBlockedSlotExceptionSheet`): a day of the rule's weekday,
 * from today to a year ahead, picked on an inline calendar, and a reason. It saves an `unblock`
 * exception and closes, with a toast either way.
 */
export function useRuleException(rule: RecurringRule | null, feedback: Feedback) {
  const queryClient = useQueryClient();
  const today = businessToday();
  const days = rule ? exceptionDays(rule.weekday, today) : null;
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<BusinessDay>(days?.initial ?? today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reason, setReason] = useState('');

  const save = useMutation({
    mutationFn: ({ ruleId, date, text }: { ruleId: string; date: BusinessDay; text: string }) =>
      createRuleException(queryClient, ruleId, date, text),
    onSuccess: feedback.onSaved,
    onError: (error) => {
      feedback.onError(error, 'scheduleRecurringBlockedSlotExceptionSaveError');
    },
  });

  return {
    open,
    /** Each opening starts from the next occurrence after today, with no reason. */
    setOpen: (next: boolean) => {
      if (next && days) {
        setDay(days.initial);
        setReason('');
        setCalendarOpen(false);
      }
      setOpen(next);
    },
    day,
    days,
    pickDay: setDay,
    calendarOpen,
    toggleCalendar: () => {
      setCalendarOpen((value) => !value);
    },
    closeCalendar: () => {
      setCalendarOpen(false);
    },
    reason,
    setReason,
    isSaving: save.isPending,
    save: () => {
      if (!rule || save.isPending) return;
      setOpen(false);
      save.mutate({ ruleId: rule.id, date: day, text: reason.trim() });
    },
  };
}
