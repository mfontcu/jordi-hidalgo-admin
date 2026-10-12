import {
  searchWithDate,
  searchWithPage,
  searchWithService,
  searchWithStatus,
  searchWithText,
  slotWatchesSearchSchema,
} from './slot-watches-search';

const parsed = (search: Record<string, unknown>) => slotWatchesSearchSchema.parse(search);

describe('slot watch search', () => {
  it('drops an invalid date, status, or page and keeps a salon day', () => {
    expect(parsed({ date: '2026-10-12', status: 'held', page: '3' })).toEqual({
      date: '2026-10-12',
      status: 'held',
      page: 3,
    });
    expect(parsed({ date: '12/10/2026', status: 'closed', page: 1, search: '  ' })).toEqual({});
    expect(parsed({ search: 12, service: 'svc-1' })).toEqual({ search: '12', service: 'svc-1' });
  });

  it('writes a filter back to the first page, and omits the first page', () => {
    const current = parsed({ search: 'ana', page: 4, date: '2026-10-12' });
    expect(searchWithText(current, ' bruno ')).toEqual({ search: 'bruno', date: '2026-10-12' });
    expect(searchWithText(current, '  ')).toEqual({ date: '2026-10-12' });
    expect(searchWithDate(current, null)).toEqual({ search: 'ana' });
    expect(searchWithService(current, 'svc-1')).toEqual({
      search: 'ana',
      date: '2026-10-12',
      service: 'svc-1',
    });
    expect(searchWithStatus(current, 'active')).toEqual({
      search: 'ana',
      date: '2026-10-12',
      status: 'active',
    });
    expect(searchWithStatus(current, null).status).toBeUndefined();
    expect(searchWithPage(current, 2).page).toBe(2);
    expect(searchWithPage(current, 1).page).toBeUndefined();
  });
});
