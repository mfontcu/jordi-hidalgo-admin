import {
  addDays,
  businessDayOf,
  businessToday,
  clockTimeOfInstant,
  formatClockTime,
  formatDay,
  isBusinessDay,
  type DateLocale,
} from '@/shared/lib/business-time';

import type { ActivityPayload } from './refresh';

/** Where the named instant sits relative to today in the salon. */
export type ActivityDay = 'today' | 'tomorrow' | 'date' | 'unknown';

/** The salon day and clock the notice names. `date` is set only when the day is neither today nor tomorrow. */
export type ActivityMoment = {
  day: ActivityDay;
  date: string;
  time: string;
};

/** The day and clock of the fact, in salon time. Today and tomorrow stay relative; any other day is a short date. */
export function activityMoment(
  payload: ActivityPayload,
  locale: DateLocale,
  now: number = Date.now(),
): ActivityMoment {
  const instant = present(payload.nextStart) ?? present(payload.previousStart);
  const clock = clockTimeOfInstant(instant);
  const time = clock ? formatClockTime(clock, locale, 'HH:mm') : '—';
  const fromPayload = payload.businessDay && isBusinessDay(payload.businessDay) ? payload.businessDay : null;
  const day = businessDayOf(instant) ?? fromPayload;
  if (!day) return { day: 'unknown', date: '', time };
  const today = businessToday(now);
  if (day === today) return { day: 'today', date: '', time };
  if (day === addDays(today, 1)) return { day: 'tomorrow', date: '', time };
  return { day: 'date', date: formatDay(day, locale, 'monthDay'), time };
}

function present(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : undefined;
}

type TimedNotice = {
  name: string;
  service: string | null;
  moment: ActivityMoment;
};

export type ActivityNotice =
  | (TimedNotice & { template: 'booked' | 'rescheduled' | 'cancelled' })
  | (TimedNotice & { template: 'slotWatchCreated' | 'slotWatchCancelled' | 'slotWatchHoldReleased' })
  | { template: 'clientRegistered' | 'clientAccountDeleted'; name: string };

const TEMPLATES = {
  'appointment.booked': 'booked',
  'appointment.rescheduled': 'rescheduled',
  'appointment.cancelled': 'cancelled',
  'slot_watch.created': 'slotWatchCreated',
  'slot_watch.cancelled': 'slotWatchCancelled',
  'slot_watch.hold_released': 'slotWatchHoldReleased',
  'client.registered': 'clientRegistered',
  'client.account_deleted': 'clientAccountDeleted',
} as const;

function noticeTemplate(kind: string): (typeof TEMPLATES)[keyof typeof TEMPLATES] | undefined {
  if (!Object.hasOwn(TEMPLATES, kind)) return undefined;
  return TEMPLATES[kind as keyof typeof TEMPLATES];
}

/**
 * The phrase pieces for an announced kind. `service` is null when the catalog has no name for the
 * id, and the sentence then uses the person's name and the time. Other kinds are not announced.
 */
export function activityNotice(
  kind: string,
  payload: ActivityPayload,
  serviceName: string | null,
  moment: ActivityMoment,
): ActivityNotice | null {
  const template = noticeTemplate(kind);
  if (!template) return null;
  const name = payload.customerName?.trim() ?? '';
  if (template === 'clientRegistered' || template === 'clientAccountDeleted') return { template, name };
  const service = serviceName?.trim() ? serviceName.trim() : null;
  return { template, name, service, moment };
}

/** The badge text. Above 9 the bell shows the overflow label. */
export function activityBadge(count: number, overflow: string): string | null {
  if (count <= 0) return null;
  return count > 9 ? overflow : String(count);
}
