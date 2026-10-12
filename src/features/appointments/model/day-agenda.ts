import {
  addDays,
  addMinutes,
  businessDayOf,
  clockTimeOfInstant,
  compareInstants,
  formatDay,
  instantAt,
  instantFromEpoch,
  isPastOrNow,
  minutesOfDay,
  startOfWeek,
  weekdayOf,
  type BusinessDay,
  type ClockTime,
  type DateLocale,
  type Weekday,
} from '@/shared/lib/business-time';

import type { AppointmentItem } from './appointment';
import type { DayAgendaViewFilter } from './day-agenda-search';

// Day agenda (DayAgendaScreen): timeline math, filters, and summary. Salon minutes only — no
// browser zone. Flutter's layout lives in day_agenda_screen.dart (_computeDayAgendaTimelineLayouts).

/** Pixels per minute of the timeline lane (`_DayAgendaTimeline.pixelsPerMinute`). */
export const PIXELS_PER_MINUTE = 2;

export const TIME_GUTTER_WIDTH = 56;
export const LANE_HORIZONTAL_PADDING = 6;
export const BLOCK_HORIZONTAL_GAP = 4;
export const BLOCK_VERTICAL_GAP = 2;

/** A punctual or expanded recurring block on the agenda. */
export type AgendaBlock = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
  /** True when the id is `recurring:{ruleId}` (Flutter). */
  isRecurring: boolean;
};

/** A working-hours day as the agenda needs it to size the timeline and mark closed days. */
export type AgendaWorkingDay = {
  weekday: Weekday;
  isActive: boolean;
  shifts: { start: ClockTime; end: ClockTime }[];
};

/** An active recurring rule, expanded into a day's block when the weekday matches. */
export type AgendaRecurringRule = {
  id: string;
  weekday: Weekday;
  start: ClockTime;
  end: ClockTime;
  reason: string;
  isActive: boolean;
};

/** An appointment as the agenda filters and paints it. */
export type AgendaAppointment = AppointmentItem;

export type TimelineRange = {
  /** Minutes from midnight of the first hour shown. */
  startMinutes: number;
  /** Minutes from midnight of the last hour shown (exclusive end of the painted range). */
  endMinutes: number;
};

export type TimelineBlockGeometry = {
  top: number;
  height: number;
  column: number;
  columnCount: number;
};

export type AppointmentBlockLayout = TimelineBlockGeometry & { appointment: AgendaAppointment };
export type BlockedBlockLayout = TimelineBlockGeometry & { block: AgendaBlock };

export type TimelineLayouts = {
  appointments: AppointmentBlockLayout[];
  blockedSlots: BlockedBlockLayout[];
};

export type DayAgendaSummary = {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  noShow: number;
  rescheduled: number;
};

const FALLBACK_START = 8 * 60;
const FALLBACK_END = 21 * 60;

const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const containsFolded = (haystack: string, needle: string) => fold(haystack).includes(fold(needle.trim()));

/** Whether a working day is closed (inactive, or no active shift). */
export function isWorkingDayClosed(day: AgendaWorkingDay | undefined): boolean {
  if (!day?.isActive) return true;
  return day.shifts.length === 0;
}

export function workingDayOf(
  days: readonly AgendaWorkingDay[],
  day: BusinessDay,
): AgendaWorkingDay | undefined {
  const weekday = weekdayOf(day);
  return days.find((item) => item.weekday === weekday);
}

/**
 * Timeline range for one salon day from its working hours (`_resolveTimelineRange`). Closed or
 * empty days fall back to 08:00–21:00.
 */
export function timelineRangeForDay(day: BusinessDay, days: readonly AgendaWorkingDay[]): TimelineRange {
  const config = workingDayOf(days, day);
  if (!config || isWorkingDayClosed(config)) {
    return { startMinutes: FALLBACK_START, endMinutes: FALLBACK_END };
  }
  let minStart = 24 * 60;
  let maxEnd = 0;
  for (const shift of config.shifts) {
    const start = minutesOfDay(shift.start);
    const end = minutesOfDay(shift.end);
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;
  }
  if (maxEnd <= minStart) return { startMinutes: FALLBACK_START, endMinutes: FALLBACK_END };
  return { startMinutes: minStart, endMinutes: maxEnd };
}

