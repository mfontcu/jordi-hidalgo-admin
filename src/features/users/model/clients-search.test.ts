import {
  clientFilterOf,
  clientsListParamsOf,
  clientsSearchSchema,
  searchWithClientFilter,
} from './clients-search';
import { searchWithDate, searchWithPage, searchWithText } from './list-search';

describe('clients list search parameters', () => {
  it('drops invalid values instead of failing', () => {
    expect(clientsSearchSchema.parse({ status: 'deleted', page: '1', search: ' ' })).toEqual({});
    expect(clientsSearchSchema.parse({ status: 'with_upcoming_appointment', page: '2' })).toEqual({
      status: 'with_upcoming_appointment',
      page: 2,
    });
  });

  it('goes back to the first page on a new filter, date, or search', () => {
    const search = clientsSearchSchema.parse({ page: '3', search: 'mar' });
    expect(searchWithClientFilter(search, 'blocked')).toEqual({
      search: 'mar',
      status: 'blocked',
      page: undefined,
    });
    expect(searchWithClientFilter({ status: 'blocked' }, 'all')).toEqual({
      status: undefined,
      page: undefined,
    });
    expect(searchWithDate(search, { kind: 'month' })).toMatchObject({ date: 'month', page: undefined });
    expect(searchWithText(search, '')).toEqual({ search: undefined, page: undefined });
    expect(searchWithPage(search, 4)).toEqual({ search: 'mar', page: 4 });
    expect(clientFilterOf({})).toBe('all');
  });

  it('asks for customers with the status the API takes and the salon days as instants', () => {
    expect(clientsListParamsOf({}, '2026-10-12')).toEqual({
      role: 'customer',
      page: 1,
      pageSize: 10,
      search: '',
      status: 'all',
    });
    expect(
      clientsListParamsOf({ status: 'inactive', date: 'today', page: 2, search: 'ana' }, '2026-10-12'),
    ).toEqual({
      role: 'customer',
      page: 2,
      pageSize: 10,
      search: 'ana',
      status: 'inactive',
      dateFrom: '2026-10-11T22:00:00.000Z',
      dateTo: '2026-10-12T21:59:59.000Z',
    });
  });
});
