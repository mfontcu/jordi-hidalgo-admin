import {
  categoryFilter,
  filterCategoryCode,
  filterOf,
  listParamsOf,
  searchWithFilter,
  searchWithPage,
  searchWithText,
  servicesSearchSchema,
} from './services-search';

describe('servicesSearchSchema', () => {
  it('reads every parameter', () => {
    expect(
      servicesSearchSchema.parse({ search: ' corte ', status: 'active', category: 'hair', page: 3 }),
    ).toEqual({
      search: 'corte',
      status: 'active',
      category: 'hair',
      page: 3,
    });
  });

  it('reads a number the router parsed from the URL as text', () => {
    expect(servicesSearchSchema.parse({ search: 12, page: '2' })).toMatchObject({ search: '12', page: 2 });
  });

  it.each([
    ['an unknown status', { status: 'archived' }],
    ['the first page', { page: 1 }],
    ['a page that is not a whole number', { page: 2.5 }],
    ['an empty search', { search: '   ' }],
  ])('drops %s', (_, search) => {
    expect(servicesSearchSchema.parse(search)).toEqual({
      search: undefined,
      status: undefined,
      category: undefined,
      page: undefined,
    });
  });
});

describe('filters', () => {
  it('has one filter at a time, a category winning over a status', () => {
    expect(filterOf({})).toBe('all');
    expect(filterOf({ status: 'inactive' })).toBe('inactive');
    expect(filterOf({ status: 'inactive', category: 'hair' })).toBe('category:hair');
    expect(filterCategoryCode(categoryFilter('hair'))).toBe('hair');
    expect(filterCategoryCode('active')).toBeNull();
  });

  it('applies a filter, replacing the other one and going back to the first page', () => {
    const search = { search: 'corte', status: 'active' as const, page: 3 };
    expect(searchWithFilter(search, categoryFilter('hair'))).toEqual({
      search: 'corte',
      status: undefined,
      category: 'hair',
      page: undefined,
    });
    expect(searchWithFilter({ category: 'hair' }, 'all')).toEqual({
      status: undefined,
      category: undefined,
      page: undefined,
    });
  });

  it('changes the search text and the page', () => {
    expect(searchWithText({ page: 2 }, '  barba ')).toEqual({ search: 'barba', page: undefined });
    expect(searchWithText({ search: 'barba' }, '')).toEqual({ search: undefined, page: undefined });
    expect(searchWithPage({}, 2)).toEqual({ page: 2 });
    expect(searchWithPage({ page: 2 }, 1)).toEqual({ page: undefined });
  });
});

describe('listParamsOf', () => {
  it('asks for every service of the first page by default', () => {
    expect(listParamsOf({})).toEqual({ page: 1, pageSize: 10, search: '', status: 'all', categoryCode: '' });
  });

  it('sends the status or the category, never both', () => {
    expect(listParamsOf({ status: 'active', page: 2 })).toMatchObject({
      page: 2,
      status: 'active',
      categoryCode: '',
    });
    expect(listParamsOf({ status: 'active', category: 'hair' })).toMatchObject({
      status: 'all',
      categoryCode: 'hair',
    });
  });
});
