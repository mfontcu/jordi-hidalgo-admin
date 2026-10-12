import {
  addMinutesToInstant,
  businessDayOf,
  clockTimeOfInstant,
  compareDays,
  compareInstants,
  formatClockTime,
  formatDay,
  isBusinessDay,
  isClockTime,
  type BusinessDay,
  type ClockTime,
  type DateLocale,
} from '@/shared/lib/business-time';

/**
 * An open slot watch as the demand screen shows it (SlotWatch in app_models). Dates are salon days;
 * the instants stay as the API sent them.
 */
export type SlotWatch = {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  status: string;
  dates: BusinessDay[];
  timeFrom: string;
  timeTo: string;
  preferredStart: string | null;
  linkedAppointmentId: string;
  linkedAppointmentStart: string | null;
  linkedAppointmentStatus: string;
  heldSlotStart: string | null;
  holdExpiresAt: string | null;
  notifyCount: number;
  expiresAt: string;
  createdAt: string;
};

/** Page size of the Flutter list (AdminSlotWatchesController.pageSize). */
export const SLOT_WATCH_PAGE_SIZE = 10;

/** Watches that expire inside this window count as "expiring soon" (48 hours). */
export const EXPIRING_SOON_MINUTES = 48 * 60;

export type SlotWatchStatus = 'active' | 'held';

/** `status == 'held'` (SlotWatch.isHeld). */
export function isHeld(watch: Pick<SlotWatch, 'status'>): boolean {
  return watch.status === 'held';
}

/** A watch that already has an appointment and wants a better time (SlotWatch.isUpgrade). */
export function isUpgrade(watch: Pick<SlotWatch, 'linkedAppointmentId'>): boolean {
  return watch.linkedAppointmentId !== '';
}

/** The name on the row: the display name, else the email (slotWatchClientName). */
export function clientName(watch: Pick<SlotWatch, 'userDisplayName' | 'userEmail'>): string {
  const name = watch.userDisplayName.trim();
  return name || watch.userEmail;
}

/** The service on the row: its name, else its id (slotWatchServiceName). */
export function serviceName(watch: Pick<SlotWatch, 'serviceName' | 'serviceId'>): string {
  const name = watch.serviceName.trim();
  return name || watch.serviceId;
}

/** How the requested hours are written (slotWatchTimeWindowLabel), before the "any time" copy. */
export type TimeWindow =
  | { kind: 'any' }
  | { kind: 'range'; from: string; to: string }
  | { kind: 'from'; from: string }
  | { kind: 'until'; to: string };

export function timeWindow(watch: Pick<SlotWatch, 'timeFrom' | 'timeTo'>): TimeWindow {
  const from = watch.timeFrom.trim();
  const to = watch.timeTo.trim();
  if (!from && !to) return { kind: 'any' };
  if (from && to) return { kind: 'range', from, to };
  if (from) return { kind: 'from', from };
  return { kind: 'until', to };
}

/** A clock the window can print, padded HH:mm (slotWatchClock); the raw text when it is not a clock. */
export function windowClock(time: string, locale: DateLocale): string {
  return isClockTime(time) ? formatClockTime(time, locale, 'HH:mm') : time;
}

/**
 * `dd/MM` from the panel's numeric date (`dd/MM/yyyy`), which is how the Flutter table shortens a
 * day that shares its year with the others (slotWatchShortDate).
 */
export function shortNumericDay(day: BusinessDay, locale: DateLocale): string {
  return formatDay(day, locale, 'numericDate').slice(0, 5);
}

/** The days column: one full date, or short dates joined when they share a year (slotWatchDatesLabel). */
export function datesLabel(dates: readonly BusinessDay[], locale: DateLocale): string {
  const sorted = [...dates].sort(compareDays);
  const first = sorted[0];
  if (!first) return '';
  if (sorted.length === 1) return formatDay(first, locale, 'numericDate');
  const year = first.slice(0, 4);
  const sameYear = sorted.every((day) => day.startsWith(year));
  return sorted
    .map((day) => (sameYear ? shortNumericDay(day, locale) : formatDay(day, locale, 'numericDate')))
    .join(', ');
}

