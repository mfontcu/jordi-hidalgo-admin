import { z } from 'zod';

import type { BusinessDay, Weekday } from '@/shared/lib/business-time';
import {
  dateFilterOf,
  dateFilterQuery,
  dateFilterSearch,
  dateFilterSearchSchemaFor,
  type DateFilter,
} from '@/shared/lib/date-filter';

import { BLOCKED_SLOTS_PAGE_SIZE } from './blocked-slot';

// Search parameters of `/schedule/blocked-slots`: the tab (`punctual`, the default, or `recurring`,
// as the Flutter panel links them) and each tab's filters and page. Flutter keeps the filters in
// the screen and starts each tab afresh when it opens, so switching tabs drops the other's filters.
// An invalid value is dropped, never an error.

export const BLOCKED_SLOT_TABS = ['punctual', 'recurring'] as const;
export type BlockedSlotTab = (typeof BLOCKED_SLOT_TABS)[number];

/** BlockedSlotDatePreset, without "all" (no parameter) and "custom" (`from` and `to`). */
export const BLOCKED_SLOT_DATE_PRESETS = ['today', 'next7Days', 'month', 'nextMonth'] as const;

/** The date sheet's options in order (BlockedSlotDatePreset.values). */
export const BLOCKED_SLOT_DATE_PICKS = ['all', ...BLOCKED_SLOT_DATE_PRESETS, 'custom'] as const;

/** BlockedSlotTypeFilter, without "all". */
export const BLOCKED_SLOT_TYPES = ['fullDay', 'range'] as const;
export type BlockedSlotType = (typeof BLOCKED_SLOT_TYPES)[number];
export type BlockedSlotTypeFilter = 'all' | BlockedSlotType;

/** RecurringBlockedSlotStatusFilter; the list opens on the active rules, as Flutter's does. */
export type RecurringStatusFilter = 'all' | 'active' | 'inactive';

/** Optional free text: trimmed, and missing when empty. The router parses `?search=12` as a number. */
const text = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string().trim().min(1))
  .optional()
  .catch(undefined);

const number = (min: number, max = Number.MAX_SAFE_INTEGER) =>
  z
    .preprocess(
      (value) => (typeof value === 'string' ? Number(value) : value),
      z.number().int().min(min).max(max),
    )
    .optional()
    .catch(undefined);

export const blockedSlotsSearchSchema = z.object({
  tab: z.enum(BLOCKED_SLOT_TABS).optional().catch(undefined),
  /** Punctual tab: search by reason, date, and type. */
  search: text,
  ...dateFilterSearchSchemaFor(BLOCKED_SLOT_DATE_PRESETS),
  type: z.enum(BLOCKED_SLOT_TYPES).optional().catch(undefined),
  /** Recurring tab: day of the week and status; without `status`, the active rules. */
  weekday: number(1, 7),
  status: z.enum(['all', 'inactive']).optional().catch(undefined),
  /** Either tab's page, from 2 on; the first page leaves it out. */
  page: number(2),
});

export type BlockedSlotsSearch = z.infer<typeof blockedSlotsSearchSchema>;

export function tabOf(search: BlockedSlotsSearch): BlockedSlotTab {
  return search.tab ?? 'punctual';
}

/** The URL of a tab: `punctual` leaves the parameter out, as AdminRouter.blockedSlotsPath does. */
export function searchWithTab(tab: BlockedSlotTab): BlockedSlotsSearch {
  return { tab: tab === 'punctual' ? undefined : tab };
}

export function searchWithPage<T extends BlockedSlotsSearch>(search: T, page: number): T {
  return { ...search, page: page > 1 ? page : undefined };
}

// Punctual tab.

export function punctualDateFilterOf(search: BlockedSlotsSearch): DateFilter {
  return dateFilterOf(search);
}

export function searchWithText(search: BlockedSlotsSearch, query: string): BlockedSlotsSearch {
  const trimmed = query.trim();
  return { ...search, search: trimmed || undefined, page: undefined };
}

export function searchWithDate(search: BlockedSlotsSearch, filter: DateFilter): BlockedSlotsSearch {
  const dates = dateFilterSearch(filter);
  return {
    ...search,
    date: dates.date as BlockedSlotsSearch['date'],
    from: dates.from,
    to: dates.to,
    page: undefined,
  };
}

export function typeFilterOf(search: BlockedSlotsSearch): BlockedSlotTypeFilter {
  return search.type ?? 'all';
}

export function searchWithType(search: BlockedSlotsSearch, type: BlockedSlotTypeFilter): BlockedSlotsSearch {
  return { ...search, type: type === 'all' ? undefined : type, page: undefined };
}

/** What `GET /admin/blocked-slots` receives for the current URL. */
export type BlockedSlotListParams = {
  page: number;
  pageSize: number;
  search: string;
  dateFrom?: string;
  dateTo?: string;
  /** blockedSlotTypeFilterApiValue. */
  type: 'all' | 'full_day' | 'range';
};

export function blockedSlotListParamsOf(
  search: BlockedSlotsSearch,
  today: BusinessDay,
): BlockedSlotListParams {
  const type = typeFilterOf(search);
  return {
    page: search.page ?? 1,
    pageSize: BLOCKED_SLOTS_PAGE_SIZE,
    search: search.search ?? '',
    ...dateFilterQuery(punctualDateFilterOf(search), today),
    type: type === 'fullDay' ? 'full_day' : type,
  };
}

// Recurring tab.

/** The schema keeps only 1 to 7. */
export function weekdayFilterOf(search: BlockedSlotsSearch): Weekday | null {
  return (search.weekday ?? null) as Weekday | null;
}

export function searchWithWeekday(search: BlockedSlotsSearch, weekday: Weekday | null): BlockedSlotsSearch {
  return { ...search, weekday: weekday ?? undefined, page: undefined };
}

export function statusFilterOf(search: BlockedSlotsSearch): RecurringStatusFilter {
  return search.status ?? 'active';
}

export function searchWithStatus(
  search: BlockedSlotsSearch,
  status: RecurringStatusFilter,
): BlockedSlotsSearch {
  return { ...search, status: status === 'active' ? undefined : status, page: undefined };
}

/** What `GET /admin/recurring-blocked-slots` receives: every rule of the filters, unpaged. */
export type RecurringRuleListParams = { weekday: Weekday | null; status: RecurringStatusFilter };

export function recurringRuleListParamsOf(search: BlockedSlotsSearch): RecurringRuleListParams {
  return { weekday: weekdayFilterOf(search), status: statusFilterOf(search) };
}
