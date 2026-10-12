import { z } from 'zod';

import {
  WEEKDAYS,
  isClockTime,
  minutesOfDay,
  type ClockTime,
  type Weekday,
} from '@/shared/lib/business-time';

import type { RecurringRule } from './recurring-rule';

/** The recurring-rule form (RecurringBlockedSlotFormScreen). */
export type RecurringRuleFormInput = {
  /** A Weekday; the form keeps it as a number, as the schema reads it. */
  weekday: number;
  start: ClockTime;
  end: ClockTime;
  isActive: boolean;
  reason: string;
};

/** `POST` and `PUT /admin/recurring-blocked-slots`, in view-model terms. */
export type RecurringRuleInput = Omit<RecurringRuleFormInput, 'weekday'> & { weekday: Weekday };

export type RecurringRuleFormErrorKey = 'scheduleRecurringBlockedSlotFormValidationStartBeforeEnd';

/**
 * Validation on submit: the start before the end. Flutter reports it in a toast; here the end field
 * says it. An empty reason is saved empty (see `ruleReasonOf`).
 */
export const recurringRuleFormSchema = z
  .object({
    weekday: z.number().refine((value) => (WEEKDAYS as readonly number[]).includes(value)),
    start: z.string().refine(isClockTime),
    end: z.string().refine(isClockTime),
    isActive: z.boolean(),
    reason: z.string(),
  })
  .superRefine((values, context) => {
    if (
      isClockTime(values.start) &&
      isClockTime(values.end) &&
      minutesOfDay(values.start) >= minutesOfDay(values.end)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['end'],
        message: 'scheduleRecurringBlockedSlotFormValidationStartBeforeEnd',
      });
    }
  })
  .transform((values): RecurringRuleInput => ({
    weekday: values.weekday as Weekday,
    start: values.start,
    end: values.end,
    isActive: values.isActive,
    reason: values.reason.trim(),
  }));

/** A new rule starts on Monday from 11:00 to 11:30, active, as the Flutter form does. */
export function recurringRuleFormDefaults(rule: RecurringRule | null): RecurringRuleFormInput {
  if (!rule) return { weekday: 1, start: '11:00', end: '11:30', isActive: true, reason: '' };
  return {
    weekday: rule.weekday,
    start: rule.start,
    end: rule.end,
    isActive: rule.isActive,
    reason: rule.reason,
  };
}