/** Shared range across a week: earliest open to latest close (`_resolveWeekTimelineRange`). */
export function timelineRangeForWeek(
  weekDays: readonly BusinessDay[],
  days: readonly AgendaWorkingDay[],
): TimelineRange {
  let minStart = 24 * 60;
  let maxEnd = 0;
  for (const day of weekDays) {
    const range = timelineRangeForDay(day, days);
    if (range.startMinutes < minStart) minStart = range.startMinutes;
    if (range.endMinutes > maxEnd) maxEnd = range.endMinutes;
  }
  if (maxEnd <= minStart) return { startMinutes: FALLBACK_START, endMinutes: FALLBACK_END };
  return { startMinutes: minStart, endMinutes: maxEnd };
}

export function timelineTotalMinutes(range: TimelineRange): number {
  return Math.max(0, range.endMinutes - range.startMinutes);
}

/** Minutes of an API instant from the timeline's start clock, in salon time. */
export function minutesFromTimelineStart(instant: string, range: TimelineRange): number {
  const clock = clockTimeOfInstant(instant);
  if (!clock) return Number.NaN;
  return minutesOfDay(clock) - range.startMinutes;
}

function clipMinutes(
  startMin: number,
  endMin: number,
  total: number,
): { startMin: number; endMin: number } | null {
  if (endMin <= 0 || startMin >= total) return null;
  const visibleStart = Math.min(Math.max(startMin, 0), total);
  const visibleEnd = Math.min(Math.max(endMin, 0), total);
  if (visibleEnd <= visibleStart) return null;
  return { startMin: visibleStart, endMin: visibleEnd };
}

function layoutPriority(appointment: AgendaAppointment | null): number {
  if (!appointment) return 1;
  const status = appointment.status;
  if (status === 'cancelled') return 3;
  if (status === 'rescheduled') return 2;
  return 0;
}

function layoutHeightFromMinutes(durationMinutes: number): number {
  const raw = durationMinutes * PIXELS_PER_MINUTE;
  return Math.max(20, raw - BLOCK_VERTICAL_GAP);
}

function layoutTopFromMinutes(startMinutes: number): number {
  return startMinutes * PIXELS_PER_MINUTE + BLOCK_VERTICAL_GAP / 2;
}

type LayoutInput = {
  startMin: number;
  endMin: number;
  layoutPriority: number;
  appointment: AgendaAppointment | null;
  block: AgendaBlock | null;
};

/**
 * Column packing of overlapping blocks (`_computeTimelineLayoutsWithPriority`): operational
 * appointments prefer column 0; cancelled and rescheduled sort after.
 */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`Missing layout item at ${index}`);
  return item;
}

