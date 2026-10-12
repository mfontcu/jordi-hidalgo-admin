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
  formatClockTime,
  formatMonth,
  formatWeekdayShort,
  addMinutes,
  clockTimeOf,
  clockTimeOfInstant,
  instantAt,
  isBusinessDay,
  isClockTime,
  isFullDayRange,
  isFuture,
  isPastOrNow,
  minutesOfDay,
  nextDayOfWeekday,
  parseClockTime,
  startOfMonth,
  weekdayOf,
} from './business-time';

describe('business days', () => {
  it('takes today from the salon zone, not the browser one', () => {
    // 2026-10-10T22:30:00Z is already the 11th in Madrid (UTC+2); 2026-01-10T22:30:00Z is still the 10th.
    expect(businessToday(1_791_671_400_000)).toBe('2026-10-11');
    expect(businessToday(1_768_084_200_000)).toBe('2026-01-10');
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
    expect(formatInstantDateTime('2026-10-10T22:30:00Z', 'es', 'mediumDate')).toBe('11 oct 2026 · 0:30');
    expect(formatInstantDateTime('2026-03-29T01:00:00Z', 'en', 'listDate')).toBe('29 Mar 2026 · 03:00');
    expect(formatInstantDateTime('2026-10-25T01:30:00Z', 'es', 'numericDate', 'HH:mm')).toBe(
      '25/10/2026 · 02:30',
    );
    expect(formatInstantDateTime('', 'es', 'mediumDate')).toBe('—');
  });

  it('prints the time as DateFormat.Hm: no leading zero in Spanish and Catalan', () => {
    expect(formatInstantDateTime('2026-10-12T07:05:00Z', 'es', 'mediumDate')).toBe('12 oct 2026 · 9:05');
    expect(formatInstantDateTime('2026-10-12T07:05:00Z', 'ca', 'mediumDate')).toBe(
      '12 d’oct. del 2026 · 9:05',
    );
    expect(formatInstantDateTime('2026-10-12T07:05:00Z', 'en', 'mediumDate')).toBe('Oct 12, 2026 · 09:05');
    expect(formatClockTime('09:05', 'es', 'HH:mm')).toBe('09:05');
    expect(formatClockTime('19:05', 'es', 'Hm')).toBe('19:05');
  });

  it('prints the schedule dates', () => {
    expect(formatDay('2026-10-05', 'es', 'paddedListDate')).toBe('05 oct 2026');
    expect(formatDay('2026-10-05', 'en', 'dayMonth')).toBe('5 Oct');
    expect(formatDay('2026-10-05', 'ca', 'dayMonth')).toBe('5 d’oct.');
    expect(formatWeekdayShort(1, 'es')).toBe('lun');
    expect(formatWeekdayShort(7, 'ca')).toBe('dg.');
    expect(formatWeekdayShort(3, 'en')).toBe('Wed');
  });
});

describe('clock times', () => {
  it('reads and writes HH:mm', () => {
    expect(isClockTime('09:00')).toBe(true);
    expect(isClockTime('9:00')).toBe(false);
    expect(isClockTime('24:00')).toBe(false);
    expect(parseClockTime(' 9:5 ')).toBe('09:05');
    expect(parseClockTime('23:59')).toBe('23:59');
    expect(parseClockTime('24:00')).toBeNull();
    expect(parseClockTime('')).toBeNull();
    expect(minutesOfDay('13:30')).toBe(810);
    expect(clockTimeOf(810)).toBe('13:30');
  });

  it('moves a time and holds it inside the day, as _addMinutes', () => {
    expect(addMinutes('09:00', 30)).toBe('09:30');
    expect(addMinutes('23:45', 30)).toBe('23:59');
    expect(addMinutes('00:10', -30)).toBe('00:00');
  });
});

