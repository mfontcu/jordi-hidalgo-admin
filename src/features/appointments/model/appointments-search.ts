import { z } from 'zod';

import type { BusinessDay } from '@/shared/lib/business-time';
import {
  dateFilterOf,
  dateFilterQuery,
  dateFilterSearch,
  dateFilterSearchSchemaFor,
  type DateFilter,
  type DatePick,
} from '@/shared/lib/date-filter';

import { APPOINTMENTS_PAGE_SIZE } from './appointment';

// Search parameters of `/appointments`: filters live in the URL (ADR-003), where Flutter kept them
// in the screen. The list opens on today, as AppointmentScreen does; there is no "every day".

/** AppointmentListStatusFilter, without "all". */
export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as const;
export type AppointmentStatusFilter = 'all' | (typeof APPOINTMENT_STATUSES)[number];

/** AppointmentDatePreset, without "custom" (`from` and `to`). */
export const APPOINTMENT_DATE_PRESETS = ['today', 'tomorrow', 'thisWeek', 'thisMonth'] as const;

/** The date sheet's options in order (AppointmentDatePreset.values). */
export const APPOINTMENT_DATE_PICKS = [
  ...APPOINTMENT_DATE_PRESETS,
  'custom',
] as const satisfies readonly DatePick[];

/** Optional free text: trimmed, and missing when empty. The router parses `?search=12` as a number. */
const text = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string().trim().min(1))
  .optional()
  .catch(undefined);

export const appointmentsSearchSchema = z.object({
  search: text,
  status: z.enum(APPOINTMENT_STATUSES).optional().catch(undefined),
  ...dateFilterSearchSchemaFor(APPOINTMENT_DATE_PRESETS),
  /** From 2 on; the first page leaves it out. */
  page: z
    .preprocess((value) => (typeof value === 'string' ? Number(value) : value), z.number().int().min(2))
    .optional()
    .catch(undefined),
});

export type AppointmentsSearch = z.infer<typeof appointmentsSearchSchema>;

export function statusFilterOf(search: AppointmentsSearch): AppointmentStatusFilter {
  return search.status ?? 'all';
}

/**
 * The date filter of the URL. Without a date or range, the list is today (Flutter's default);
 * "all" never applies here.
 */
export function appointmentDateFilterOf(search: AppointmentsSearch): DateFilter {
  const filter = dateFilterOf(search);
  return filter.kind === 'all' ? { kind: 'today' } : filter;
}

/** Whether the URL's filters differ from the list's default (today, every status, no search). */
export function hasActiveListFilters(search: AppointmentsSearch): boolean {
  if (search.search || search.status) return true;
  const filter = appointmentDateFilterOf(search);
  return filter.kind !== 'today';
}

export function searchWithText(search: AppointmentsSearch, query: string): AppointmentsSearch {
  const trimmed = query.trim();
  return { ...search, search: trimmed || undefined, page: undefined };
}

export function searchWithStatus(
  search: AppointmentsSearch,
  status: AppointmentStatusFilter,
): AppointmentsSearch {
  return { ...search, status: status === 'all' ? undefined : status, page: undefined };
}

export function searchWithDate(search: AppointmentsSearch, filter: DateFilter): AppointmentsSearch {
  // Today is the default: leave it out of the URL, as Flutter opens without a stored preset.
  const next = filter.kind === 'today' ? { kind: 'all' as const } : filter;
  const dates = dateFilterSearch(next);
  return {
    ...search,
    date: dates.date as AppointmentsSearch['date'],
    from: dates.from,
    to: dates.to,
    page: undefined,
  };
}

export function searchWithPage(search: AppointmentsSearch, page: number): AppointmentsSearch {
  return { ...search, page: page > 1 ? page : undefined };
}

/** What `GET /admin/appointments` receives for the current URL. */
export type AppointmentListParams = {
  page: number;
  pageSize: number;
  search: string;
  status: AppointmentStatusFilter;
  dateFrom: string;
  dateTo: string;
};

export function listParamsOf(search: AppointmentsSearch, today: BusinessDay): AppointmentListParams {
  const dates = dateFilterQuery(appointmentDateFilterOf(search), today);
  return {
    page: search.page ?? 1,
    pageSize: APPOINTMENTS_PAGE_SIZE,
    search: search.search ?? '',
    status: statusFilterOf(search),
    dateFrom: dates.dateFrom ?? '',
    dateTo: dates.dateTo ?? '',
  };
}
