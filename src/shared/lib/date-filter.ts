import { z } from 'zod';

import {
  addDays,
  addMonths,
  compareDays,
  dayEndInstant,
  dayStartInstant,
  endOfMonth,
  formatDay,
  isBusinessDay,
  startOfMonth,
  weekdayOf,
  type BusinessDay,
  type DateLocale,
  type DateStyle,
} from './business-time';

// The date filter of the lists: every row, a preset, or a range of salon days. It lives in the URL
// as `date=<preset>` or `from` and `to`. The users lists (StaffDatePreset, ClientDatePreset) offer
// today and this month; the blocked slots (BlockedSlotDatePreset), the next seven days and next
// month too. Days are salon days (Europe/Madrid), where Flutter takes the browser's.

/**
 * Presets the lists share. Users and blocked slots pick a subset; appointments use today,
 * tomorrow, this week, and this month (AppointmentDatePreset).
 */
export const DATE_PRESETS = [
  'today',
  'tomorrow',
  'thisWeek',
  'thisMonth',
  'next7Days',
  'month',
  'nextMonth',
] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export type DateFilter =
  { kind: 'all' } | { kind: DatePreset } | { kind: 'range'; from: BusinessDay; to: BusinessDay };

/** What the date sheet offers: every row, a preset, or "Choose a range…". */
export type DatePick = 'all' | DatePreset | 'custom';

const day = z
  .string()
  .refine((value) => isBusinessDay(value))
  .optional()
  .catch(undefined);

/** The search parameters of a date filter with these presets; an invalid value is dropped. */
export function dateFilterSearchSchemaFor<P extends DatePreset>(presets: readonly [P, ...P[]]) {
  return {
    date: z.enum(presets).optional().catch(undefined),
    from: day,
    to: day,
  };
}

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

/** Monday of the salon week that contains `day` (Dart `weekday - 1` from Monday). */
export function startOfWeek(day: BusinessDay): BusinessDay {
  return addDays(day, 1 - weekdayOf(day));
}

/** The salon days a filter covers on `today` (blockedSlotDateRangeForPreset); null for every row. */
export function dateFilterRange(
  filter: DateFilter,
  today: BusinessDay,
): { from: BusinessDay; to: BusinessDay } | null {
  switch (filter.kind) {
    case 'all':
      return null;
    case 'today':
      return { from: today, to: today };
    case 'tomorrow': {
      const tomorrow = addDays(today, 1);
      return { from: tomorrow, to: tomorrow };
    }
    case 'thisWeek': {
      const start = startOfWeek(today);
      return { from: start, to: addDays(start, 6) };
    }
    case 'thisMonth':
    case 'month':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case 'next7Days':
      return { from: today, to: addDays(today, 6) };
    case 'nextMonth': {
      const next = addMonths(today, 1);
      return { from: next, to: endOfMonth(next) };
    }
    case 'range':
      return { from: filter.from, to: filter.to };
  }
}

/** What a list receives: from the first second of the first day to the last of the last. */
export function dateFilterQuery(
  filter: DateFilter,
  today: BusinessDay,
): { dateFrom?: string; dateTo?: string } {
  const range = dateFilterRange(filter, today);
  return range ? { dateFrom: dayStartInstant(range.from), dateTo: dayEndInstant(range.to) } : {};
}

/**
 * The toolbar label of a range: both days, or one when they are the same. The users lists print
 * them as `DateFormat.MMMd` (clientDateRangeToolbarLabel), the blocked slots as `d MMM`
 * (blockedSlotDateRangeToolbarLabel).
 */
export function dateRangeLabel(
  from: BusinessDay,
  to: BusinessDay,
  locale: DateLocale,
  style: Extract<DateStyle, 'monthDay' | 'dayMonth'> = 'monthDay',
): string {
  const start = formatDay(from, locale, style);
  const end = formatDay(to, locale, style);
  return start === end ? start : `${start} · ${end}`;
}

/** The filter a pick applies at once; null for "Choose a range…", which opens the range picker. */
export function filterOfPick(pick: DatePick): DateFilter | null {
  if (pick === 'custom') return null;
  return pick === 'all' ? { kind: 'all' } : { kind: pick };
}