function packCluster(items: LayoutInput[]): TimelineBlockGeometry[] {
  if (items.length === 0) return [];
  const results: TimelineBlockGeometry[] = [];
  let clusterStart = 0;

  while (clusterStart < items.length) {
    let clusterEnd = clusterStart;
    let clusterMaxEnd = at(items, clusterStart).endMin;

    for (let i = clusterStart + 1; i < items.length; i += 1) {
      const candidate = at(items, i);
      if (candidate.startMin < clusterMaxEnd) {
        clusterEnd = i;
        if (candidate.endMin > clusterMaxEnd) clusterMaxEnd = candidate.endMin;
      } else {
        break;
      }
    }

    const clusterIndices = Array.from({ length: clusterEnd - clusterStart + 1 }, (_, i) => clusterStart + i);
    clusterIndices.sort((a, b) => {
      const byPriority = at(items, a).layoutPriority - at(items, b).layoutPriority;
      if (byPriority !== 0) return byPriority;
      return at(items, a).startMin - at(items, b).startMin;
    });

    const columnEnds: number[] = [];
    const itemColumns = new Map<number, number>();

    for (const index of clusterIndices) {
      const item = at(items, index);
      let column = 0;
      for (; column < columnEnds.length; column += 1) {
        const end = columnEnds[column];
        if (end !== undefined && item.startMin >= end) break;
      }
      if (column === columnEnds.length) columnEnds.push(item.endMin);
      else columnEnds[column] = item.endMin;
      itemColumns.set(index, column);
    }

    const columnCount = columnEnds.length || 1;
    for (const index of clusterIndices) {
      const item = at(items, index);
      results[index] = {
        top: layoutTopFromMinutes(item.startMin),
        height: layoutHeightFromMinutes(item.endMin - item.startMin),
        column: itemColumns.get(index) ?? 0,
        columnCount,
      };
    }

    clusterStart = clusterEnd + 1;
  }

  return results;
}

/** Absolute left of a column inside a lane (`_laneLeft`). */
export function laneLeft(laneWidth: number, column: number, columnCount: number): number {
  const innerWidth = laneWidth - LANE_HORIZONTAL_PADDING * 2;
  const columnWidth = (innerWidth - (columnCount - 1) * BLOCK_HORIZONTAL_GAP) / columnCount;
  return LANE_HORIZONTAL_PADDING + column * (columnWidth + BLOCK_HORIZONTAL_GAP);
}

/** Width of one column inside a lane (`_laneBlockWidth`). */
export function laneBlockWidth(laneWidth: number, columnCount: number): number {
  const innerWidth = laneWidth - LANE_HORIZONTAL_PADDING * 2;
  return (innerWidth - (columnCount - 1) * BLOCK_HORIZONTAL_GAP) / columnCount;
}

export type BlockDensity = 'compact' | 'medium' | 'full';

export function densityForHeight(height: number): BlockDensity {
  if (height < 34) return 'compact';
  if (height < 56) return 'medium';
  return 'full';
}

/**
 * Places appointments and blocks on the timeline (`_computeDayAgendaTimelineLayouts`). Items that
 * fall outside the painted range are dropped.
 */
export function computeTimelineLayouts(
  appointments: readonly AgendaAppointment[],
  blockedSlots: readonly AgendaBlock[],
  range: TimelineRange,
): TimelineLayouts {
  const total = timelineTotalMinutes(range);
  const inputs: LayoutInput[] = [];

  for (const appointment of appointments) {
    const clipped = clipMinutes(
      minutesFromTimelineStart(appointment.start, range),
      minutesFromTimelineStart(appointment.end, range),
      total,
    );
    if (!clipped) continue;
    inputs.push({
      startMin: clipped.startMin,
      endMin: clipped.endMin,
      layoutPriority: layoutPriority(appointment),
      appointment,
      block: null,
    });
  }

  for (const block of blockedSlots) {
    const clipped = clipMinutes(
      minutesFromTimelineStart(block.startAt, range),
      minutesFromTimelineStart(block.endAt, range),
      total,
    );
    if (!clipped) continue;
    inputs.push({
      startMin: clipped.startMin,
      endMin: clipped.endMin,
      layoutPriority: layoutPriority(null),
      appointment: null,
      block,
    });
  }

  if (inputs.length === 0) return { appointments: [], blockedSlots: [] };

  inputs.sort((a, b) => a.startMin - b.startMin);
  const geometries = packCluster(inputs);

  const appointmentLayouts: AppointmentBlockLayout[] = [];
  const blockedLayouts: BlockedBlockLayout[] = [];

  inputs.forEach((input, index) => {
    const geometry = at(geometries, index);
    if (input.appointment) {
      appointmentLayouts.push({ appointment: input.appointment, ...geometry });
    } else if (input.block) {
      blockedLayouts.push({ block: input.block, ...geometry });
    }
  });

  return { appointments: appointmentLayouts, blockedSlots: blockedLayouts };
}

