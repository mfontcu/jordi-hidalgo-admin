import { z } from 'zod';

// Search parameters of `/services`: the list filters live in the URL (ADR-003, "Data flow"), so a
// filtered list survives a reload and can be shared. An invalid value is dropped, never an error.

export const SERVICE_STATUSES = ['active', 'inactive'] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

/** The page size of the Flutter list (AdminServicesController.pageSize). */
export const SERVICES_PAGE_SIZE = 10;

/** Optional free text: trimmed, and missing when empty. The router parses `?search=12` as a number. */
const text = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string().trim().min(1))
  .optional()
  .catch(undefined);

export const servicesSearchSchema = z.object({
  search: text,
  status: z.enum(SERVICE_STATUSES).optional().catch(undefined),
  /** Category code. */
  category: text,
  /** From 2 on; the first page leaves it out. */
  page: z
    .preprocess((value) => (typeof value === 'string' ? Number(value) : value), z.number().int().min(2))
    .optional()
    .catch(undefined),
});

export type ServicesSearch = z.infer<typeof servicesSearchSchema>;

/**
 * The list has one filter at a time, as the Flutter filter sheet: every service, a status, or a
 * category. A category wins over a status in a hand-written URL, as `_currentFilterToken` does.
 */
export type ServiceFilter = 'all' | ServiceStatus | `category:${string}`;

const CATEGORY_PREFIX = 'category:';

export function categoryFilter(code: string): ServiceFilter {
  return `${CATEGORY_PREFIX}${code}`;
}

/** The category code of a filter, or null for the others. */
export function filterCategoryCode(filter: ServiceFilter): string | null {
  return filter.startsWith(CATEGORY_PREFIX) ? filter.slice(CATEGORY_PREFIX.length) : null;
}

export function filterOf(search: ServicesSearch): ServiceFilter {
  if (search.category) return categoryFilter(search.category);
  return search.status ?? 'all';
}

/** The search parameters of a filter; the page goes back to the first. */
export function searchWithFilter(search: ServicesSearch, filter: ServiceFilter): ServicesSearch {
  const code = filterCategoryCode(filter);
  return {
    ...search,
    status: filter === 'active' || filter === 'inactive' ? filter : undefined,
    category: code ?? undefined,
    page: undefined,
  };
}

/** The search parameters with a new search text; the page goes back to the first. */
export function searchWithText(search: ServicesSearch, query: string): ServicesSearch {
  const trimmed = query.trim();
  return { ...search, search: trimmed || undefined, page: undefined };
}

export function searchWithPage(search: ServicesSearch, page: number): ServicesSearch {
  return { ...search, page: page > 1 ? page : undefined };
}

/** What `GET /admin/services` receives for the current URL. */
export type ServiceListParams = {
  page: number;
  pageSize: number;
  search: string;
  status: 'all' | ServiceStatus;
  categoryCode: string;
};

export function listParamsOf(search: ServicesSearch): ServiceListParams {
  const filter = filterOf(search);
  return {
    page: search.page ?? 1,
    pageSize: SERVICES_PAGE_SIZE,
    search: search.search ?? '',
    status: filter === 'active' || filter === 'inactive' ? filter : 'all',
    categoryCode: filterCategoryCode(filter) ?? '',
  };
}
