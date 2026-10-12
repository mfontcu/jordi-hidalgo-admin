import { z } from 'zod';

import type { BusinessDay } from '@/shared/lib/business-time';

import { USERS_PAGE_SIZE, type UserListParams } from './admin-user';
import { dateFilterOf, dateFilterQuery } from './date-filter';
import { listSearchShape } from './list-search';

// Search parameters of `/clients`: the shared list parameters and the status, kept in the URL as
// the value `GET /admin/users` takes (clientListStatusFilterApiValue).

/** ClientListStatusFilter, in the filter sheet's order, without "all". */
export const CLIENT_STATUSES = [
  'active',
  'inactive',
  'blocked',
  'with_upcoming_appointment',
  'without_upcoming_appointment',
  'new_this_month',
] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export type ClientFilter = 'all' | ClientStatus;

/** The label of each filter (clientListStatusFilterLabel). */
export const CLIENT_FILTER_LABELS = {
  all: 'clientFilterAll',
  active: 'clientFilterVerified',
  inactive: 'clientFilterUnverified',
  blocked: 'clientFilterBlocked',
  with_upcoming_appointment: 'clientFilterWithUpcoming',
  without_upcoming_appointment: 'clientFilterWithoutUpcoming',
  new_this_month: 'clientFilterNewThisMonth',
} as const satisfies Record<ClientFilter, string>;

export const clientsSearchSchema = z.object({
  ...listSearchShape,
  status: z.enum(CLIENT_STATUSES).optional().catch(undefined),
});

export type ClientsSearch = z.infer<typeof clientsSearchSchema>;

export function clientFilterOf(search: ClientsSearch): ClientFilter {
  return search.status ?? 'all';
}

/** The search parameters with a status filter; the page goes back to the first. */
export function searchWithClientFilter(search: ClientsSearch, filter: ClientFilter): ClientsSearch {
  return { ...search, status: filter === 'all' ? undefined : filter, page: undefined };
}

/** What `GET /admin/users` receives for the current URL, with `today` in the salon. */
export function clientsListParamsOf(search: ClientsSearch, today: BusinessDay): UserListParams {
  return {
    role: 'customer',
    page: search.page ?? 1,
    pageSize: USERS_PAGE_SIZE,
    search: search.search ?? '',
    status: clientFilterOf(search),
    ...dateFilterQuery(dateFilterOf(search), today),
  };
}
