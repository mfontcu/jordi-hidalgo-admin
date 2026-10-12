import type { QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';
import type { BusinessDay, Weekday } from '@/shared/lib/business-time';

import type { BlockedSlot } from '../model/blocked-slot';
import type { BlockedSlotInput } from '../model/blocked-slot-form';
import type { RecurringRule, RuleException } from '../model/recurring-rule';
import type { RecurringRuleInput } from '../model/recurring-rule-form';
import type { ShiftChange, WorkingHours } from '../model/working-hours';
import { scheduleKeys } from './schedule.keys';
import { toBlockedSlot, toRecurringRule, toRuleException, toWorkingHours } from './schedule.mappers';

// Writes of the schedule feature. Each one names the queries it changes next to the call; the
// hooks run them as TanStack Query mutations.

// Working hours: every write answers with the whole schedule, which replaces the stored one.

function storeWorkingHours(queryClient: QueryClient, hours: WorkingHours) {
  queryClient.setQueryData(scheduleKeys.workingHours(), hours);
  return hours;
}

/** `PATCH /admin/business-hours/weekdays/{weekday}`: the day on or off. */
export async function setWeekdayActive(queryClient: QueryClient, weekday: Weekday, isActive: boolean) {
  const result = await apiClient.PATCH('/admin/business-hours/weekdays/{weekday}', {
    params: { path: { weekday } },
    body: { isActive },
  });
  return storeWorkingHours(queryClient, toWorkingHours(unwrap(result)));
}

/** Creates, updates, or deletes a shift (`/admin/business-hours/slots`). Shifts are saved active. */
export async function changeShift(queryClient: QueryClient, change: ShiftChange) {
  switch (change.kind) {
    case 'create': {
      const body = { weekday: change.weekday, startTime: change.start, endTime: change.end, isActive: true };
      const result = await apiClient.POST('/admin/business-hours/slots', { body });
      return storeWorkingHours(queryClient, toWorkingHours(unwrap(result)));
    }
    case 'update': {
      const result = await apiClient.PATCH('/admin/business-hours/slots/{slotID}', {
        params: { path: { slotID: change.slotId } },
        body: { startTime: change.start, endTime: change.end, isActive: true },
      });
      return storeWorkingHours(queryClient, toWorkingHours(unwrap(result)));
    }
    case 'delete': {
      const result = await apiClient.DELETE('/admin/business-hours/slots/{slotID}', {
        params: { path: { slotID: change.slotId } },
      });
      return storeWorkingHours(queryClient, toWorkingHours(unwrap(result)));
    }
  }
}

// Punctual blocked slots.

const slotBody = (input: BlockedSlotInput) => ({
  start_at: input.startAt,
  end_at: input.endAt,
  reason: input.reason,
  show_on_public_site: input.showOnPublicSite,
});

/** Keeps the block the backend answered with, and refreshes the lists (counts and order). */
async function storeBlockedSlot(queryClient: QueryClient, slot: BlockedSlot) {
  queryClient.setQueryData(scheduleKeys.blockedSlot(slot.id), slot);
  await queryClient.invalidateQueries({ queryKey: scheduleKeys.blockedSlotLists() });
  return slot;
}

export async function createBlockedSlot(queryClient: QueryClient, input: BlockedSlotInput) {
  const result = await apiClient.POST('/admin/blocked-slots', { body: slotBody(input) });
  return storeBlockedSlot(queryClient, toBlockedSlot(unwrap(result)));
}

export async function updateBlockedSlot(queryClient: QueryClient, id: string, input: BlockedSlotInput) {
  const result = await apiClient.PUT('/admin/blocked-slots/{id}', {
    params: { path: { id } },
    body: slotBody(input),
  });
  return storeBlockedSlot(queryClient, toBlockedSlot(unwrap(result)));
}

export async function deleteBlockedSlot(queryClient: QueryClient, id: string) {
  unwrap(await apiClient.DELETE('/admin/blocked-slots/{id}', { params: { path: { id } } }));
  queryClient.removeQueries({ queryKey: scheduleKeys.blockedSlot(id) });
  await queryClient.invalidateQueries({ queryKey: scheduleKeys.blockedSlotLists() });
}

// Recurring rules.

const ruleBody = (input: RecurringRuleInput) => ({
  weekday: input.weekday,
  start_time: input.start,
  end_time: input.end,
  reason: input.reason,
  is_active: input.isActive,
});

async function storeRule(queryClient: QueryClient, rule: RecurringRule) {
  queryClient.setQueryData(scheduleKeys.rule(rule.id), rule);
  await queryClient.invalidateQueries({ queryKey: scheduleKeys.ruleLists() });
  return rule;
}

export async function createRule(queryClient: QueryClient, input: RecurringRuleInput) {
  const result = await apiClient.POST('/admin/recurring-blocked-slots', { body: ruleBody(input) });
  return storeRule(queryClient, toRecurringRule(unwrap(result)));
}

export async function updateRule(queryClient: QueryClient, id: string, input: RecurringRuleInput) {
  const result = await apiClient.PUT('/admin/recurring-blocked-slots/{id}', {
    params: { path: { id } },
    body: ruleBody(input),
  });
  return storeRule(queryClient, toRecurringRule(unwrap(result)));
}

/** Activating or deactivating sends the whole rule with the new status, as Flutter does. */
export function setRuleActive(queryClient: QueryClient, rule: RecurringRule, isActive: boolean) {
  return updateRule(queryClient, rule.id, { ...rule, isActive });
}

export async function deleteRule(queryClient: QueryClient, id: string) {
  unwrap(await apiClient.DELETE('/admin/recurring-blocked-slots/{id}', { params: { path: { id } } }));
  queryClient.removeQueries({ queryKey: scheduleKeys.rule(id) });
  queryClient.removeQueries({ queryKey: scheduleKeys.ruleExceptions(id) });
  await queryClient.invalidateQueries({ queryKey: scheduleKeys.ruleLists() });
}

/**
 * `POST /admin/recurring-blocked-slots/{id}/exceptions`: opens one occurrence of the rule
 * (`unblock`, the only action the panel offers). The new exception goes first, as Flutter adds it.
 */
export async function createRuleException(
  queryClient: QueryClient,
  ruleId: string,
  date: BusinessDay,
  reason: string,
) {
  const result = await apiClient.POST('/admin/recurring-blocked-slots/{id}/exceptions', {
    params: { path: { id: ruleId } },
    body: { date, action: 'unblock', reason },
  });
  const exception = toRuleException(unwrap(result));
  queryClient.setQueryData<RuleException[]>(scheduleKeys.ruleExceptions(ruleId), (current) => [
    exception,
    ...(current ?? []),
  ]);
  return exception;
}
