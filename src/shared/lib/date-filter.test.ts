import {
  dateFilterOf,
  dateFilterQuery,
  dateFilterRange,
  dateFilterSearch,
  dateFilterSearchSchemaFor,
  dateRangeLabel,
  filterOfPick,
} from './date-filter';
import { z } from 'zod';

const schema = z.object(dateFilterSearchSchemaFor(['today', 'month']));

describe('date filter', () => {
  it('reads the URL: a valid range wins over a preset, and anything else is dropped', () => {
    expect(dateFilterOf(schema.parse({}))).toEqual({ kind: 'all' });
    expect(dateFilterOf(schema.parse({ date: 'today' }))).toEqual({ kind: 'today' });
    expect(dateFilterOf(schema.parse({ date: 'month', from: '2026-10-01', to: '2026-10-05' }))).toEqual({
      kind: 'range',
      from: '2026-10-01',
      to: '2026-10-05',
    });
    expect(dateFilterOf(schema.parse({ date: 'week', from: '2026-02-30', to: '2026-03-01' }))).toEqual({
      kind: 'all',
    });
    // A preset the list does not offer is dropped.
    expect(dateFilterOf(schema.parse({ date: 'nextMonth' }))).toEqual({ kind: 'all' });
    const blocked = z.object(dateFilterSearchSchemaFor(['today', 'next7Days', 'month', 'nextMonth']));
    expect(dateFilterOf(blocked.parse({ date: 'nextMonth' }))).toEqual({ kind: 'nextMonth' });
    // A range that ends before it starts is no range.
    expect(dateFilterOf(schema.parse({ from: '2026-10-05', to: '2026-10-01' }))).toEqual({ kind: 'all' });
  });

  it('writes the URL of each filter', () => {
    expect(dateFilterSearch({ kind: 'all' })).toEqual({ date: undefined, from: undefined, to: undefined });
    expect(dateFilterSearch({ kind: 'month' })).toEqual({ date: 'month', from: undefined, to: undefined });
    expect(dateFilterSearch({ kind: 'range', from: '2026-10-01', to: '2026-10-02' })).toEqual({
      date: undefined,
      from: '2026-10-01',
      to: '2026-10-02',
    });
  });

  it('resolves the presets on the salon day', () => {
    expect(dateFilterRange({ kind: 'all' }, '2026-10-11')).toBeNull();
    expect(dateFilterRange({ kind: 'today' }, '2026-10-11')).toEqual({
      from: '2026-10-11',
      to: '2026-10-11',
    });
    expect(dateFilterRange({ kind: 'month' }, '2026-02-11')).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
    expect(dateFilterRange({ kind: 'next7Days' }, '2026-10-27')).toEqual({
      from: '2026-10-27',
      to: '2026-11-02',
    });
    expect(dateFilterRange({ kind: 'nextMonth' }, '2026-12-31')).toEqual({
      from: '2027-01-01',
      to: '2027-01-31',
    });
    // Monday 12 October 2026: tomorrow, the week (Mon–Sun), and this month.
    expect(dateFilterRange({ kind: 'tomorrow' }, '2026-10-12')).toEqual({
      from: '2026-10-13',
      to: '2026-10-13',
    });
    expect(dateFilterRange({ kind: 'thisWeek' }, '2026-10-12')).toEqual({
      from: '2026-10-12',
      to: '2026-10-18',
    });
    expect(dateFilterRange({ kind: 'thisWeek' }, '2026-10-14')).toEqual({
      from: '2026-10-12',
      to: '2026-10-18',
    });
    expect(dateFilterRange({ kind: 'thisMonth' }, '2026-02-11')).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });

  it('sends the days of a preset that crosses a daylight-saving change in salon time', () => {
    expect(dateFilterQuery({ kind: 'next7Days' }, '2026-10-22')).toEqual({
      dateFrom: '2026-10-21T22:00:00.000Z',
      dateTo: '2026-10-28T22:59:59.000Z',
    });
    expect(dateFilterQuery({ kind: 'nextMonth' }, '2026-02-15')).toEqual({
      dateFrom: '2026-02-28T23:00:00.000Z',
      dateTo: '2026-03-31T21:59:59.000Z',
    });
  });

  it('applies a pick at once, except the range', () => {
    expect(filterOfPick('all')).toEqual({ kind: 'all' });
    expect(filterOfPick('next7Days')).toEqual({ kind: 'next7Days' });
    expect(filterOfPick('custom')).toBeNull();
  });

  it('sends the first and the last second of the range, in UTC', () => {
    expect(dateFilterQuery({ kind: 'all' }, '2026-10-11')).toEqual({});
    expect(dateFilterQuery({ kind: 'month' }, '2026-10-11')).toEqual({
      dateFrom: '2026-09-30T22:00:00.000Z',
      dateTo: '2026-10-31T22:59:59.000Z',
    });
  });

  it('labels a range with one day when both ends are the same', () => {
    expect(dateRangeLabel('2026-10-01', '2026-10-05', 'es')).toBe('1 oct · 5 oct');
    expect(dateRangeLabel('2026-10-01', '2026-10-01', 'en')).toBe('Oct 1');
    expect(dateRangeLabel('2026-10-01', '2026-10-05', 'en', 'dayMonth')).toBe('1 Oct · 5 Oct');
  });
});
