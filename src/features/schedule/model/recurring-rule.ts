import {
  addDays,
  formatDay,
  formatWeekdayShort,
  minutesOfDay,
  nextDayOfWeekday,
  type BusinessDay,
  type ClockTime,
  type DateLocale,
  type Weekday,
} from '@/shared/lib/business-time';

// Recurring blocked slots (RecurringBlockedSlotsScreen, app_api AdminRecurringBlockedSlots): a
// weekly range of hours, active or not, and its one-off exceptions. Clock times are salon times.

export type RecurringRule = {
  id: string;
  weekday: Weekday;
  start: ClockTime;
  end: ClockTime;
  /** May be empty: the panel shows "No reason set" for it (see `ruleReasonOf`). */
  reason: string;
  isActive: boolean;
};

export type RecurringRulesSummary = {
  activeRules: number;
  affectedDays: number;
  weeklyRanges: number;
  next: RecurringRule | null;
};

export type RecurringRuleList = { items: RecurringRule[]; summary: RecurringRulesSummary };

/** An exception of a rule on one day: `unblock` opens that occurrence, as the panel creates them. */
export type RuleException = { id: string; date: BusinessDay; action: string; reason: string };

/** The page size of the recurring list, which pages the rules it loads at once. */
export const RECURRING_RULES_PAGE_SIZE = 10;

const WEEKDAY_LABELS = {
  1: 'scheduleWeekdayMonday',
  2: 'scheduleWeekdayTuesday',
  3: 'scheduleWeekdayWednesday',
  4: 'scheduleWeekdayThursday',
  5: 'scheduleWeekdayFriday',
  6: 'scheduleWeekdaySaturday',
  7: 'scheduleWeekdaySunday',
} as const;

/** scheduleWeekdayLabel: the message of a weekday, or of an invalid one. */
export function weekdayLabelOf(weekday: number) {
  return weekday in WEEKDAY_LABELS
    ? WEEKDAY_LABELS[weekday as Weekday]
    : ('scheduleRecurringBlockedSlotInvalidWeekday' as const);
}

/** "11:00 - 11:30". */
export function ruleTimeRange(rule: Pick<RecurringRule, 'start' | 'end'>): string {
  return `${rule.start} - ${rule.end}`;
}

/**
 * The reason as the lists and the detail show it. Flutter saves an empty reason as the translated
 * "No reason set", in the language of whoever saved it; the panel saves it empty and shows the
 * text in the reader's language.
 */
export function ruleReasonOf(rule: Pick<RecurringRule, 'reason'>): string | null {
  const reason = rule.reason.trim();
  return reason === '' ? null : reason;
}

/** The part of the day a rule touches: it starts before 14:00, it ends at 14:00 or later. */
export function affectedRangeOf(rule: Pick<RecurringRule, 'start' | 'end'>) {
  const noon = minutesOfDay('14:00');
  const morning = minutesOfDay(rule.start) < noon;
  const afternoon = minutesOfDay(rule.end) >= noon;
  if (morning && afternoon) return 'scheduleRecurringBlockedSlotAffectedMorningAndAfternoon' as const;
  if (morning) return 'scheduleRecurringBlockedSlotAffectedMorning' as const;
  if (afternoon) return 'scheduleRecurringBlockedSlotAffectedAfternoon' as const;
  return 'scheduleRecurringBlockedSlotAffectedGeneral' as const;
}

/**
 * The next time a rule applies (scheduleNextRecurringOccurrenceFromModel): its weekday from today
 * on, today included, as "lun 13 oct · 11:00". Days are salon days.
 */
export function nextOccurrenceLabel(
  rule: Pick<RecurringRule, 'weekday' | 'start'>,
  today: BusinessDay,
  locale: DateLocale,
): string {
  const day = nextDayOfWeekday(today, rule.weekday, true);
  return `${formatWeekdayShort(rule.weekday, locale)} ${formatDay(day, locale, 'dayMonth')} · ${rule.start}`;
}

/** The summary's next rule, else the first rule listed (RecurringBlockedSlotsSummary). */
export function nextRuleOf(list: RecurringRuleList): RecurringRule | null {
  return list.summary.next ?? list.items[0] ?? null;
}

/** The rules of one page of the list, which Flutter pages on the client. */
export function rulesPage(rules: readonly RecurringRule[], page: number): RecurringRule[] {
  const start = (page - 1) * RECURRING_RULES_PAGE_SIZE;
  return rules.slice(start, start + RECURRING_RULES_PAGE_SIZE);
}

/**
 * The days an exception can take (the exception sheet's calendar): the rule's weekday, from today
 * to a year ahead. It opens on the next one after today (scheduleNextDateForWeekday).
 */
export function exceptionDays(weekday: Weekday, today: BusinessDay) {
  return { initial: nextDayOfWeekday(today, weekday, false), first: today, last: addDays(today, 365) };
}

/** formatScheduleExceptionDate: `dd MMM y`. */
export function exceptionDateLabel(exception: Pick<RuleException, 'date'>, locale: DateLocale): string {
  return formatDay(exception.date, locale, 'paddedListDate');
}
