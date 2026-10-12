import { useEffect, useState } from 'react';

import type { BusinessDay } from '@/shared/lib/business-time';

import { dateFilterRange, type DateFilter, type DateQuickPick } from '../model/date-filter';

/** Flutter waits for the date sheet to close before it opens the range picker. */
const RANGE_PICKER_DELAY_MS = 180;

/**
 * The date filter of a users list (showAdminDateQuickPickSheet, then the range picker): the quick
 * picks apply at once, and "Choose a range…" opens the range picker once the sheet has closed.
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
    pickDate: (pick: DateQuickPick) => {
      if (pick === 'custom') setRangePending(true);
      else apply({ kind: pick === 'allTime' ? 'all' : pick === 'today' ? 'today' : 'month' });
    },
    rangeOpen,
    setRangeOpen,
    applyRange: (from: string, to: string) => {
      setRangeOpen(false);
      apply({ kind: 'range', from, to });
    },
    clearDate: () => {
      apply({ kind: 'all' });
    },
  };
}
