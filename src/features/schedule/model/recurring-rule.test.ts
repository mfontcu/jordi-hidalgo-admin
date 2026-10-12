import {
  affectedRangeOf,
  exceptionDays,
  nextOccurrenceLabel,
  nextRuleOf,
  ruleReasonOf,
  rulesPage,
  weekdayLabelOf,
  type RecurringRule,
} from './recurring-rule';
import { recurringRuleFormDefaults, recurringRuleFormSchema } from './recurring-rule-form';

const rule = (overrides: Partial<RecurringRule> = {}): RecurringRule => ({
  id: 'r',
  weekday: 2,
  start: '11:00',
  end: '11:30',
  reason: 'Descanso',
  isActive: true,
  ...overrides,
});

describe('recurring rules', () => {
  it('names the weekday, or says it is invalid', () => {
    expect(weekdayLabelOf(1)).toBe('scheduleWeekdayMonday');
    expect(weekdayLabelOf(7)).toBe('scheduleWeekdaySunday');
    expect(weekdayLabelOf(0)).toBe('scheduleRecurringBlockedSlotInvalidWeekday');
  });

  it('tells the part of the day it touches', () => {
    expect(affectedRangeOf(rule())).toBe('scheduleRecurringBlockedSlotAffectedMorning');
    expect(affectedRangeOf(rule({ start: '15:00', end: '16:00' }))).toBe(
      'scheduleRecurringBlockedSlotAffectedAfternoon',
    );
    expect(affectedRangeOf(rule({ start: '13:00', end: '15:00' }))).toBe(
      'scheduleRecurringBlockedSlotAffectedMorningAndAfternoon',
    );
  });

  it('labels the next time it applies, today included, in salon days', () => {
    expect(nextOccurrenceLabel(rule(), '2026-10-13', 'es')).toBe('mar 13 oct · 11:00');
    expect(nextOccurrenceLabel(rule(), '2026-10-14', 'ca')).toBe('dt. 20 d’oct. · 11:00');
    expect(nextOccurrenceLabel(rule({ weekday: 7 }), '2026-10-24', 'en')).toBe('Sun 25 Oct · 11:00');
  });

  it('shows an empty reason as missing instead of storing a translation', () => {
    expect(ruleReasonOf(rule({ reason: '  ' }))).toBeNull();
    expect(ruleReasonOf(rule())).toBe('Descanso');
    expect(recurringRuleFormSchema.parse({ ...recurringRuleFormDefaults(null), reason: '  ' }).reason).toBe(
      '',
    );
  });

  it('asks for the start before the end', () => {
    const result = recurringRuleFormSchema.safeParse({
      ...recurringRuleFormDefaults(null),
      start: '12:00',
      end: '12:00',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('scheduleRecurringBlockedSlotFormValidationStartBeforeEnd');
  });

  it('pages the rules ten at a time and falls back to the first for the next one', () => {
    const rules = Array.from({ length: 12 }, (_, index) => rule({ id: `r${index}` }));
    expect(rulesPage(rules, 2).map((item) => item.id)).toEqual(['r10', 'r11']);
    const summary = { activeRules: 1, affectedDays: 1, weeklyRanges: 1, next: null };
    expect(nextRuleOf({ items: rules, summary })?.id).toBe('r0');
    expect(nextRuleOf({ items: [], summary })).toBeNull();
  });

  it("offers exception days of the rule's weekday, from the next one after today", () => {
    expect(exceptionDays(2, '2026-10-13')).toEqual({
      initial: '2026-10-20',
      first: '2026-10-13',
      last: '2027-10-13',
    });
  });
});
