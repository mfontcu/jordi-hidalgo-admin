import {
  agendaBoundsOf,
  dayAgendaSearchSchema,
  dayOf,
  hasActiveAgendaFilters,
  layoutScopeOf,
  scopeOf,
  searchShiftPeriod,
  searchWithAppointments,
  searchWithScope,
  searchWithView,
  showAppointmentsOf,
  showBlockedSlotsOf,
  viewFilterOf,
} from './day-agenda-search';

describe('dayAgendaSearchSchema', () => {
  it('keeps a salon day, scope, and view filter', () => {
    expect(
      dayAgendaSearchSchema.parse({
        day: '2026-10-12',
        scope: 'week',
        view: 'operational',
        serviceId: 12,
        search: ' Ana ',
        appointments: 'false',
        blocked: false,
      }),
    ).toEqual({
      day: '2026-10-12',
      scope: 'week',
      view: 'operational',
      serviceId: '12',
      search: 'Ana',
      appointments: false,
      blocked: false,
    });
  });

  it('drops an invalid day and an unknown view', () => {
    expect(dayAgendaSearchSchema.parse({ day: '2026-13-40', view: 'nope' })).toEqual({
      day: undefined,
      view: undefined,
    });
  });
});

describe('day agenda search helpers', () => {
  const today = '2026-10-12';

  it('defaults day, scope, view, and layers', () => {
    expect(dayOf({}, today)).toBe(today);
    expect(scopeOf({})).toBe('day');
    expect(viewFilterOf({})).toBe('all');
    expect(showAppointmentsOf({})).toBe(true);
    expect(showBlockedSlotsOf({ blocked: false })).toBe(false);
  });

  it('forces the day scope on a compact layout', () => {
    expect(layoutScopeOf({ scope: 'week' }, true)).toBe('day');
    expect(layoutScopeOf({ scope: 'week' }, false)).toBe('week');
  });

  it('computes inclusive bounds for day and week', () => {
    expect(agendaBoundsOf('2026-10-14', 'day')).toEqual({ dateFrom: '2026-10-14', dateTo: '2026-10-14' });
    expect(agendaBoundsOf('2026-10-14', 'week')).toEqual({ dateFrom: '2026-10-12', dateTo: '2026-10-18' });
  });

  it('shifts by one day or one week', () => {
    expect(searchShiftPeriod({ day: '2026-10-12' }, 1, 'day', today).day).toBe('2026-10-13');
    expect(searchShiftPeriod({ day: '2026-10-12' }, -1, 'week', today).day).toBe('2026-10-05');
  });

  it('omits default values from the URL helpers', () => {
    expect(searchWithScope({ scope: 'week' }, 'day')).toEqual({ scope: undefined });
    expect(searchWithView({}, 'all')).toEqual({ view: undefined });
    expect(searchWithAppointments({}, true)).toEqual({ appointments: undefined });
  });

  it('detects active filters', () => {
    expect(hasActiveAgendaFilters({})).toBe(false);
    expect(hasActiveAgendaFilters({ view: 'pending' })).toBe(true);
    expect(hasActiveAgendaFilters({ appointments: false })).toBe(true);
  });
});
