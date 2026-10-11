import type { IntlShape } from 'react-intl';

/** The pagination bar's copy (adminTable* messages), in the shape of the kit's `PaginationLabels`. */
export function paginationLabels(intl: IntlShape) {
  return {
    range: (start: number, end: number, total: number) =>
      intl.formatMessage({ id: 'adminTableShowingRange' }, { start, end, total }),
    page: (current: number, total: number) =>
      intl.formatMessage({ id: 'adminTablePageIndicator' }, { current, total }),
    previous: intl.formatMessage({ id: 'adminCommonPrevious' }),
    next: intl.formatMessage({ id: 'adminCommonNext' }),
  };
}
