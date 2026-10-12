import {
  blockedSlotListParamsOf,
  blockedSlotsSearchSchema,
  recurringRuleListParamsOf,
  searchWithTab,
  searchWithType,
  tabOf,
} from './blocked-slots-search';

const parse = (value: Record<string, unknown>) => blockedSlotsSearchSchema.parse(value);

describe('blocked slots search', () => {
  it('reads the Flutter tab slugs and drops anything else', () => {
    expect(tabOf(parse({ tab: 'recurring' }))).toBe('recurring');
    expect(tabOf(parse({ tab: 'weekly' }))).toBe('punctual');
    expect(tabOf(parse({}))).toBe('punctual');
    expect(searchWithTab('punctual')).toEqual({ tab: undefined });
    expect(searchWithTab('recurring')).toEqual({ tab: 'recurring' });
  });

  it('sends the punctual filters as the backend names them, in salon days', () => {
    const search = parse({ search: ' fisio ', date: 'next7Days', type: 'fullDay', page: '3' });
    expect(blockedSlotListParamsOf(search, '2026-10-22')).toEqual({
      page: 3,
      pageSize: 10,
      search: 'fisio',
      dateFrom: '2026-10-21T22:00:00.000Z',
      dateTo: '2026-10-28T22:59:59.000Z',
      type: 'full_day',
    });
    expect(blockedSlotListParamsOf(parse({ date: 'week', type: 'all', page: 1 }), '2026-10-22')).toEqual({
      page: 1,
      pageSize: 10,
      search: '',
      type: 'all',
    });
  });

  it('goes back to the first page when a filter changes', () => {
    expect(searchWithType(parse({ page: 4 }), 'range')).toEqual({ type: 'range', page: undefined });
    expect(searchWithType(parse({ type: 'range' }), 'all').type).toBeUndefined();
  });

  it('opens the recurring tab on the active rules', () => {
    expect(recurringRuleListParamsOf(parse({}))).toEqual({ weekday: null, status: 'active' });
    expect(recurringRuleListParamsOf(parse({ weekday: '3', status: 'all' }))).toEqual({
      weekday: 3,
      status: 'all',
    });
    expect(recurringRuleListParamsOf(parse({ weekday: 9, status: 'active' }))).toEqual({
      weekday: null,
      status: 'active',
    });
  });
});