/** The expires column (slotWatchShortDate of the salon day). A dash when the instant is missing. */
export function expiresLabel(instant: string, locale: DateLocale): string {
  const day = businessDayOf(instant);
  return day ? shortNumericDay(day, locale) : '—';
}

/** `dd/MM HH:mm` in salon time (slotWatchDateTime). A dash when the instant cannot be read. */
export function shortDateTime(instant: string | null, locale: DateLocale): string {
  if (!instant) return '—';
  const day = businessDayOf(instant);
  const time = clockTimeOfInstant(instant);
  if (!day || !time) return '—';
  return `${shortNumericDay(day, locale)} ${formatClockTime(time, locale, 'HH:mm')}`;
}

/** The hold's salon clock, when the watch is held and the expiry can be read. */
export function holdClock(watch: Pick<SlotWatch, 'status' | 'holdExpiresAt'>): ClockTime | null {
  if (!isHeld(watch)) return null;
  return clockTimeOfInstant(watch.holdExpiresAt);
}

export type SlotWatchCounts = {
  active: number;
  held: number;
  upgrades: number;
  expiringSoon: number;
};

/** Summary cards over the loaded list, not the filtered page (the controller's counts). */
export function watchCounts(items: readonly SlotWatch[], now: string): SlotWatchCounts {
  const limit = addMinutesToInstant(now, EXPIRING_SOON_MINUTES);
  return {
    active: items.filter((watch) => watch.status === 'active').length,
    held: items.filter(isHeld).length,
    upgrades: items.filter(isUpgrade).length,
    expiringSoon: items.filter((watch) => compareInstants(watch.expiresAt, limit) < 0).length,
  };
}

export type ServiceOption = { id: string; name: string };

/** Services present in the loaded list, by name (serviceOptions). */
export function serviceOptions(items: readonly SlotWatch[]): ServiceOption[] {
  const byId = new Map<string, string>();
  for (const watch of items) {
    if (watch.serviceId) byId.set(watch.serviceId, serviceName(watch));
  }
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

export type SlotWatchFilters = {
  serviceId?: string;
  status?: SlotWatchStatus;
  search: string;
};

/** Client-side filters of the loaded list (filteredItems): service, status, and name or email. */
export function filterWatches(items: readonly SlotWatch[], filters: SlotWatchFilters): SlotWatch[] {
  const query = filters.search.trim().toLowerCase();
  return items.filter((watch) => {
    if (filters.serviceId && watch.serviceId !== filters.serviceId) return false;
    if (filters.status === 'active' && isHeld(watch)) return false;
    if (filters.status === 'held' && !isHeld(watch)) return false;
    if (!query) return true;
    return (
      watch.userDisplayName.toLowerCase().includes(query) || watch.userEmail.toLowerCase().includes(query)
    );
  });
}

export function pageOf<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  if (start >= items.length) return [];
  return items.slice(start, start + pageSize);
}

/** The page the list can show: the last one when the request ran past the end ( _clampPage). */
export function clampPage(total: number, page: number, pageSize: number): number {
  const pages = total === 0 ? 1 : Math.ceil(total / pageSize);
  return Math.min(Math.max(page, 1), pages);
}

/** A clock time from the API, or empty when it is missing or not HH:mm. */
export function clockOrEmpty(value: string | null | undefined): string {
  const time = value?.trim() ?? '';
  return isClockTime(time) ? time : '';
}

/** Salon days from the API, dropping anything that is not YYYY-MM-DD. */
export function businessDays(values: readonly string[] | undefined): BusinessDay[] {
  return (values ?? []).filter(isBusinessDay);
}
