import { listLayoutFor, summaryColumnsFor } from './list-layout';
import { paginationRange } from './pagination-range';
import { baseColumnWidth, clampColumnWidth, resolveColumnWidths } from './table-layout';

describe('listLayoutFor', () => {
  it.each([
    [390, 16, true, 1],
    [559, 16, true, 1],
    [560, 20, true, 2],
    [899, 20, true, 2],
    [900, 24, false, 5],
    [1440, 24, false, 5],
  ])('at %ipx: padding %i, compact %s, %i summary columns', (width, padding, compact, columns) => {
    expect(listLayoutFor(width)).toMatchObject({ pagePadding: padding, compact, summaryColumns: columns });
  });

  it('grows the summary cards from 1280px', () => {
    expect(listLayoutFor(1279)).toMatchObject({ summaryCardHeight: 136, summaryValueSize: 34 });
    expect(listLayoutFor(1280)).toMatchObject({ summaryCardHeight: 140, summaryValueSize: 36 });
  });
});

describe('summaryColumnsFor', () => {
  it('puts every card in one row on desktop', () => {
    expect(summaryColumnsFor(listLayoutFor(1440), 4)).toBe(4);
  });

  it('uses one or two columns when compact', () => {
    expect(summaryColumnsFor(listLayoutFor(390), 4)).toBe(1);
    expect(summaryColumnsFor(listLayoutFor(700), 4)).toBe(2);
    expect(summaryColumnsFor(listLayoutFor(700), 1)).toBe(1);
  });
});

describe('resolveColumnWidths', () => {
  const columns = [
    { id: 'name', initialWidth: 200, minWidth: 150, grow: 3 },
    { id: 'price', initialWidth: 100, grow: 1 },
    { id: 'status', fixedWidth: 100 },
  ];

  it('shares the spare width among the growing columns by their grow factor', () => {
    expect(resolveColumnWidths(columns, 800)).toEqual({ name: 500, price: 200, status: 100 });
  });

  it('keeps the widths when the columns do not fit, so the table scrolls', () => {
    expect(resolveColumnWidths(columns, 300)).toEqual({ name: 200, price: 100, status: 100 });
  });

  it('starts from the resized widths, never from a fixed column', () => {
    expect(resolveColumnWidths(columns, 400, { name: 250, status: 300 })).toEqual({
      name: 250,
      price: 100,
      status: 100,
    });
  });

  it('defaults a column to max(minWidth, 140)', () => {
    expect(baseColumnWidth({ id: 'a' })).toBe(140);
    expect(baseColumnWidth({ id: 'a', minWidth: 170 })).toBe(170);
  });

  it('keeps a resized width between the floor and 900px', () => {
    expect(clampColumnWidth({ id: 'a', minWidth: 120 }, 50)).toBe(120);
    expect(clampColumnWidth({ id: 'a' }, 50)).toBe(80);
    expect(clampColumnWidth({ id: 'a' }, 2000)).toBe(900);
  });
});

describe('paginationRange', () => {
  it('reports the items shown and the page count', () => {
    expect(paginationRange({ page: 2, pageSize: 10, totalItems: 25 })).toEqual({
      totalPages: 3,
      start: 11,
      end: 20,
      canGoPrevious: true,
      canGoNext: true,
    });
  });

  it('ends at the last item on the last page', () => {
    expect(paginationRange({ page: 3, pageSize: 10, totalItems: 25 })).toMatchObject({
      start: 21,
      end: 25,
      canGoNext: false,
    });
  });

  it('shows one empty page when there are no items', () => {
    expect(paginationRange({ page: 1, pageSize: 10, totalItems: 0 })).toEqual({
      totalPages: 1,
      start: 0,
      end: 0,
      canGoPrevious: false,
      canGoNext: false,
    });
  });
});
