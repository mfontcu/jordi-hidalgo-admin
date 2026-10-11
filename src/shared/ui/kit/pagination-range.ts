/** A list page as the backend reports it: 1-based page, page size, and total items. */
export type PageInfo = { page: number; pageSize: number; totalItems: number };

/** What the pagination bar shows (AdminDataTablePagination). */
export type PaginationRange = {
  totalPages: number;
  start: number;
  end: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
};

export function paginationRange({ page, pageSize, totalItems }: PageInfo): PaginationRange {
  const totalPages = totalItems <= 0 || pageSize <= 0 ? 1 : Math.ceil(totalItems / pageSize);
  return {
    totalPages,
    start: totalItems === 0 ? 0 : (page - 1) * pageSize + 1,
    end: Math.min(page * pageSize, totalItems),
    canGoPrevious: page > 1,
    canGoNext: page < totalPages,
  };
}
