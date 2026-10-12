import { addDays, businessToday, compareDays, type BusinessDay } from '@/shared/lib/business-time';

// Availability overview (AvailabilityOverviewScreen): bookable days and clock slots for one
// public service, same endpoints as customer booking.

export type AvailabilityService = {
  id: string;
  name: string;
  durationMinutes: number;
  categoryLabel: string;
  displayOrder: number;
};

export type AvailabilitySlot = {
  time: string;
  isAvailable: boolean;
};

export type AvailabilitySummary = {
  availableSlotCount: number;
  totalSlotCount: number;
  bookableDayCount: number;
  freePercentLabel: string;
  firstAvailableTime: string | null;
  lastAvailableTime: string | null;
};

/** Summary cards of the overview. */
export function availabilitySummaryOf(
  slots: readonly AvailabilitySlot[],
  bookableDays: readonly BusinessDay[],
): AvailabilitySummary {
  const available = slots.filter((slot) => slot.isAvailable);
  const total = slots.length;
  const freePercentLabel = total === 0 ? '—' : `${Math.round((100 * available.length) / total)}%`;
  return {
    availableSlotCount: available.length,
    totalSlotCount: total,
    bookableDayCount: bookableDays.length,
    freePercentLabel,
    firstAvailableTime: available[0]?.time ?? null,
    lastAvailableTime: available.at(-1)?.time ?? null,
  };
}

/**
 * First bookable day for the calendar (`_resolveDefaultBookableDay`): today if bookable, else the
 * next on or after today, else the latest past day, else today.
 */
export function defaultBookableDay(
  bookableDays: readonly BusinessDay[],
  today: BusinessDay = businessToday(),
): BusinessDay {
  if (bookableDays.length === 0) return today;
  if (bookableDays.some((day) => day === today)) return today;

  let nextOnOrAfter: BusinessDay | null = null;
  for (const day of bookableDays) {
    if (compareDays(day, today) >= 0) {
      if (nextOnOrAfter === null || compareDays(day, nextOnOrAfter) < 0) nextOnOrAfter = day;
    }
  }
  if (nextOnOrAfter) return nextOnOrAfter;

  let latest: BusinessDay | null = null;
  for (const day of bookableDays) {
    if (latest === null || compareDays(day, latest) > 0) latest = day;
  }
  return latest ?? today;
}

export function isBookableDay(day: BusinessDay, bookableDays: readonly BusinessDay[]): boolean {
  return bookableDays.includes(day);
}

/** Calendar first day: today in the salon. */
export function calendarFirstDay(today: BusinessDay = businessToday()): BusinessDay {
  return today;
}

/**
 * Calendar last day: at least 400 days ahead, or 60 days past the latest bookable day when that is
 * further (`calendarLastDate`).
 */
export function calendarLastDay(
  bookableDays: readonly BusinessDay[],
  today: BusinessDay = businessToday(),
): BusinessDay {
  const floor = addDays(today, 400);
  if (bookableDays.length === 0) return floor;
  let maxBookable = bookableDays[0] ?? today;
  for (const day of bookableDays) {
    if (compareDays(day, maxBookable) > 0) maxBookable = day;
  }
  const extended = addDays(maxBookable, 60);
  return compareDays(extended, floor) < 0 ? floor : extended;
}

export function clampDay(day: BusinessDay, first: BusinessDay, last: BusinessDay): BusinessDay {
  if (compareDays(day, first) < 0) return first;
  if (compareDays(day, last) > 0) return last;
  return day;
}

/** Folded search over public services (name, category). */
export function filterServices(
  services: readonly AvailabilityService[],
  query: string,
): AvailabilityService[] {
  const needle = fold(query.trim());
  if (!needle) return [...services];
  return services.filter(
    (service) => fold(service.name).includes(needle) || fold(service.categoryLabel).includes(needle),
  );
}

const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Duration as Flutter prints it on the context line ("30 min"). */
export function formatDurationMinutes(minutes: number): string {
  return `${minutes} min`;
}
