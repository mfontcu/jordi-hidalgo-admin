import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useState } from 'react';

import { businessDayOf, dayEndInstant, dayStartInstant } from '@/shared/lib/business-time';

import { cancelRangeAppointments } from '../api/appointments.mutations';
import { rangeAppointmentsQueryOptions } from '../api/appointments.queries';
import { conflictsOf, type AppointmentItem } from '../model/appointment';

/** A range to check: two instants. */
export type ConflictRange = { start: string; end: string };

/** Go on, cancelling the appointments in the range with the block's reason, or keeping them. */
export type ConflictDecision = {
  cancelConflicts: ((reason: string) => Promise<{ cancelled: number; failed: number }>) | null;
};

export type ConflictHandlers = {
  onResolved: (decision: ConflictDecision) => void;
  /** The user went back from the dialog: nothing is saved. */
  onDismissed: () => void;
  onFailed: (error: unknown) => void;
};

/**
 * Checks a blocked range against the agenda (loadAppointmentsOverlappingBlockedRange): it reads the
 * appointments of the range's salon days, and goes on at once when none overlaps; otherwise the
 * dialog lists them and asks whether to cancel them.
 */
export function useRangeConflicts(range: ConflictRange | null, handlers: ConflictHandlers) {
  const queryClient = useQueryClient();
  const [conflicts, setConflicts] = useState<AppointmentItem[]>([]);
  const [cancelChecked, setCancelChecked] = useState(false);

  const resolve = useEffectEvent((items: AppointmentItem[]) => {
    setCancelChecked(false);
    if (items.length === 0) handlers.onResolved({ cancelConflicts: null });
    setConflicts(items);
  });
  const fail = useEffectEvent((error: unknown) => {
    handlers.onFailed(error);
  });

  const start = range?.start ?? null;
  const end = range?.end ?? null;
  useEffect(() => {
    if (start === null || end === null) return;
    const from = businessDayOf(start);
    const to = businessDayOf(end);
    if (!from || !to) return;
    let current = true;
    queryClient.query(rangeAppointmentsQueryOptions(dayStartInstant(from), dayEndInstant(to))).then(
      (items) => {
        if (current) resolve(conflictsOf(items, start, end));
      },
      (error: unknown) => {
        if (current) fail(error);
      },
    );
    return () => {
      current = false;
    };
  }, [queryClient, start, end]);

  const close = () => {
    setConflicts([]);
  };

  return {
    conflicts,
    open: range !== null && conflicts.length > 0,
    cancelChecked,
    setCancelChecked,
    confirm: () => {
      const chosen = conflicts;
      close();
      handlers.onResolved({
        cancelConflicts: cancelChecked
          ? (reason: string) => cancelRangeAppointments(queryClient, chosen, reason)
          : null,
      });
    },
    dismiss: () => {
      close();
      handlers.onDismissed();
    },
  };
}
