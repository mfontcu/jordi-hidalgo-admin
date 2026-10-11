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
    await user.click(within(table).getByRole('button', { name: 'Bea' }));
    await user.click(nth(within(table).getAllByRole('button', { name: 'Act' }), 0));

    expect(opened).toEqual(['b']);
    expect(acted).toEqual(['a']);
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
  const renderPicker = (compact: boolean, onApply: (value: string) => void) =>
    renderWithProviders(
      <FilterPicker
        compact={compact}
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

  it.each([
    ['a sheet on compact layouts', true],
    ['a panel on wide layouts', false],
  ])('applies the chosen option from %s', async (_, compact) => {
    const applied: string[] = [];
    renderPicker(compact, (value) => applied.push(value));
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.click(await screen.findByRole('radio', { name: 'Active' }));
    expect(screen.getByRole('radio', { name: 'Active' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(applied).toEqual(['active']);
    expect(screen.queryByText('Choose')).not.toBeInTheDocument();
  });

  it('clears to its clear value', async () => {
    const applied: string[] = [];
    renderPicker(false, (value) => applied.push(value));
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.click(await screen.findByRole('button', { name: 'Clear' }));

    expect(applied).toEqual(['all']);
  });
});
