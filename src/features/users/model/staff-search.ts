import { z } from 'zod';

import type { BusinessDay } from '@/shared/lib/business-time';

import { USERS_PAGE_SIZE, type UserListParams } from './admin-user';
import { dateFilterOf, dateFilterQuery } from '@/shared/lib/date-filter';
import { listSearchShape } from './list-search';

export { searchWithDate, searchWithPage, searchWithText } from './list-search';

// Search parameters of `/admins`: the shared list parameters and the status.

export const STAFF_STATUSES = ['active', 'inactive'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

/** StaffListStatusFilter: every account or one status. */
export type StaffFilter = 'all' | StaffStatus;

export const staffSearchSchema = z.object({
  ...listSearchShape,
  status: z.enum(STAFF_STATUSES).optional().catch(undefined),
});

export type StaffSearch = z.infer<typeof staffSearchSchema>;

export function staffFilterOf(search: StaffSearch): StaffFilter {
  return search.status ?? 'all';
}

/** The search parameters with a status filter; the page goes back to the first. */
export function searchWithFilter(search: StaffSearch, filter: StaffFilter): StaffSearch {
  return { ...search, status: filter === 'all' ? undefined : filter, page: undefined };
}

/** What `GET /admin/users` receives for the current URL, with `today` in the salon. */
export function staffListParamsOf(search: StaffSearch, today: BusinessDay): UserListParams {
  return {
    role: 'admin',
    page: search.page ?? 1,
    pageSize: USERS_PAGE_SIZE,
    search: search.search ?? '',
    status: staffFilterOf(search),
    ...dateFilterQuery(dateFilterOf(search), today),
  };
}
