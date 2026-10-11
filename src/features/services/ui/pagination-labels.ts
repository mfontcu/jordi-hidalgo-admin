import type { IntlShape } from 'react-intl';

import type { PaginationLabels } from '@/shared/ui';

/** The pagination bar's copy (adminTable* messages). */
export function paginationLabels(intl: IntlShape): PaginationLabels {
  return {
    range: (start, end, total) => intl.formatMessage({ id: 'adminTableShowingRange' }, { start, end, total }),
    page: (current, total) => intl.formatMessage({ id: 'adminTablePageIndicator' }, { current, total }),
    previous: intl.formatMessage({ id: 'adminCommonPrevious' }),
    next: intl.formatMessage({ id: 'adminCommonNext' }),
  };
}
