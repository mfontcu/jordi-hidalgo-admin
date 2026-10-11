import {
  dateFilterOf,
  dateFilterQuery,
  dateFilterRange,
  dateFilterSearch,
  dateFilterSearchSchema,
  dateRangeLabel,
} from './date-filter';
import { z } from 'zod';

const schema = z.object(dateFilterSearchSchema);

describe('registration date filter', () => {
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
  });
});
