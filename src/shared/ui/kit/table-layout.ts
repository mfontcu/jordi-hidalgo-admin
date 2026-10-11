/** Width rules of a table column (AdminDataTableColumn). */
export type ColumnWidth = {
  id: string;
  /** Width that never changes and never grows. */
  fixedWidth?: number;
  /** Starting width; `max(minWidth, 140)` when missing. */
  initialWidth?: number;
  /** Floor of a resized column. Defaults to 80. */
  minWidth?: number;
  /** Share of the spare width the column takes. Defaults to 1; 0 keeps its width. */
  grow?: number;
};

export const MAX_COLUMN_WIDTH = 900;
const DEFAULT_MIN_WIDTH = 80;

/** Starting width of a column (`_baseWidth` before any resize). */
export function baseColumnWidth(column: ColumnWidth): number {
  return column.fixedWidth ?? column.initialWidth ?? Math.max(column.minWidth ?? DEFAULT_MIN_WIDTH, 140);
}

/** A resized width, kept between the column's floor and 900px (`_updateColumnWidth`). */
export function clampColumnWidth(column: ColumnWidth, width: number): number {
  return Math.min(Math.max(width, column.minWidth ?? DEFAULT_MIN_WIDTH), MAX_COLUMN_WIDTH);
}

/**
 * Width of every column for the space available (`_resolvedViewportWidths`). When the columns
 * fit, the spare width goes to the growing columns in proportion to `grow`; when they do not, they
 * keep their widths and the table scrolls sideways. `widths` holds the resized widths.
 */
export function resolveColumnWidths(
  columns: readonly ColumnWidth[],
  available: number,
  widths: Readonly<Record<string, number>> = {},
): Record<string, number> {
  const base = Object.fromEntries(
    columns.map((column) => [column.id, column.fixedWidth ?? widths[column.id] ?? baseColumnWidth(column)]),
  );
  const total = Object.values(base).reduce((sum, width) => sum + width, 0);
  if (total >= available) return base;

  const growing = columns.filter((column) => column.fixedWidth === undefined && (column.grow ?? 1) > 0);
  const totalGrow = growing.reduce((sum, column) => sum + (column.grow ?? 1), 0);
  if (totalGrow === 0) return base;

  const spare = available - total;
  const resolved = { ...base };
  for (const column of growing) {
    resolved[column.id] = (base[column.id] ?? 0) + (spare * (column.grow ?? 1)) / totalGrow;
  }
  return resolved;
}
