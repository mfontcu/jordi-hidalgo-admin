import { z } from 'zod';

import {
  dayEndInstant,
  dayStartInstant,
  endOfMonth,
  formatDay,
  isBusinessDay,
  startOfMonth,
  compareDays,
  type BusinessDay,
  type DateLocale,
} from '@/shared/lib/business-time';

// The registration-date filter of the users lists (StaffDatePreset, ClientDatePreset): every
// account, today, this month, or a range of salon days. It lives in the URL as `date=today|month`
// or `from` and `to`; days are salon days (Europe/Madrid), where Flutter takes the browser's.

export const DATE_PRESETS = ['today', 'month'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export type DateFilter =
  { kind: 'all' } | { kind: DatePreset } | { kind: 'range'; from: BusinessDay; to: BusinessDay };

const day = z
  .string()
  .refine((value) => isBusinessDay(value))
  .optional()
  .catch(undefined);

/** The search parameters of the date filter; an invalid value is dropped. */
export const dateFilterSearchSchema = {
  date: z.enum(DATE_PRESETS).optional().catch(undefined),
  from: day,
  to: day,
};

export type DateFilterSearch = { date?: DatePreset; from?: BusinessDay; to?: BusinessDay };

/** A range wins over a preset in a hand-written URL; a range that ends before it starts is none. */
export function dateFilterOf(search: DateFilterSearch): DateFilter {
  if (search.from && search.to && compareDays(search.from, search.to) <= 0) {
    return { kind: 'range', from: search.from, to: search.to };
  }
  return search.date ? { kind: search.date } : { kind: 'all' };
}

export function dateFilterSearch(filter: DateFilter): DateFilterSearch {
  switch (filter.kind) {
    case 'all':
      return { date: undefined, from: undefined, to: undefined };
    case 'range':
      return { date: undefined, from: filter.from, to: filter.to };
    default:
      return { date: filter.kind, from: undefined, to: undefined };
  }
}

/** The salon days a filter covers on `today`; null for every account. */
export function dateFilterRange(
  filter: DateFilter,
  today: BusinessDay,
): { from: BusinessDay; to: BusinessDay } | null {
  switch (filter.kind) {
    case 'all':
      return null;
    case 'today':
      return { from: today, to: today };
    case 'month':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case 'range':
      return { from: filter.from, to: filter.to };
  }
}

/** What `GET /admin/users` receives: from the first second of the first day to the last of the last. */
export function dateFilterQuery(
  filter: DateFilter,
  today: BusinessDay,
): { dateFrom?: string; dateTo?: string } {
  const range = dateFilterRange(filter, today);
  return range ? { dateFrom: dayStartInstant(range.from), dateTo: dayEndInstant(range.to) } : {};
}

/**
 * The toolbar label of a range (clientDateRangeToolbarLabel): both days as `DateFormat.MMMd`, or
 * one when they are the same.
 */
export function dateRangeLabel(from: BusinessDay, to: BusinessDay, locale: DateLocale): string {
  const start = formatDay(from, locale, 'monthDay');
  const end = formatDay(to, locale, 'monthDay');
  return start === end ? start : `${start} · ${end}`;
}

/** The options of the date sheet (AdminDateQuickPick), in order. */
export const DATE_QUICK_PICKS = ['allTime', 'today', 'thisMonth', 'custom'] as const;
export type DateQuickPick = (typeof DATE_QUICK_PICKS)[number];
