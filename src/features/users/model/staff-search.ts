import { z } from 'zod';

import type { BusinessDay } from '@/shared/lib/business-time';

import { USERS_PAGE_SIZE, type UserListParams } from './admin-user';
import {
  dateFilterOf,
  dateFilterQuery,
  dateFilterSearch,
  dateFilterSearchSchema,
  type DateFilter,
} from './date-filter';

// Search parameters of `/admins`: the list filters live in the URL (ADR-003, "Data flow"), so a
// filtered list survives a reload and can be shared. An invalid value is dropped, never an error.

export const STAFF_STATUSES = ['active', 'inactive'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

/** StaffListStatusFilter: every account or one status. */
export type StaffFilter = 'all' | StaffStatus;

/** Optional free text: trimmed, and missing when empty. The router parses `?search=12` as a number. */
const text = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string().trim().min(1))
  .optional()
  .catch(undefined);

export const staffSearchSchema = z.object({
  search: text,
  status: z.enum(STAFF_STATUSES).optional().catch(undefined),
  ...dateFilterSearchSchema,
  /** From 2 on; the first page leaves it out. */
  page: z
    .preprocess((value) => (typeof value === 'string' ? Number(value) : value), z.number().int().min(2))
    .optional()
    .catch(undefined),
});

export type StaffSearch = z.infer<typeof staffSearchSchema>;

export function staffFilterOf(search: StaffSearch): StaffFilter {
  return search.status ?? 'all';
}

/** The search parameters with a status filter; the page goes back to the first. */
export function searchWithFilter(search: StaffSearch, filter: StaffFilter): StaffSearch {
  return { ...search, status: filter === 'all' ? undefined : filter, page: undefined };
}

/** The search parameters with a date filter; the page goes back to the first. */
export function searchWithDate(search: StaffSearch, filter: DateFilter): StaffSearch {
  return { ...search, ...dateFilterSearch(filter), page: undefined };
}

/** The search parameters with a new search text; the page goes back to the first. */
export function searchWithText(search: StaffSearch, query: string): StaffSearch {
  const trimmed = query.trim();
  return { ...search, search: trimmed || undefined, page: undefined };
}

export function searchWithPage(search: StaffSearch, page: number): StaffSearch {
  return { ...search, page: page > 1 ? page : undefined };
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
