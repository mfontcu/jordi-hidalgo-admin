import { TZDate } from '@date-fns/tz';

// Salon business time (ADR-003, "Business time"): the only module that parses, builds, and formats
// dates. A salon day is a `BusinessDay` ('YYYY-MM-DD' in Europe/Madrid), whatever the browser zone;
// the API receives instants (ISO 8601 in UTC) and sends them back.

export const BUSINESS_TIME_ZONE = 'Europe/Madrid';

/** A salon calendar day, 'YYYY-MM-DD'. */
export type BusinessDay = string;

/** A salon clock time, 'HH:mm' from 00:00 to 23:59, as business hours and recurring rules carry it. */
export type ClockTime = string;

/** A day of the week as the API numbers it: 1 is Monday, 7 is Sunday (Dart's `DateTime.weekday`). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export type DateLocale = 'es' | 'ca' | 'en';

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTES_PER_DAY = 24 * 60;

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

function partsOf(day: BusinessDay): { year: number; month: number; date: number } {
  const match = DAY_PATTERN.exec(day);
  if (!match) throw new Error(`Not a business day: ${day}`);
  return { year: Number(match[1]), month: Number(match[2]) - 1, date: Number(match[3]) };
}

function dayOf(date: TZDate): BusinessDay {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whether `value` is a real calendar day written 'YYYY-MM-DD'. */
export function isBusinessDay(value: string): boolean {
  const match = DAY_PATTERN.exec(value);
  if (!match) return false;
  const { year, month, date } = partsOf(value);
  const check = new TZDate(year, month, date, BUSINESS_TIME_ZONE);
  return check.getFullYear() === year && check.getMonth() === month && check.getDate() === date;
}

/** Today in the salon. */
export function businessToday(now: number = Date.now()): BusinessDay {
  return dayOf(new TZDate(now, BUSINESS_TIME_ZONE));
}

/** The salon day of an instant from the API; null when it is missing or unreadable. */
export function businessDayOf(instant: string | null | undefined): BusinessDay | null {
  if (!instant) return null;
  const time = Date.parse(instant);
  return Number.isNaN(time) ? null : dayOf(new TZDate(time, BUSINESS_TIME_ZONE));
}

export function addDays(day: BusinessDay, days: number): BusinessDay {
  const { year, month, date } = partsOf(day);
  return dayOf(new TZDate(year, month, date + days, BUSINESS_TIME_ZONE));
}

export function startOfMonth(day: BusinessDay): BusinessDay {
  const { year, month } = partsOf(day);
  return dayOf(new TZDate(year, month, 1, BUSINESS_TIME_ZONE));
}

export function endOfMonth(day: BusinessDay): BusinessDay {
  const { year, month } = partsOf(day);
  return dayOf(new TZDate(year, month + 1, 0, BUSINESS_TIME_ZONE));
}

/** The first day of the month `months` away from `day`'s. */
export function addMonths(day: BusinessDay, months: number): BusinessDay {
  const { year, month } = partsOf(day);
  return dayOf(new TZDate(year, month + months, 1, BUSINESS_TIME_ZONE));
}

/** Negative, zero, or positive, as `a` is before, the same as, or after `b`. */
export function compareDays(a: BusinessDay, b: BusinessDay): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The day of the week of a salon day. */
export function weekdayOf(day: BusinessDay): Weekday {
  const { year, month, date } = partsOf(day);
  const sundayFirst = new TZDate(year, month, date, BUSINESS_TIME_ZONE).getDay();
  return (sundayFirst === 0 ? 7 : sundayFirst) as Weekday;
}

/** Monday of the salon week that contains `day` (Dart `weekday` 1 = Monday). */
export function startOfWeek(day: BusinessDay): BusinessDay {
  return addDays(day, 1 - weekdayOf(day));
}

/** The seven salon days of the week that contains `day`, Monday first. */
export function weekDaysOf(day: BusinessDay): BusinessDay[] {
  const start = startOfWeek(day);
  return [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(start, offset));
}

