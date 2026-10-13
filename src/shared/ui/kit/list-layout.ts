/**
 * Layout of a list page by the width of its content area: padding, gaps, and whether rows show
 * as a table or as cards. From 900px the page is one layout. Under 900px it is compact: the
 * toolbar stacks, the summary folds, and rows are cards.
 */
export type ListLayout = {
  pagePadding: number;
  sectionGap: number;
  sectionGapLarge: number;
  summaryColumns: number;
  compact: boolean;
};

export function listLayoutFor(width: number): ListLayout {
  if (width < 560) {
    return {
      pagePadding: 16,
      sectionGap: 20,
      sectionGapLarge: 24,
      summaryColumns: 1,
      compact: true,
    };
  }
  if (width < 900) {
    return {
      pagePadding: 20,
      sectionGap: 22,
      sectionGapLarge: 26,
      summaryColumns: 2,
      compact: true,
    };
  }
  return {
    pagePadding: 24,
    sectionGap: 24,
    sectionGapLarge: 28,
    summaryColumns: 5,
    compact: false,
  };
}

/** Summary columns: one row on desktop, one or two when compact. */
export function summaryColumnsFor(layout: ListLayout, itemCount: number): number {
  if (itemCount <= 0) return 1;
  if (!layout.compact) return itemCount;
  if (itemCount === 1) return 1;
  return layout.summaryColumns;
}