/** Paint order for stacked appointment blocks (lower = behind). */
export function stackPaintRank(status: string): number {
  const key = status.trim().toLowerCase();
  if (key === 'cancelled') return 0;
  if (key === 'rescheduled') return 1;
  switch (key) {
    case 'completed':
      return 3;
    case 'no_show':
      return 4;
    case 'pending':
      return 5;
    case 'confirmed':
      return 6;
    default:
      return 2;
  }
}

export function sortAppointmentsForAgenda(items: readonly AgendaAppointment[]): AgendaAppointment[] {
  return [...items].sort((a, b) => {
    const byStart = compareInstants(a.start, b.start);
    if (byStart !== 0) return byStart;
    const aCancelled = a.status === 'cancelled';
    const bCancelled = b.status === 'cancelled';
    if (aCancelled === bCancelled) return 0;
    return aCancelled ? 1 : -1;
  });
}

export function matchesViewFilter(
  appointment: Pick<AgendaAppointment, 'status' | 'start'>,
  filter: DayAgendaViewFilter,
  now: number = Date.now(),
): boolean {
  const status = appointment.status;
  switch (filter) {
    case 'operational':
      return status === 'pending' || status === 'confirmed';
    case 'actionPending':
      return (status === 'pending' || status === 'confirmed') && isPastOrNow(appointment.start, now);
    case 'allNonCancelled':
      return status !== 'cancelled';
    case 'pending':
    case 'confirmed':
    case 'completed':
    case 'rescheduled':
    case 'cancelled':
      return status === filter;
    case 'no_show':
      return status === 'no_show';
    case 'all':
      return true;
  }
}

export function matchesSearchQuery(
  appointment: Pick<AgendaAppointment, 'customerName' | 'customerEmail' | 'customerPhone'>,
  query: string,
): boolean {
  if (!query.trim()) return true;
  return (
    containsFolded(appointment.customerName, query) ||
    containsFolded(appointment.customerEmail, query) ||
    containsFolded(appointment.customerPhone, query)
  );
}

export function filterAgendaAppointments(
  source: readonly AgendaAppointment[],
  options: {
    viewFilter: DayAgendaViewFilter;
    search: string;
    serviceId: string | null;
    now?: number;
  },
): AgendaAppointment[] {
  return source.filter((appointment) => {
    if (!matchesViewFilter(appointment, options.viewFilter, options.now)) return false;
    if (!matchesSearchQuery(appointment, options.search)) return false;
    if (options.serviceId && appointment.serviceId !== options.serviceId) return false;
    return true;
  });
}

