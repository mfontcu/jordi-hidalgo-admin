import { TZDate } from '@date-fns/tz';

// Salon business time (ADR-003, "Business time"): the only module that parses, builds, and formats
// dates. A salon day is a `BusinessDay` ('YYYY-MM-DD' in Europe/Madrid), whatever the browser zone;
// the API receives instants (ISO 8601 in UTC) and sends them back.

export const BUSINESS_TIME_ZONE = 'Europe/Madrid';

/** A salon calendar day, 'YYYY-MM-DD'. */
export type BusinessDay = string;

export type DateLocale = 'es' | 'ca' | 'en';

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

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
 */
export type DateStyle = 'listDate' | 'mediumDate' | 'monthDay' | 'longDate';

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
  }
}

/** An instant from the API as the Flutter panel prints its day; a dash when it is missing. */
export function formatInstant(instant: string | null | undefined, locale: DateLocale, style: DateStyle) {
  const day = businessDayOf(instant);
  return day ? formatDay(day, locale, style) : '—';
}