describe('salon instants', () => {
  it('builds the instant of a day and time in salon time', () => {
    expect(instantAt('2026-10-12', '09:30')).toBe('2026-10-12T07:30:00.000Z');
    expect(instantAt('2026-01-15', '09:30')).toBe('2026-01-15T08:30:00.000Z');
    expect(instantAt('2026-10-12', '23:59')).toBe('2026-10-12T21:59:00.000Z');
  });

  it('moves a time skipped by the spring change forward, and keeps the first of a repeated one', () => {
    expect(instantAt('2026-03-29', '01:59')).toBe('2026-03-29T00:59:00.000Z');
    expect(instantAt('2026-03-29', '02:30')).toBe('2026-03-29T01:30:00.000Z');
    expect(instantAt('2026-03-29', '03:00')).toBe('2026-03-29T01:00:00.000Z');
    expect(instantAt('2026-10-25', '02:30')).toBe('2026-10-25T00:30:00.000Z');
    expect(instantAt('2026-10-25', '03:00')).toBe('2026-10-25T02:00:00.000Z');
  });

  it('reads the salon time of an instant on both changes', () => {
    expect(clockTimeOfInstant('2026-03-29T01:00:00Z')).toBe('03:00');
    expect(clockTimeOfInstant('2026-10-25T00:30:00Z')).toBe('02:30');
    expect(clockTimeOfInstant('2026-10-25T01:30:00Z')).toBe('02:30');
    expect(clockTimeOfInstant('nope')).toBeNull();
  });

  it('takes a block from 00:00 to 23:59 as a full day, also on the 23- and 25-hour days', () => {
    const fullDay = (day: string) => isFullDayRange(instantAt(day, '00:00'), instantAt(day, '23:59'));
    expect(fullDay('2026-10-12')).toBe(true);
    expect(fullDay('2026-03-29')).toBe(true);
    expect(fullDay('2026-10-25')).toBe(true);
    expect(isFullDayRange('2026-06-22T22:00:00Z', '2026-06-23T21:59:00Z')).toBe(true);
    expect(isFullDayRange(instantAt('2026-10-12', '00:00'), instantAt('2026-10-13', '00:00'))).toBe(true);
    expect(isFullDayRange(instantAt('2026-10-12', '00:00'), instantAt('2026-10-12', '20:00'))).toBe(false);
    expect(isFullDayRange(instantAt('2026-10-12', '09:00'), instantAt('2026-10-13', '09:00'))).toBe(false);
  });

  it('tells whether an instant is still to come', () => {
    const now = 1_791_795_600_000; // 2026-10-12T09:00:00Z
    expect(isFuture('2026-10-12T09:00:01Z', now)).toBe(true);
    expect(isFuture('2026-10-12T09:00:00Z', now)).toBe(false);
    expect(isFuture('nope', now)).toBe(false);
  });

  it('tells whether an instant has come', () => {
    const now = 1_791_795_600_000; // 2026-10-12T09:00:00Z
    expect(isPastOrNow('2026-10-12T09:00:00Z', now)).toBe(true);
    expect(isPastOrNow('2026-10-12T08:59:00Z', now)).toBe(true);
    expect(isPastOrNow('2026-10-12T09:01:00Z', now)).toBe(false);
    expect(isPastOrNow('not a date', now)).toBe(false);
  });
});

describe('weekdays', () => {
  it('numbers salon days from Monday, as the API does', () => {
    expect(weekdayOf('2026-10-12')).toBe(1);
    expect(weekdayOf('2026-10-18')).toBe(7);
    expect(weekdayOf('2026-03-29')).toBe(7);
    expect(weekdayOf('2026-10-25')).toBe(7);
  });

  it('finds the next day of a weekday, counting the first day or not', () => {
    expect(nextDayOfWeekday('2026-10-12', 1, true)).toBe('2026-10-12');
    expect(nextDayOfWeekday('2026-10-12', 1, false)).toBe('2026-10-19');
    expect(nextDayOfWeekday('2026-10-12', 3, false)).toBe('2026-10-14');
    expect(nextDayOfWeekday('2026-10-24', 7, true)).toBe('2026-10-25');
  });
});
