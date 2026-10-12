import {
  addDays,
  addMonths,
  businessDayOf,
  businessToday,
  compareDays,
  dateToDay,
  dayEndInstant,
  dayStartInstant,
  dayToDate,
  endOfMonth,
  formatDay,
  formatInstant,
  formatInstantDateTime,
  formatMonth,
  isBusinessDay,
  isPastOrNow,
  startOfMonth,
} from './business-time';

describe('business days', () => {
  it('takes today from the salon zone, not the browser one', () => {
    // 22:30 UTC on 10 October is already the 11th in Madrid (UTC+2).
    expect(businessToday(Date.parse('2026-10-10T22:30:00Z'))).toBe('2026-10-11');
    expect(businessToday(Date.parse('2026-01-10T22:30:00Z'))).toBe('2026-01-10');
  });

  it('reads the salon day of an API instant', () => {
    expect(businessDayOf('2026-10-10T22:30:00Z')).toBe('2026-10-11');
    expect(businessDayOf('2026-10-11T08:00:00+02:00')).toBe('2026-10-11');
    expect(businessDayOf('')).toBeNull();
    expect(businessDayOf(undefined)).toBeNull();
    expect(businessDayOf('not a date')).toBeNull();
  });

  it('validates days written in the URL', () => {
    expect(isBusinessDay('2026-02-28')).toBe(true);
    expect(isBusinessDay('2026-02-29')).toBe(false);
    expect(isBusinessDay('2028-02-29')).toBe(true);
    expect(isBusinessDay('2026-2-28')).toBe(false);
    expect(isBusinessDay('2026-13-01')).toBe(false);
  });

  it('moves across months and years', () => {
    expect(addDays('2026-10-11', -6)).toBe('2026-10-05');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(startOfMonth('2026-10-11')).toBe('2026-10-01');
    expect(endOfMonth('2026-02-11')).toBe('2026-02-28');
    expect(addMonths('2026-12-11', 1)).toBe('2027-01-01');
    expect(compareDays('2026-10-01', '2026-09-30')).toBe(1);
    expect(compareDays('2026-10-01', '2026-10-01')).toBe(0);
  });

  it('turns a day into the instants the API filters by, across both yearly clock changes', () => {
    // Winter (UTC+1) and summer (UTC+2).
    expect(dayStartInstant('2026-01-15')).toBe('2026-01-14T23:00:00.000Z');
    expect(dayEndInstant('2026-07-15')).toBe('2026-07-15T21:59:59.000Z');
    // 29 March 2026: the clocks go forward at 02:00, so the day starts in winter and ends in summer.
    expect(dayStartInstant('2026-03-29')).toBe('2026-03-28T23:00:00.000Z');
    expect(dayEndInstant('2026-03-29')).toBe('2026-03-29T21:59:59.000Z');
    // 25 October 2026: the clocks go back at 03:00, so the day starts in summer and ends in winter.
    expect(dayStartInstant('2026-10-25')).toBe('2026-10-24T22:00:00.000Z');
    expect(dayEndInstant('2026-10-25')).toBe('2026-10-25T22:59:59.000Z');
  });

  it('round-trips a day through the calendar date', () => {
    for (const day of ['2026-03-29', '2026-10-25', '2026-12-31']) {
      expect(dateToDay(dayToDate(day))).toBe(day);
    }
  });
});

describe('formats of the Flutter panel', () => {
  it('prints intl month names, unlike date-fns', () => {
    expect(formatDay('2026-09-11', 'es', 'listDate')).toBe('11 sept 2026');
    expect(formatDay('2026-10-11', 'ca', 'listDate')).toBe('11 d’oct. 2026');
    expect(formatDay('2026-02-11', 'ca', 'listDate')).toBe('11 de febr. 2026');
    expect(formatDay('2026-10-11', 'en', 'listDate')).toBe('11 Oct 2026');
  });

  it('follows each language pattern', () => {
    expect(formatDay('2026-10-11', 'es', 'mediumDate')).toBe('11 oct 2026');
    expect(formatDay('2026-10-11', 'ca', 'mediumDate')).toBe('11 d’oct. del 2026');
    expect(formatDay('2026-10-11', 'en', 'mediumDate')).toBe('Oct 11, 2026');
    expect(formatDay('2026-10-11', 'es', 'monthDay')).toBe('11 oct');
    expect(formatDay('2026-10-11', 'en', 'monthDay')).toBe('Oct 11');
    expect(formatDay('2026-10-11', 'es', 'longDate')).toBe('11 de octubre de 2026');
    expect(formatDay('2026-10-11', 'ca', 'longDate')).toBe('11 d’octubre del 2026');
    expect(formatDay('2026-10-11', 'en', 'longDate')).toBe('October 11, 2026');
  });

  it('titles a month with standalone names (DateFormat.yMMMM)', () => {
    expect(formatMonth('2026-10-11', 'es')).toBe('octubre de 2026');
    expect(formatMonth('2026-10-11', 'ca')).toBe('octubre del 2026');
    expect(formatMonth('2026-10-11', 'en')).toBe('October 2026');
  });

  it('prints an instant by its salon day, and a dash without one', () => {
    expect(formatInstant('2026-10-10T22:30:00Z', 'es', 'listDate')).toBe('11 oct 2026');
    expect(formatInstant(null, 'es', 'listDate')).toBe('—');
  });

  it('prints the numeric date of the appointment labels', () => {
    expect(formatDay('2026-03-05', 'ca', 'numericDate')).toBe('05/03/2026');
  });

  it('adds the salon time to an instant, across both daylight-saving changes', () => {
    expect(formatInstantDateTime('2026-10-10T22:30:00Z', 'es', 'mediumDate')).toBe('11 oct 2026 · 00:30');
    expect(formatInstantDateTime('2026-03-29T01:00:00Z', 'en', 'listDate')).toBe('29 Mar 2026 · 03:00');
    expect(formatInstantDateTime('2026-10-25T01:30:00Z', 'es', 'numericDate')).toBe('25/10/2026 · 02:30');
    expect(formatInstantDateTime('', 'es', 'mediumDate')).toBe('—');
  });

  it('tells whether an instant has come', () => {
    const now = Date.parse('2026-10-12T09:00:00Z');
    expect(isPastOrNow('2026-10-12T09:00:00Z', now)).toBe(true);
    expect(isPastOrNow('2026-10-12T08:59:00Z', now)).toBe(true);
    expect(isPastOrNow('2026-10-12T09:01:00Z', now)).toBe(false);
    expect(isPastOrNow('not a date', now)).toBe(false);
  });
});
