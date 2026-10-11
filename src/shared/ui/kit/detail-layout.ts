/**
 * Layout of a detail screen by its width (`_ServiceDetailLayoutSpec`, AdminUserDetailLayoutSpec:
 * the same values): padding, gaps, header sizes, two columns from 960px, and the summary padding.
 */
export type DetailLayout = {
  padding: number;
  gap: number;
  gapLarge: number;
  titleSize: number;
  subtitleSize: number;
  twoColumns: boolean;
  summaryPadding: number;
};

export function detailLayoutFor(width: number): DetailLayout {
  if (width < 560) {
    return {
      padding: 16,
      gap: 20,
      gapLarge: 24,
      titleSize: 24,
      subtitleSize: 14,
      twoColumns: false,
      summaryPadding: 18,
    };
  }
  if (width < 960) {
    return {
      padding: 20,
      gap: 22,
      gapLarge: 26,
      titleSize: 28,
      subtitleSize: 14,
      twoColumns: false,
      summaryPadding: 20,
    };
  }
  return {
    padding: 24,
    gap: 24,
    gapLarge: 28,
    titleSize: 30,
    subtitleSize: 15,
    twoColumns: true,
    summaryPadding: 22,
  };
}
