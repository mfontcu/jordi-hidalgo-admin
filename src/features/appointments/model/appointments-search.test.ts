import {
  appointmentDateFilterOf,
  appointmentsSearchSchema,
  hasActiveListFilters,
  listParamsOf,
  searchWithDate,
  searchWithStatus,
  searchWithText,
  statusFilterOf,
} from './appointments-search';

describe('appointments search', () => {
  it('reads the URL: today by default, a range wins over a preset, and junk is dropped', () => {
    expect(appointmentDateFilterOf(appointmentsSearchSchema.parse({}))).toEqual({ kind: 'today' });
    expect(appointmentDateFilterOf(appointmentsSearchSchema.parse({ date: 'tomorrow' }))).toEqual({
      kind: 'tomorrow',
    });
    expect(
      appointmentDateFilterOf(
        appointmentsSearchSchema.parse({ date: 'thisWeek', from: '2026-10-01', to: '2026-10-05' }),
      ),
    ).toEqual({ kind: 'range', from: '2026-10-01', to: '2026-10-05' });
    expect(appointmentDateFilterOf(appointmentsSearchSchema.parse({ date: 'next7Days' }))).toEqual({
      kind: 'today',
    });
    expect(statusFilterOf(appointmentsSearchSchema.parse({ status: 'no_show' }))).toBe('no_show');
    expect(statusFilterOf(appointmentsSearchSchema.parse({ status: 'rescheduled' }))).toBe('all');
  });

  it('writes filters back to the URL and resets the page', () => {
    const base = appointmentsSearchSchema.parse({ page: 2, search: 'mari', status: 'pending' });
    expect(searchWithText(base, '  ')).toEqual({
      search: undefined,
      status: 'pending',
      page: undefined,
    });
    expect(searchWithStatus(base, 'all')).toEqual({
      search: 'mari',
      status: undefined,
      page: undefined,
    });
    // Today is the default: leave it out.
    expect(searchWithDate(base, { kind: 'today' })).toEqual({
      search: 'mari',
      status: 'pending',
      date: undefined,
      from: undefined,
      to: undefined,
      page: undefined,
    });
    expect(searchWithDate(base, { kind: 'thisMonth' })).toEqual({
      search: 'mari',
      status: 'pending',
      date: 'thisMonth',
      from: undefined,
      to: undefined,
      page: undefined,
    });
  });

  it('marks filters active when they leave the default today list', () => {
    expect(hasActiveListFilters(appointmentsSearchSchema.parse({}))).toBe(false);
    expect(hasActiveListFilters(appointmentsSearchSchema.parse({ date: 'today' }))).toBe(false);
    expect(hasActiveListFilters(appointmentsSearchSchema.parse({ date: 'tomorrow' }))).toBe(true);
    expect(hasActiveListFilters(appointmentsSearchSchema.parse({ search: 'a' }))).toBe(true);
    expect(hasActiveListFilters(appointmentsSearchSchema.parse({ status: 'pending' }))).toBe(true);
  });

  it('builds list params with salon-day bounds for today', () => {
    expect(listParamsOf(appointmentsSearchSchema.parse({}), '2026-10-12')).toEqual({
      page: 1,
      pageSize: 10,
      search: '',
      status: 'all',
      dateFrom: '2026-10-11T22:00:00.000Z',
      dateTo: '2026-10-12T21:59:59.000Z',
    });
    expect(listParamsOf(appointmentsSearchSchema.parse({ date: 'tomorrow', page: 3 }), '2026-10-12')).toEqual(
      {
        page: 3,
        pageSize: 10,
        search: '',
        status: 'all',
        dateFrom: '2026-10-12T22:00:00.000Z',
        dateTo: '2026-10-13T21:59:59.000Z',
      },
    );
  });
});
