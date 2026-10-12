import { useEffect, useState } from 'react';

import type { BusinessDay } from './business-time';
import { dateFilterRange, filterOfPick, type DateFilter, type DatePick } from './date-filter';

/** Flutter waits for the date sheet to close before it opens the range picker. */
const RANGE_PICKER_DELAY_MS = 180;

/**
 * The date filter of a list (showAdminDateQuickPickSheet or the blocked-slot date sheet, then the
 * range picker): a preset applies at once, and "Choose a range…" opens the range picker once the
 * sheet has closed.
 */
export function useDateFilter(filter: DateFilter, today: BusinessDay, apply: (next: DateFilter) => void) {
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangePending, setRangePending] = useState(false);
  useEffect(() => {
    if (!rangePending) return;
    const timer = setTimeout(() => {
      setRangePending(false);
      setRangeOpen(true);
    }, RANGE_PICKER_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [rangePending]);

  return {
    today,
    dateFilter: filter,
    /** The days the date filter covers, which the range picker opens on. */
    dateRange: dateFilterRange(filter, today),
    pickDate: (pick: DatePick) => {
      const next = filterOfPick(pick);
      if (next) apply(next);
      else setRangePending(true);
    },
    rangeOpen,
    setRangeOpen,
    applyRange: (from: BusinessDay, to: BusinessDay) => {
      setRangeOpen(false);
      apply({ kind: 'range', from, to });
    },
    clearDate: () => {
      apply({ kind: 'all' });
    },
  };
}
