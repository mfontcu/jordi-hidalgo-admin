import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import type { BlockedSlotListParams, RecurringRuleListParams } from '../model/blocked-slots-search';
import { scheduleKeys } from './schedule.keys';
import {
  toBlockedSlot,
  toBlockedSlotPage,
  toRecurringRule,
  toRecurringRuleList,
  toRuleException,
  toWorkingHours,
} from './schedule.mappers';

/**
 * Long enough for the screen to take over what its route loader fetched without asking again;
 * a later visit refetches, as the Flutter screens reload on entry. Writes invalidate at once.
 */
const STALE_TIME = 10_000;

/** `GET /admin/business-hours`. The backend names the days from `Accept-Language`. */
export function workingHoursQueryOptions() {
  return queryOptions({
    queryKey: scheduleKeys.workingHours(),
    queryFn: async ({ signal }) =>
      toWorkingHours(unwrap(await apiClient.GET('/admin/business-hours', { signal }))),
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

/** One page of `GET /admin/blocked-slots`, with the summary of the filters. */
export function blockedSlotsListQueryOptions(params: BlockedSlotListParams) {
  return queryOptions({
    queryKey: scheduleKeys.blockedSlotList(params),
    queryFn: async ({ signal }) => {
      const query = {
        page: params.page,
        page_size: params.pageSize,
        type: params.type,
        ...(params.search ? { search: params.search } : {}),
        ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
        ...(params.dateTo ? { date_to: params.dateTo } : {}),
      };
      return toBlockedSlotPage(
        unwrap(await apiClient.GET('/admin/blocked-slots', { params: { query }, signal })),
        params.page,
        params.pageSize,
      );
    },
    staleTime: STALE_TIME,
  });
}

export function blockedSlotDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: scheduleKeys.blockedSlot(id),
    queryFn: async ({ signal }) =>
      toBlockedSlot(
        unwrap(await apiClient.GET('/admin/blocked-slots/{id}', { params: { path: { id } }, signal })),
      ),
    staleTime: STALE_TIME,
  });
}

/** `GET /admin/recurring-blocked-slots`: every rule of the filters, which the list pages itself. */
export function recurringRulesQueryOptions(params: RecurringRuleListParams) {
  return queryOptions({
    queryKey: scheduleKeys.ruleList(params),
    queryFn: async ({ signal }) => {
      const query = {
        status: params.status,
        ...(params.weekday !== null ? { weekday: params.weekday } : {}),
      };
      return toRecurringRuleList(
        unwrap(await apiClient.GET('/admin/recurring-blocked-slots', { params: { query }, signal })),
      );
    },
    staleTime: STALE_TIME,
  });
}

export function recurringRuleDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: scheduleKeys.rule(id),
    queryFn: async ({ signal }) =>
      toRecurringRule(
        unwrap(
          await apiClient.GET('/admin/recurring-blocked-slots/{id}', { params: { path: { id } }, signal }),
        ),
      ),
    staleTime: STALE_TIME,
  });
}

/** The exceptions of a rule, in the backend's order. */
export function ruleExceptionsQueryOptions(id: string) {
  return queryOptions({
    queryKey: scheduleKeys.ruleExceptions(id),
    queryFn: async ({ signal }) =>
      unwrap(
        await apiClient.GET('/admin/recurring-blocked-slots/{id}/exceptions', {
          params: { path: { id } },
          signal,
        }),
      ).map(toRuleException),
    staleTime: STALE_TIME,
  });
}
