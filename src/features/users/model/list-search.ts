import { z } from 'zod';

import { dateFilterSearch, type DateFilter, type DateFilterSearch } from '@/shared/lib/date-filter';

import { dateFilterSearchSchema } from './date-filter';

// Search parameters every users list shares (`/admins`, `/clients`): the list filters live in the
// URL (ADR-003, "Data flow"), so a filtered list survives a reload and can be shared. An invalid
// value is dropped, never an error.

/** Optional free text: trimmed, and missing when empty. The router parses `?search=12` as a number. */
const text = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string().trim().min(1))
  .optional()
  .catch(undefined);

/** Search text, date filter, and page; each list adds its status. */
export const listSearchShape = {
  search: text,
  ...dateFilterSearchSchema,
  /** From 2 on; the first page leaves it out. */
  page: z
    .preprocess((value) => (typeof value === 'string' ? Number(value) : value), z.number().int().min(2))
    .optional()
    .catch(undefined),
};

type ListSearch = DateFilterSearch & { search?: string; page?: number };

/** The search parameters with a date filter; the page goes back to the first. */
export function searchWithDate<T extends ListSearch>(search: T, filter: DateFilter): T {
  return { ...search, ...dateFilterSearch(filter), page: undefined };
}

/** The search parameters with a new search text; the page goes back to the first. */
export function searchWithText<T extends ListSearch>(search: T, query: string): T {
  const trimmed = query.trim();
  return { ...search, search: trimmed || undefined, page: undefined };
}

export function searchWithPage<T extends ListSearch>(search: T, page: number): T {
  return { ...search, page: page > 1 ? page : undefined };
}