/**
 * The first `weekday` from `from` on. With `includeFrom`, `from` itself counts
 * (scheduleNextRecurringOccurrenceFromModel); without it, the same weekday is a week later
 * (scheduleNextDateForWeekday).
 */
export function nextDayOfWeekday(from: BusinessDay, weekday: Weekday, includeFrom: boolean): BusinessDay {
  const ahead = (weekday - weekdayOf(from) + 7) % 7;
  return addDays(from, ahead === 0 && !includeFrom ? 7 : ahead);
}

/** Whether `value` is a clock time written 'HH:mm'. */
export function isClockTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/**
 * A clock time from the API or a field ('9:00', '09:00 '), as 'HH:mm'; null when it is not one
 * (parseAdminTimeOfDay).
 */
export function parseClockTime(value: string | null | undefined): ClockTime | null {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value?.trim() ?? '');
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${pad(hours)}:${pad(minutes)}`;
}

/** Minutes from midnight of a clock time. */
export function minutesOfDay(time: ClockTime): number {
  const match = TIME_PATTERN.exec(time);
  if (!match) throw new Error(`Not a clock time: ${time}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** The clock time `minutes` from midnight, held between 00:00 and 23:59 (`_addMinutes`'s clamp). */
export function clockTimeOf(minutes: number): ClockTime {
  const held = Math.min(Math.max(Math.trunc(minutes), 0), MINUTES_PER_DAY - 1);
  return `${pad(Math.floor(held / 60))}:${pad(held % 60)}`;
}

/** A clock time moved by `minutes`, held between 00:00 and 23:59. */
export function addMinutes(time: ClockTime, minutes: number): ClockTime {
  return clockTimeOf(minutesOfDay(time) + minutes);
}

/**
 * The instant of a salon day at a salon clock time, as the API takes it. On the spring change a
 * time that does not exist (02:00–02:59) moves forward by the hour skipped, and on the autumn
 * change a time that happens twice is the first one, in summer time, as JavaScript and Dart
 * build local times.
 */
export function instantAt(day: BusinessDay, time: ClockTime): string {
  const { year, month, date } = partsOf(day);
  const minutes = minutesOfDay(time);
  const local = new TZDate(year, month, date, Math.floor(minutes / 60), minutes % 60, BUSINESS_TIME_ZONE);
  return new Date(local.getTime()).toISOString();
}

/** An instant `minutes` later, as the API takes it (an appointment's end from its duration). */
export function addMinutesToInstant(instant: string, minutes: number): string {
  const time = Date.parse(instant);
  return Number.isNaN(time) ? instant : new Date(time + minutes * 60_000).toISOString();
}

/** An API instant from an epoch millisecond (the "now" line of the day agenda). */
export function instantFromEpoch(epochMs: number = Date.now()): string {
  return new Date(epochMs).toISOString();
}

/** Negative, zero, or positive, as instant `a` is before, the same as, or after `b`. */
export function compareInstants(a: string, b: string): number {
  return Date.parse(a) - Date.parse(b);
}

/** Whether an instant is still to come. An unreadable instant is not. */
export function isFuture(instant: string, now: number = Date.now()): boolean {
  const time = Date.parse(instant);
  return !Number.isNaN(time) && time > now;
}

/**
 * Whether a block closes a whole salon day: it starts at 00:00 and lasts until 23:59 of that day
 * or later, in salon time. Flutter and the backend take any block of 23 hours or more, which
 * misses the 23-hour spring day; the panel saves a full day from 00:00 to 23:59 as Flutter does.
 */
export function isFullDayRange(startInstant: string, endInstant: string): boolean {
  const startDay = businessDayOf(startInstant);
  const endDay = businessDayOf(endInstant);
  const start = clockTimeOfInstant(startInstant);
  const end = clockTimeOfInstant(endInstant);
  if (!startDay || !endDay || !start || !end || start !== '00:00') return false;
  return compareDays(endDay, startDay) > 0 || end === '23:59';
}

/** The instant a salon day starts (00:00:00), as the API takes it. */
export function dayStartInstant(day: BusinessDay): string {
  const { year, month, date } = partsOf(day);
  return new Date(new TZDate(year, month, date, BUSINESS_TIME_ZONE).getTime()).toISOString();
}

/** The last second of a salon day (23:59:59), as the Flutter range filters send it. */
export function dayEndInstant(day: BusinessDay): string {
  const { year, month, date } = partsOf(day);
  return new Date(new TZDate(year, month, date, 23, 59, 59, BUSINESS_TIME_ZONE).getTime()).toISOString();
}

/** A salon day as a date at its midnight in the salon zone, for the calendar. */
export function dayToDate(day: BusinessDay): Date {
  const { year, month, date } = partsOf(day);
  return new TZDate(year, month, date, BUSINESS_TIME_ZONE);
}

/** The salon day a calendar date stands for. */
export function dateToDay(value: Date): BusinessDay {
  return dayOf(new TZDate(value.getTime(), BUSINESS_TIME_ZONE));
}

// Month names of the Flutter panel (package intl 0.20.2, date_symbol_data_local.dart): the format
// forms (`MONTHS`, `SHORTMONTHS`), which in Catalan carry the preposition ("d’oct."). date-fns
// differs (Spanish "sep" for "sept", Catalan "oct." for "d’oct."), so the panel keeps intl's.
const MONTHS: Record<DateLocale, readonly string[]> = {
  es: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  ca: [
    'de gener',
    'de febrer',
    'de març',
    'd’abril',
    'de maig',
    'de juny',
    'de juliol',
    'd’agost',
    'de setembre',
    'd’octubre',
    'de novembre',
    'de desembre',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

const SHORT_MONTHS: Record<DateLocale, readonly string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
  ca: [
    'de gen.',
    'de febr.',
    'de març',
    'd’abr.',
    'de maig',
    'de juny',
    'de jul.',
    'd’ag.',
    'de set.',
    'd’oct.',
    'de nov.',
    'de des.',
  ],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/**
 * Date formats of the Flutter panel, with the intl patterns they stand for:
 * - `listDate`: `DateFormat('d MMM y')`, the same pattern in every language (list columns).
 * - `mediumDate`: `DateFormat.yMMMd` (es "d MMM y", ca "d MMM 'del' y", en "MMM d, y").
 * - `monthDay`: `DateFormat.MMMd` (es and ca "d MMM", en "MMM d").
 * - `longDate`: `DateFormat.yMMMMd` (es "d 'de' MMMM 'de' y", ca "d MMMM 'del' y", en "MMMM d, y").
 * - `numericDate`: "dd/MM/yyyy" in every language (the appointment date label of app_api).
 * - `paddedListDate`: `DateFormat('dd MMM y')` in every language (formatScheduleListDate).
 * - `dayMonth`: `DateFormat('d MMM')` in every language (formatScheduleShortDate), where `monthDay`
 *   puts the month first in English.
 */
export type DateStyle =
  'listDate' | 'mediumDate' | 'monthDay' | 'longDate' | 'numericDate' | 'paddedListDate' | 'dayMonth';

const STANDALONE_MONTHS: Record<DateLocale, readonly string[]> = {
  es: MONTHS.es,
  ca: [
    'gener',
    'febrer',
    'març',
    'abril',
    'maig',
    'juny',
    'juliol',
    'agost',
    'setembre',
    'octubre',
    'novembre',
    'desembre',
  ],
  en: MONTHS.en,
};

/** `DateFormat.yMMMM`, a day's month: "octubre de 2026", "octubre del 2026", "October 2026". */
export function formatMonth(day: BusinessDay, locale: DateLocale): string {
  const { year, month } = partsOf(day);
  const name = STANDALONE_MONTHS[locale][month] ?? '';
  if (locale === 'en') return `${name} ${year}`;
  return locale === 'ca' ? `${name} del ${year}` : `${name} de ${year}`;
}

/** A salon day as the Flutter panel prints it. */
export function formatDay(day: BusinessDay, locale: DateLocale, style: DateStyle): string {
  const { year, month, date } = partsOf(day);
  const short = SHORT_MONTHS[locale][month] ?? '';
  const long = MONTHS[locale][month] ?? '';
  switch (style) {
    case 'listDate':
      return `${date} ${short} ${year}`;
    case 'mediumDate':
      if (locale === 'en') return `${short} ${date}, ${year}`;
      return locale === 'ca' ? `${date} ${short} del ${year}` : `${date} ${short} ${year}`;
    case 'monthDay':
      return locale === 'en' ? `${short} ${date}` : `${date} ${short}`;
    case 'longDate':
      if (locale === 'en') return `${long} ${date}, ${year}`;
      return locale === 'ca' ? `${date} ${long} del ${year}` : `${date} de ${long} de ${year}`;
    case 'numericDate':
      return `${pad(date)}/${pad(month + 1)}/${pad(year, 4)}`;
    case 'paddedListDate':
      return `${pad(date)} ${short} ${year}`;
    case 'dayMonth':
      return `${date} ${short}`;
  }
}

// `DateFormat.E` (intl's STANDALONESHORTWEEKDAYS), Monday first.
const SHORT_WEEKDAYS: Record<DateLocale, readonly string[]> = {
  es: ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'],
  ca: ['dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.', 'dg.'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

/** A weekday's short name, `DateFormat.E` ("lun", "dl.", "Mon"). */
export function formatWeekdayShort(weekday: Weekday, locale: DateLocale): string {
  return SHORT_WEEKDAYS[locale][weekday - 1] ?? '';
}

/** An instant from the API as the Flutter panel prints its day; a dash when it is missing. */
export function formatInstant(instant: string | null | undefined, locale: DateLocale, style: DateStyle) {
  const day = businessDayOf(instant);
  return day ? formatDay(day, locale, style) : '—';
}

/** The salon clock time of an instant, 'HH:mm'; null when it is missing or unreadable. */
export function clockTimeOfInstant(instant: string | null | undefined): ClockTime | null {
  if (!instant) return null;
  const time = Date.parse(instant);
  if (Number.isNaN(time)) return null;
  const date = new TZDate(time, BUSINESS_TIME_ZONE);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * How a clock time is printed: `Hm` is `DateFormat.Hm`, "H:mm" in Spanish and Catalan and "HH:mm"
 * in English; `HH:mm` pads the hour in every language (app_api labels, formatAdminTimeOfDay).
 */
export type ClockStyle = 'Hm' | 'HH:mm';

export function formatClockTime(time: ClockTime, locale: DateLocale, clock: ClockStyle): string {
  return clock === 'Hm' && locale !== 'en' && time.startsWith('0') ? time.slice(1) : time;
}

/**
 * An instant's salon day and time, "{day} · {time}"; a dash when missing. The client screens use
 * `DateFormat.Hm` (formatClientDateTime), the appointment labels of app_api "HH:mm".
 */
export function formatInstantDateTime(
  instant: string | null | undefined,
  locale: DateLocale,
  style: DateStyle,
  clock: ClockStyle = 'Hm',
): string {
  const day = businessDayOf(instant);
  const time = clockTimeOfInstant(instant);
  return day && time ? `${formatDay(day, locale, style)} · ${formatClockTime(time, locale, clock)}` : '—';
}

/**
 * Whether an instant has come (isAppointmentScheduledStartInPastOrNow): an appointment can be
 * completed or marked as a no-show from its start on. An unreadable instant has not.
 */
export function isPastOrNow(instant: string, now: number = Date.now()): boolean {
  const time = Date.parse(instant);
  return !Number.isNaN(time) && time <= now;
}
