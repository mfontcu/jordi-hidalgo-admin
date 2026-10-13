import {
  columnResizingFeature,
  columnSizingFeature,
  createColumnHelper,
  tableFeatures,
  useTable,
  type ColumnSizingState,
  type RowData,
} from '@tanstack/react-table';
import { useMemo, useState, type ReactNode, type UIEvent } from 'react';

import { cn } from '@/shared/lib/cn';

import { MAX_COLUMN_WIDTH, baseColumnWidth, resolveColumnWidths, type ColumnWidth } from './table-layout';
import { useElementWidth } from './use-element-width';

export type DataTableColumn<T> = ColumnWidth & {
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'start' | 'center';
  /** Cells with their own controls (the actions column): clicks stay in the cell. */
  interactive?: boolean;
};

type DataTableProps<T extends RowData> = {
  /** Accessible name of the table. */
  label: string;
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  /** The whole row opens it; `rowLabel` names that action for assistive technology. */
  onRowClick?: (row: T) => void;
  rowLabel?: (row: T) => string;
  /** Columns without a fixed width can be resized by dragging their header edge. */
  resizable?: boolean;
  /** Pagination bar inside the card, under the rows. */
  footer?: ReactNode;
};

const features = tableFeatures({ columnSizingFeature, columnResizingFeature });

// Header and row padding (16px at each end of a row); columns sit edge to edge in between.
const SIDE_PADDING = 16;

/**
 * AdminDataTable: header on the muted surface, rows that highlight on hover and open on click, and
 * columns that share the spare width by their `grow`. When the columns do not fit, the table
 * scrolls sideways with a fade at the clipped edges.
 */
export function DataTable<T extends RowData>({
  label,
  columns,
  rows,
  getRowId,
  onRowClick,
  rowLabel,
  resizable = false,
  footer,
}: DataTableProps<T>) {
  const [ref, width] = useElementWidth();
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [scroll, setScroll] = useState({ left: false, right: false });

  const columnDefs = useMemo(() => {
    const helper = createColumnHelper<typeof features, T>();
    return columns.map((column) =>
      helper.display({
        id: column.id,
        header: column.header,
        size: baseColumnWidth(column),
        minSize: column.fixedWidth ?? column.minWidth ?? 80,
        maxSize: column.fixedWidth ?? MAX_COLUMN_WIDTH,
        enableResizing: resizable && column.fixedWidth === undefined,
      }),
    );
  }, [columns, resizable]);

  const table = useTable({
    features,
    columns: columnDefs,
    data: rows,
    getRowId: (row) => getRowId(row),
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    enableColumnResizing: resizable,
  });

  const available = Math.max(0, (width ?? 0) - SIDE_PADDING * 2);
  const widths = resolveColumnWidths(columns, available, columnSizing);
  const columnsWidth = columns.reduce((sum, column) => sum + (widths[column.id] ?? 0), 0);
  const overflows = width !== null && columnsWidth > available + 0.5;

  const updateFades = (element: HTMLElement) => {
    const max = element.scrollWidth - element.clientWidth;
    const next = { left: element.scrollLeft > 0.5, right: element.scrollLeft < max - 0.5 };
    if (next.left !== scroll.left || next.right !== scroll.right) setScroll(next);
  };
  const scrollRef = (element: HTMLDivElement | null) => {
    if (element) updateFades(element);
  };

  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const lastIndex = columns.length - 1;
  const edge = (index: number) => (index === 0 ? 'pl-4' : index === lastIndex ? 'pr-4' : '');
  const cellWidth = (id: string, index: number) =>
    (widths[id] ?? 0) + (index === 0 ? SIDE_PADDING : 0) + (index === lastIndex ? SIDE_PADDING : 0);

  return (
    // Flutter wraps the table in a Card and a bordered container; the Card's border is the
    // one that shows.
    <div className="rounded-lg border border-border bg-card">
      <div ref={ref} className="overflow-hidden rounded-lg">
        <div className="relative">
          <div
            ref={scrollRef}
            className={cn(overflows ? 'overflow-x-auto' : 'overflow-x-hidden')}
            onScroll={(event: UIEvent<HTMLDivElement>) => {
              updateFades(event.currentTarget);
            }}
          >
            <table
              aria-label={label}
              className="table-fixed border-collapse"
              style={{ width: overflows ? columnsWidth + SIDE_PADDING * 2 : '100%' }}
            >
              <colgroup>
                {columns.map((column, index) => (
                  <col key={column.id} style={{ width: cellWidth(column.id, index) }} />
                ))}
              </colgroup>
              <thead className="bg-muted">
                <tr>
                  {headers.map((header, index) => {
                    const column = columns[index];
                    const canResize = header.column.getCanResize();
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        // Headers stay on the left whatever the column's alignment: Flutter lays the
                        // label out in a Stack, where its textAlign has no room to apply.
                        className={cn(
                          'group/header relative py-3 text-left text-label text-muted-foreground',
                          edge(index),
                        )}
                      >
                        <span className={cn('block truncate', canResize && 'pr-3')}>{column?.header}</span>
                        {canResize && (
                          <span
                            aria-hidden
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                              'absolute top-0.5 bottom-0.5 z-10 hidden w-2 cursor-col-resize items-center justify-center group-hover/header:flex',
                              index === lastIndex ? 'right-3.5' : '-right-0.5',
                            )}
                          >
                            <span className="h-4 w-px bg-border" />
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, rowIndex) => {
                  const data = row.original;
                  const last = rowIndex === rows.length - 1 && !footer;
                  return (
                    <tr
                      key={row.id}
                      className={cn('relative bg-card hover:bg-muted', !last && 'border-b border-border')}
                    >
                      {columns.map((column, index) => (
                        <td
                          key={column.id}
                          className={cn(
                            'overflow-hidden py-4 align-middle',
                            column.align === 'center' ? 'text-center' : 'text-left',
                            edge(index),
                          )}
                        >
                          {index === 0 && onRowClick && (
                            <button
                              type="button"
                              aria-label={rowLabel?.(data)}
                              onClick={() => {
                                onRowClick(data);
                              }}
                              className="absolute inset-0 cursor-pointer focus-visible:-outline-offset-2"
                            />
                          )}
                          <div
                            className={cn(
                              'min-w-0',
                              column.interactive ? 'relative z-10' : 'pointer-events-none relative',
                            )}
                          >
                            {column.cell(data)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {overflows && scroll.left && <Fade side="left" />}
          {overflows && scroll.right && <Fade side="right" />}
        </div>
        {footer}
      </div>
    </div>
  );
}

/** 28px from the card color to transparent, over a clipped edge. */
function Fade({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-y-0 w-7 from-card to-transparent',
        side === 'left' ? 'left-0 bg-linear-to-r' : 'right-0 bg-linear-to-l',
      )}
    />
  );
}
