/**
 * Layout of a detail screen by its content width: padding, gaps, two columns from 960px, and
 * the summary padding. Headings use the title step, not a per-width size.
 */
export type DetailLayout = {
  padding: number;
  gap: number;
  gapLarge: number;
  twoColumns: boolean;
  summaryPadding: number;
};

export function detailLayoutFor(width: number): DetailLayout {
  if (width < 560) {
    return {
      padding: 16,
      gap: 20,
      gapLarge: 24,
      twoColumns: false,
      summaryPadding: 18,
    };
  }
  if (width < 960) {
    return {
      padding: 20,
      gap: 22,
      gapLarge: 26,
      twoColumns: false,
      summaryPadding: 20,
    };
  }
  return {
    padding: 24,
    gap: 24,
    gapLarge: 28,
    twoColumns: true,
    summaryPadding: 22,
  };
}
