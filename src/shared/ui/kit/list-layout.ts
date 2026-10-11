/**
 * Layout of a list page by the width of its content area (AdminListPageLayoutSpec.fromWidth):
 * padding, gaps, title and summary sizes, and whether rows show as a table or as cards.
 * Under 900px the page is compact: the toolbar stacks, the summary folds, and rows are cards.
 */
export type ListLayout = {
  pagePadding: number;
  sectionGap: number;
  sectionGapLarge: number;
  titleSize: number;
  summaryColumns: number;
  summaryCardHeight: number;
  summaryValueSize: number;
  compact: boolean;
};

export function listLayoutFor(width: number): ListLayout {
  if (width < 560) {
    return {
      pagePadding: 16,
      sectionGap: 20,
      sectionGapLarge: 24,
      titleSize: 26,
      summaryColumns: 1,
      summaryCardHeight: 132,
      summaryValueSize: 30,
      compact: true,
    };
  }
  if (width < 900) {
    return {
      pagePadding: 20,
      sectionGap: 22,
      sectionGapLarge: 26,
      titleSize: 28,
      summaryColumns: 2,
      summaryCardHeight: 136,
      summaryValueSize: 32,
      compact: true,
    };
  }
  if (width < 1280) {
    return {
      pagePadding: 24,
      sectionGap: 24,
      sectionGapLarge: 28,
      titleSize: 30,
      summaryColumns: 5,
      summaryCardHeight: 136,
      summaryValueSize: 34,
      compact: false,
    };
  }
  return {
    pagePadding: 24,
    sectionGap: 24,
    sectionGapLarge: 28,
    titleSize: 30,
    summaryColumns: 5,
    summaryCardHeight: 140,
    summaryValueSize: 36,
    compact: false,
  };
}

/** Summary columns (summaryColumnsForItemCount): one row on desktop, one or two when compact. */
export function summaryColumnsFor(layout: ListLayout, itemCount: number): number {
  if (itemCount <= 0) return 1;
  if (!layout.compact) return itemCount;
  if (itemCount === 1) return 1;
  return layout.summaryColumns;
}