export function servicesInDay(appointments: readonly AgendaAppointment[]): { id: string; name: string }[] {
  const seen = new Set<string>();
  const services: { id: string; name: string }[] = [];
  for (const appointment of appointments) {
    if (!appointment.serviceId || seen.has(appointment.serviceId)) continue;
    seen.add(appointment.serviceId);
    services.push({ id: appointment.serviceId, name: appointment.serviceName });
  }
  return services.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * DayAgendaAppointmentsSummary.fromAppointments: without listing filters, `total` is confirmed
 * only; with filters it is the filtered list length. `pending` counts still-to-attend.
 */
export function agendaSummaryOf(
  appointments: readonly AgendaAppointment[],
  applyListingFilters: boolean,
): DayAgendaSummary {
  let confirmed = 0;
  let stillToAttend = 0;
  let completed = 0;
  let cancelled = 0;
  let noShow = 0;
  let rescheduled = 0;

  for (const appointment of appointments) {
    const status = appointment.status;
    if (status === 'pending' || status === 'confirmed') {
      stillToAttend += 1;
      if (status === 'confirmed') confirmed += 1;
    } else if (status === 'completed') completed += 1;
    else if (status === 'cancelled') cancelled += 1;
    else if (status === 'no_show') noShow += 1;
    else if (status === 'rescheduled') rescheduled += 1;
  }

  return {
    total: applyListingFilters ? appointments.length : confirmed,
    pending: stillToAttend,
    completed,
    cancelled,
    noShow,
    rescheduled,
  };
}

/** Whether a punctual block overlaps a salon day. */
export function blockOverlapsDay(block: Pick<AgendaBlock, 'startAt' | 'endAt'>, day: BusinessDay): boolean {
  const startDay = businessDayOf(block.startAt);
  const endDay = businessDayOf(block.endAt);
  if (!startDay || !endDay) return false;
  return startDay <= day && endDay >= day;
}

/** Expand active recurring rules for one salon day (`_expandRecurringBlockedSlots`). */
export function expandRecurringBlocks(
  rules: readonly AgendaRecurringRule[],
  day: BusinessDay,
): AgendaBlock[] {
  const weekday = weekdayOf(day);
  return rules
    .filter((rule) => rule.isActive && rule.weekday === weekday)
    .map((rule) => {
      const startAt = instantAt(day, rule.start);
      let endAt = instantAt(day, rule.end);
      if (compareInstants(endAt, startAt) <= 0) {
        endAt = instantAt(day, addMinutes(rule.start, 15));
      }
      return {
        id: `recurring:${rule.id}`,
        startAt,
        endAt,
        reason: rule.reason.trim(),
        isRecurring: true,
      };
    });
}

export function blocksForDay(
  punctual: readonly AgendaBlock[],
  rules: readonly AgendaRecurringRule[],
  day: BusinessDay,
): AgendaBlock[] {
  return [
    ...punctual
      .filter((block) => blockOverlapsDay(block, day))
      .map((block) => ({ ...block, isRecurring: false })),
    ...expandRecurringBlocks(rules, day),
  ];
}

/** Label of a block when it has no reason. */
export function blockLabelOf(
  block: AgendaBlock,
  recurringFallback: string,
  timedFallback: (timeRange: string) => string,
): string {
  if (block.reason.trim()) return block.reason.trim();
  if (block.isRecurring) return recurringFallback;
  const start = clockTimeOfInstant(block.startAt) ?? '--:--';
  const end = clockTimeOfInstant(block.endAt) ?? '--:--';
  return timedFallback(`${start}–${end}`);
}

/** Week range label as Flutter's `appointmentWeekRangeLabel` (Monday–Sunday of the anchor). */
export function weekRangeLabel(anchor: BusinessDay, locale: DateLocale): string {
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  return `${formatDay(start, locale, 'listDate')} – ${formatDay(end, locale, 'listDate')}`;
}

export function appointmentTimeRange(appointment: Pick<AgendaAppointment, 'start' | 'end'>): string {
  const start = clockTimeOfInstant(appointment.start) ?? '--:--';
  const end = clockTimeOfInstant(appointment.end) ?? '--:--';
  return `${start}–${end}`;
}

/** Hours to paint as grid lines (inclusive start hour, exclusive end if not on the hour). */
export function hourMarksOf(range: TimelineRange): number[] {
  const startHour = Math.floor(range.startMinutes / 60);
  const endHour = Math.ceil(range.endMinutes / 60);
  const marks: number[] = [];
  for (let hour = startHour; hour <= endHour; hour += 1) marks.push(hour);
  return marks;
}

/** Top offset of the "now" line inside a timeline; null when outside the range. */
export function nowIndicatorTop(range: TimelineRange, now: number = Date.now()): number | null {
  const clock = clockTimeOfInstant(instantFromEpoch(now));
  if (!clock) return null;
  const minutes = minutesOfDay(clock) - range.startMinutes;
  const total = timelineTotalMinutes(range);
  if (minutes < 0 || minutes * PIXELS_PER_MINUTE > total * PIXELS_PER_MINUTE) return null;
  return minutes * PIXELS_PER_MINUTE;
}
