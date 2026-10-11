import {
  searchWithDate,
  searchWithFilter,
  searchWithPage,
  searchWithText,
  staffFilterOf,
  staffListParamsOf,
  staffSearchSchema,
} from './staff-search';

describe('staff list search parameters', () => {
  it('drops invalid values instead of failing', () => {
    expect(staffSearchSchema.parse({ status: 'blocked', page: '1', search: '  ', date: 'year' })).toEqual({});
    expect(staffSearchSchema.parse({ status: 'inactive', page: '3', search: 12 })).toEqual({
      status: 'inactive',
      page: 3,
      search: '12',
    });
  });

  it('goes back to the first page on a new filter, date, or search', () => {
    const search = staffSearchSchema.parse({ page: '4', search: 'ana' });
    expect(searchWithFilter(search, 'active')).toEqual({ search: 'ana', status: 'active', page: undefined });
    expect(searchWithFilter({ status: 'active' }, 'all')).toEqual({ status: undefined, page: undefined });
    expect(searchWithDate(search, { kind: 'today' })).toMatchObject({ date: 'today', page: undefined });
    expect(searchWithText(search, ' luis ')).toEqual({ search: 'luis', page: undefined });
    expect(searchWithPage(search, 1)).toEqual({ search: 'ana', page: undefined });
    expect(staffFilterOf({})).toBe('all');
  });

  it('asks the backend for admin accounts of the URL', () => {
    expect(staffListParamsOf({}, '2026-10-11')).toEqual({
      role: 'admin',
      page: 1,
      pageSize: 10,
      search: '',
      status: 'all',
    });
    expect(
      staffListParamsOf({ status: 'inactive', search: 'ana', page: 2, date: 'today' }, '2026-10-11'),
    ).toEqual({
      role: 'admin',
      page: 2,
      pageSize: 10,
      search: 'ana',
      status: 'inactive',
      dateFrom: '2026-10-10T22:00:00.000Z',
      dateTo: '2026-10-11T21:59:59.000Z',
    });
  });
});
