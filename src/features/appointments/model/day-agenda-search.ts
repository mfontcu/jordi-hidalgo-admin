import { z } from 'zod';

import { addDays, isBusinessDay, startOfWeek, type BusinessDay } from '@/shared/lib/business-time';

// Search parameters of `/schedule/day-agenda`. Flutter kept them in the screen; the panel keeps
// the day, scope, view filter, layers, service, and search in the URL (ADR-003).

export const DAY_AGENDA_SCOPES = ['day', 'week'] as const;
export type DayAgendaScope = (typeof DAY_AGENDA_SCOPES)[number];

export const DAY_AGENDA_VIEW_FILTERS = [
  'operational',
  'actionPending',
  'allNonCancelled',
  'pending',
  'confirmed',
  'completed',
  'rescheduled',
  'cancelled',
  'no_show',
  'all',
] as const;
export type DayAgendaViewFilter = (typeof DAY_AGENDA_VIEW_FILTERS)[number];

const text = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string().trim().min(1))
  .optional()
  .catch(undefined);

const dayParam = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string())
  .refine(isBusinessDay)
  .optional()
  .catch(undefined);

const boolFlag = z
  .preprocess((value) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return undefined;
  }, z.boolean().optional())
  .catch(undefined);

export const dayAgendaSearchSchema = z.object({
  day: dayParam,
  scope: z.enum(DAY_AGENDA_SCOPES).optional().catch(undefined),
  view: z.enum(DAY_AGENDA_VIEW_FILTERS).optional().catch(undefined),
  search: text,
  serviceId: text,
  /** `false` hides the appointments layer; missing means shown. */
  appointments: boolFlag,
  /** `false` hides the blocked-slots layer; missing means shown. */
  blocked: boolFlag,
});

export type DayAgendaSearch = z.infer<typeof dayAgendaSearchSchema>;

export function dayOf(search: DayAgendaSearch, today: BusinessDay): BusinessDay {
  return search.day ?? today;
}

export function scopeOf(search: DayAgendaSearch): DayAgendaScope {
  return search.scope ?? 'day';
}

export function viewFilterOf(search: DayAgendaSearch): DayAgendaViewFilter {
  return search.view ?? 'all';
}

export function showAppointmentsOf(search: DayAgendaSearch): boolean {
  return search.appointments !== false;
}

export function showBlockedSlotsOf(search: DayAgendaSearch): boolean {
  return search.blocked !== false;
}

/** Compact layouts force the day scope, as Flutter does under 900 px. */
export function layoutScopeOf(search: DayAgendaSearch, isCompact: boolean): DayAgendaScope {
  return isCompact ? 'day' : scopeOf(search);
}

export function hasActiveAgendaFilters(search: DayAgendaSearch): boolean {
  return (
    viewFilterOf(search) !== 'all' ||
    Boolean(search.search) ||
    Boolean(search.serviceId) ||
    search.appointments === false ||
    search.blocked === false
  );
}

/** Inclusive salon-day bounds the agenda loads for the current scope. */
export function agendaBoundsOf(
  day: BusinessDay,
  scope: DayAgendaScope,
): { dateFrom: BusinessDay; dateTo: BusinessDay } {
  if (scope === 'day') return { dateFrom: day, dateTo: day };
  const start = startOfWeek(day);
  return { dateFrom: start, dateTo: addDays(start, 6) };
}

export function searchWithDay(search: DayAgendaSearch, day: BusinessDay): DayAgendaSearch {
  return { ...search, day };
}

export function searchWithScope(search: DayAgendaSearch, scope: DayAgendaScope): DayAgendaSearch {
  return { ...search, scope: scope === 'day' ? undefined : scope };
}

export function searchWithView(search: DayAgendaSearch, view: DayAgendaViewFilter): DayAgendaSearch {
  return { ...search, view: view === 'all' ? undefined : view };
}

export function searchWithText(search: DayAgendaSearch, query: string): DayAgendaSearch {
  const trimmed = query.trim();
  return { ...search, search: trimmed || undefined };
}

export function searchWithService(search: DayAgendaSearch, serviceId: string | null): DayAgendaSearch {
  return { ...search, serviceId: serviceId?.trim() ? serviceId.trim() : undefined };
}

export function searchWithAppointments(search: DayAgendaSearch, show: boolean): DayAgendaSearch {
  return { ...search, appointments: show ? undefined : false };
}

export function searchWithBlocked(search: DayAgendaSearch, show: boolean): DayAgendaSearch {
  return { ...search, blocked: show ? undefined : false };
}

export function searchShiftPeriod(
  search: DayAgendaSearch,
  delta: number,
  scope: DayAgendaScope,
  today: BusinessDay,
): DayAgendaSearch {
  const step = scope === 'week' ? delta * 7 : delta;
  return { ...search, day: addDays(dayOf(search, today), step) };
}
