import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { ClockTime, Weekday } from '@/shared/lib/business-time';

import { changeShift, setWeekdayActive } from '../api/schedule.mutations';
import { workingHoursQueryOptions } from '../api/schedule.queries';
import {
  endAfterStartChange,
  shiftDeleteOf,
  shiftSaveOf,
  validateShift,
  type ShiftChange,
  type ShiftErrors,
  type ShiftSlot,
  type WorkingDay,
} from '../model/working-hours';

export type ShiftFailure =
  | 'scheduleErrorUpdateDay'
  | 'scheduleErrorSaveMorningShift'
  | 'scheduleErrorSaveAfternoonShift'
  | 'scheduleErrorDeleteMorningShift'
  | 'scheduleErrorDeleteAfternoonShift';

type Feedback = { onError: (error: unknown, context: ShiftFailure) => void };

/** A shift of a day: what the editor and the delete confirmation work on. */
export type ShiftTarget = { weekday: Weekday; slot: ShiftSlot };

const failureOf = (change: ShiftChange, slot: ShiftSlot): ShiftFailure => {
  if (change.kind === 'delete') {
    return slot === 'morning' ? 'scheduleErrorDeleteMorningShift' : 'scheduleErrorDeleteAfternoonShift';
  }
  return slot === 'morning' ? 'scheduleErrorSaveMorningShift' : 'scheduleErrorSaveAfternoonShift';
};

/**
 * Working hours (WorkingHoursScreen): the week, its summary, each day's switch, and its shifts. The
 * editor closes as it saves, as Flutter's sheet does; a delete asks first (approved change).
 */
export function useWorkingHours(feedback: Feedback) {
  const queryClient = useQueryClient();
  const query = useQuery(workingHoursQueryOptions());
  const [editing, setEditing] = useState<ShiftTarget | null>(null);
  const [deleting, setDeleting] = useState<ShiftTarget | null>(null);

  const dayToggle = useMutation({
    mutationFn: ({ weekday, isActive }: { weekday: Weekday; isActive: boolean }) =>
      setWeekdayActive(queryClient, weekday, isActive),
    onError: (error) => {
      feedback.onError(error, 'scheduleErrorUpdateDay');
    },
  });

  const shift = useMutation({
    mutationFn: ({ change }: { change: ShiftChange; slot: ShiftSlot }) => changeShift(queryClient, change),
    onError: (error, { change, slot }) => {
      feedback.onError(error, failureOf(change, slot));
    },
  });

  const days = query.data?.days ?? [];
  const dayOf = (weekday: Weekday) => days.find((day) => day.weekday === weekday);

  return {
    hours: query.data,
    isLoading: query.isPending,
    error: query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },

    /** The switch shows the requested value while the request runs, then the server's. */
    isDayActive: (day: WorkingDay) =>
      dayToggle.isPending && dayToggle.variables.weekday === day.weekday
        ? dayToggle.variables.isActive
        : day.isActive,
    setDayActive: (day: WorkingDay, isActive: boolean) => {
      dayToggle.mutate({ weekday: day.weekday, isActive });
    },

    editing: editing ? { ...editing, day: dayOf(editing.weekday) ?? null } : null,
    edit: (target: ShiftTarget) => {
      setEditing(target);
    },
    closeEditor: () => {
      setEditing(null);
    },
    save: (target: ShiftTarget, start: ClockTime, end: ClockTime) => {
      const day = dayOf(target.weekday);
      setEditing(null);
      if (day) shift.mutate({ change: shiftSaveOf(day, target.slot, start, end), slot: target.slot });
    },

    deleting: deleting ? { ...deleting, day: dayOf(deleting.weekday) ?? null } : null,
    askDelete: (target: ShiftTarget) => {
      setEditing(null);
      setDeleting(target);
    },
    cancelDelete: () => {
      setDeleting(null);
    },
    confirmDelete: () => {
      const target = deleting;
      setDeleting(null);
      const day = target ? dayOf(target.weekday) : undefined;
      const change = day && target ? shiftDeleteOf(day, target.slot) : null;
      if (change && target) shift.mutate({ change, slot: target.slot });
    },
  };
}

/**
 * `_EditTimeRangeSheet`: the start and end of a shift, validated on save. A new start moves an end
 * that no longer follows it to half an hour later.
 */
export function useShiftEditor(day: WorkingDay, slot: ShiftSlot) {
  const shift = day[slot];
  const [start, setStart] = useState<ClockTime | null>(shift?.start ?? null);
  const [end, setEnd] = useState<ClockTime | null>(shift?.end ?? null);
  const [errors, setErrors] = useState<ShiftErrors>({});

  return {
    start,
    end,
    errors,
    setStart: (value: ClockTime) => {
      setStart(value);
      setEnd((current) => endAfterStartChange(value, current));
      setErrors({});
    },
    setEnd: (value: ClockTime) => {
      setEnd(value);
      setErrors({});
    },
    /** The times to save, or null after showing what is wrong. */
    validate: (): { start: ClockTime; end: ClockTime } | null => {
      const found = validateShift(day, slot, start, end);
      setErrors(found);
      if (found.start || found.end || start === null || end === null) return null;
      return { start, end };
    },
  };
}
