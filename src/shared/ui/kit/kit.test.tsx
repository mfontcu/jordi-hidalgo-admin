import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setViewport } from '@/test/match-media';
import { nth } from '@/test/nth';
import { renderWithProviders } from '@/test/render';

import { TooltipProvider } from '../primitives/tooltip';
import { DataTable, type DataTableColumn } from './data-table';
import { Pagination } from './data-display';
import { FilterPicker, ToolbarField } from './toolbar';

type Row = { id: string; name: string };
const rows: Row[] = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Bea' },
];

const labels = {
  range: (start: number, end: number, total: number) => `${start}-${end} of ${total}`,
  page: (current: number, total: number) => `Page ${current}/${total}`,
  previous: 'Previous',
  next: 'Next',
};

describe('DataTable', () => {
  it('opens a row from anywhere in it, while the actions keep their own clicks', async () => {
    const opened: string[] = [];
    const acted: string[] = [];
    const columns: DataTableColumn<Row>[] = [
      { id: 'name', header: 'Name', cell: (row) => row.name },
      {
        id: 'actions',
        header: 'Actions',
        fixedWidth: 100,
        interactive: true,
        cell: (row) => (
          <button
            type="button"
            onClick={() => {
              acted.push(row.id);
            }}
          >
            Act
          </button>
        ),
      },
    ];
    renderWithProviders(
      <DataTable
        label="People"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          opened.push(row.id);
        }}
        rowLabel={(row) => row.name}
      />,
    );
    const user = userEvent.setup();

    const table = screen.getByRole('table', { name: 'People' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Name', 'Actions']);
    for (const row of within(table).getAllByRole('row').slice(1)) {
      expect(row).not.toHaveClass('relative');
    }

    await user.click(within(table).getByText('Bea'));
    await user.click(nth(within(table).getAllByRole('button', { name: 'Act' }), 0));
    await user.click(within(table).getByRole('button', { name: 'Ana' }));

    expect(opened).toEqual(['b', 'a']);
    expect(acted).toEqual(['a']);
  });

  it('replaces the page instead of keeping the first row of page 1', () => {
    const pages = [0, 1, 2].map((page) =>
      Array.from({ length: 10 }, (_, index) => ({
        id: `p${page}-${index}`,
        name: page === 0 && index === 0 ? 'First of page 1' : `P${page + 1} row ${index + 1}`,
      })),
    );
    const columnsFor = (stamp: number): DataTableColumn<Row>[] => [
      { id: 'name', header: `Name ${stamp}`, cell: (row) => row.name },
      {
        id: 'actions',
        header: 'Actions',
        fixedWidth: 100,
        interactive: true,
        cell: () => <button type="button">Act</button>,
      },
    ];

    const pageAt = (page: number) => {
      const rows = pages[page];
      if (!rows) throw new Error(`missing page ${page}`);
      return rows;
    };

    const { rerender } = renderWithProviders(
      <DataTable
        label="People"
        columns={columnsFor(0)}
        rows={pageAt(0)}
        getRowId={(row) => row.id}
        onRowClick={() => undefined}
        rowLabel={(row) => row.name}
      />,
    );

    const bodyRows = () =>
      within(screen.getByRole('table', { name: 'People' }))
        .getAllByRole('row')
        .slice(1);

    const show = (page: number, stamp: number) => {
      rerender(
        <DataTable
          label="People"
          columns={columnsFor(stamp)}
          rows={pageAt(page)}
          getRowId={(row) => row.id}
          onRowClick={() => undefined}
          rowLabel={(row) => row.name}
        />,
      );
    };

    let stamp = 1;
    for (const page of [1, 0, 1, 0, 1, 2, 1, 2]) {
      show(page, stamp);
      stamp += 1;
      const rows = bodyRows();
      expect(rows).toHaveLength(10);
      const firstOfPage1 = rows.filter((row) => within(row).queryByText('First of page 1'));
      expect(firstOfPage1).toHaveLength(page === 0 ? 1 : 0);
    }
  });
});

describe('Pagination', () => {
  it('moves between pages and disables the ends', async () => {
    const pages: number[] = [];
    renderWithProviders(
      <TooltipProvider>
        <Pagination
          page={1}
          pageSize={10}
          totalItems={25}
          labels={labels}
          onPageChange={(page) => pages.push(page)}
        />
      </TooltipProvider>,
    );
    const user = userEvent.setup();

    expect(screen.getByText('1-10 of 25')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(pages).toEqual([2]);
  });

  it('drops the button labels under 720px', () => {
    setViewport({ width: 600 });
    renderWithProviders(
      <TooltipProvider>
        <Pagination page={2} pageSize={10} totalItems={25} labels={labels} onPageChange={() => undefined} />
      </TooltipProvider>,
    );

    expect(screen.getByRole('button', { name: 'Next' })).not.toHaveTextContent('Next');
  });
});

describe('FilterPicker', () => {
  const renderPicker = (width: number, onApply: (value: string) => void) => {
    setViewport({ width });
    renderWithProviders(
      <FilterPicker
        compact={width < 768}
        trigger={<ToolbarField icon="tune_rounded" label="All" />}
        title="Filter"
        subtitle="Choose"
        clearLabel="Clear"
        applyLabel="Apply"
        options={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
        ]}
        value="all"
        clearValue="all"
        onApply={onApply}
      />,
    );
  };

  it.each([
    ['a sheet under 768px', 390, true],
    ['a sheet at 767px', 767, true],
    ['a popover from 768px', 768, false],
    ['a popover at 1280px', 1280, false],
  ])('applies the chosen option from %s', async (_, width, sheet) => {
    const applied: string[] = [];
    renderPicker(width, (value) => applied.push(value));
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'All' }));
    const panel = await screen.findByRole('dialog');
    if (sheet) {
      expect(panel).not.toHaveAttribute('data-side');
    } else {
      expect(panel).toHaveAttribute('data-side');
    }
    expect(within(panel).getByText('Choose')).toBeInTheDocument();
    await user.click(await screen.findByRole('radio', { name: 'Active' }));
    expect(screen.getByRole('radio', { name: 'Active' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(applied).toEqual(['active']);
    expect(screen.queryByText('Choose')).not.toBeInTheDocument();
  });

  it('clears to its clear value', async () => {
    const applied: string[] = [];
    renderPicker(1280, (value) => applied.push(value));
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.click(await screen.findByRole('button', { name: 'Clear' }));

    expect(applied).toEqual(['all']);
  });
});
