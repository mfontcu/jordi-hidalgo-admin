import { addMinutes, minutesOfDay, type ClockTime, type Weekday } from '@/shared/lib/business-time';

// Working hours (WorkingHoursScreen, app_api AdminBusinessHours): each weekday is on or off and has
// up to two shifts. The backend keeps a list of slots per day; the panel shows the earliest as the
// morning shift and the next one as the afternoon shift (`_mapDays`).

export type Shift = { id: string; start: ClockTime; end: ClockTime };

export type ShiftSlot = 'morning' | 'afternoon';

export type WorkingDay = {
  weekday: Weekday;
  /** The backend's localized name of the day. */
  label: string;
  isActive: boolean;
  morning: Shift | null;
  afternoon: Shift | null;
};

export type WorkingHours = {
  days: WorkingDay[];
  summary: {
    activeDays: number;
    activeWeekendDays: number;
    /** 'HH:mm', or null when no day has a shift. */
    usualOpening: string | null;
    usualClosing: string | null;
  };
};

/** The shifts of a day from its slots, earliest first. */
export function shiftsOf(slots: readonly Shift[]): { morning: Shift | null; afternoon: Shift | null } {
  const sorted = [...slots].sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start));
  return { morning: sorted[0] ?? null, afternoon: sorted[1] ?? null };
}

/** A shift as the cards and the editor print it: "09:00 - 13:00". */
export function shiftRange(shift: Pick<Shift, 'start' | 'end'>): string {
  return `${shift.start} - ${shift.end}`;
}

/** What saving or deleting a shift sends. */
export type ShiftChange =
  | { kind: 'create'; weekday: Weekday; start: ClockTime; end: ClockTime }
  | { kind: 'update'; slotId: string; start: ClockTime; end: ClockTime }
  | { kind: 'delete'; slotId: string };

/** Saving a shift updates its slot, or creates one when the day has none in that place. */
export function shiftSaveOf(day: WorkingDay, slot: ShiftSlot, start: ClockTime, end: ClockTime): ShiftChange {
  const shift = day[slot];
  return shift
    ? { kind: 'update', slotId: shift.id, start, end }
    : { kind: 'create', weekday: day.weekday, start, end };
}

/** Deleting a shift the day does not have does nothing. */
export function shiftDeleteOf(day: WorkingDay, slot: ShiftSlot): ShiftChange | null {
  const shift = day[slot];
  return shift ? { kind: 'delete', slotId: shift.id } : null;
}

/** `_updateStartTime`: an end that no longer follows the start moves to half an hour after it. */
export function endAfterStartChange(start: ClockTime, end: ClockTime | null): ClockTime | null {
  return end === null || minutesOfDay(end) <= minutesOfDay(start) ? addMinutes(start, 30) : end;
}

export type ShiftErrors = {
  start?: 'required' | 'overlap';
  end?: 'required' | 'endAfterStart' | 'overlap';
  /** The other shift, for the overlap message. */
  overlapping?: Shift;
};

/**
 * The editor's validation (`_EditTimeRangeSheet`): both times, and the end after the start. The
 * panel also refuses a morning shift that runs into the afternoon one, or the reverse; Flutter
 * saves them, and the backend does not check (approved change).
 */
export function validateShift(
  day: WorkingDay,
  slot: ShiftSlot,
  start: ClockTime | null,
  end: ClockTime | null,
): ShiftErrors {
  const errors: ShiftErrors = {};
  if (start === null) errors.start = 'required';
  if (end === null) errors.end = 'required';
  if (start === null || end === null) return errors;
  if (minutesOfDay(end) <= minutesOfDay(start)) return { end: 'endAfterStart' };

  const other = slot === 'morning' ? day.afternoon : day.morning;
  if (!other) return errors;
  const overlaps =
    slot === 'morning'
      ? minutesOfDay(end) > minutesOfDay(other.start)
      : minutesOfDay(start) < minutesOfDay(other.end);
  if (!overlaps) return errors;
  // The field that runs into the other shift: the morning's end, the afternoon's start.
  return slot === 'morning'
    ? { end: 'overlap', overlapping: other }
    : { start: 'overlap', overlapping: other };
}
