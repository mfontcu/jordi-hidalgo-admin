import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { businessDayOf, businessToday, type ClockTime } from '@/shared/lib/business-time';
import { useGoBack } from '@/shared/lib/use-go-back';

import { createBlockedSlot, updateBlockedSlot } from '../api/schedule.mutations';
import { blockedSlotDetailQueryOptions } from '../api/schedule.queries';
import type { BlockedSlot } from '../model/blocked-slot';
import {
  blockedSlotDayRange,
  blockedSlotFormDefaults,
  blockedSlotFormSchema,
  rangeChanged,
  type BlockedSlotFormErrorKey,
  type BlockedSlotFormInput,
  type BlockedSlotInput,
} from '../model/blocked-slot-form';
import { endAfterStartChange } from '../model/working-hours';

/** What the form screen needs first: for an edit (`/schedule/blocked-slots/{id}/form`), the block. */
export function useBlockedSlotFormData() {
  const params = useParams({ strict: false });
  const id = params.blockedSlotId ?? null;
  const query = useQuery({ ...blockedSlotDetailQueryOptions(id ?? ''), enabled: id !== null });
  return {
    isEdit: id !== null,
    slot: id === null ? null : query.data,
    isLoading: id !== null && query.isPending,
    error: id !== null && query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    goBack: useGoBack('/schedule/blocked-slots'),
  };
}

type CancelConflicts = ((reason: string) => Promise<{ cancelled: number; failed: number }>) | null;

type FormOptions = {
  slot: BlockedSlot | null;
  onSaved: (isEdit: boolean, cancellation: { cancelled: number; failed: number } | null) => void;
  onError: (
    error: unknown,
    context: 'scheduleBlockedSlotFormSaveError' | 'blockedSlotConflictCheckFailed',
  ) => void;
};

/**
 * The blocked-slot form (BlockedSlotForm): validation on submit, then the appointments the range
 * covers, then the save. Flutter checks them only for a new block; the panel also checks an edit
 * that moves it (approved change). A new block opens its detail, replacing the form in the
 * history; an edit goes back to the detail it came from.
 */
export function useBlockedSlotForm({ slot, onSaved, onError }: FormOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const today = businessToday();

  const form = useForm<BlockedSlotFormInput, unknown, BlockedSlotInput>({
    resolver: zodResolver(blockedSlotFormSchema),
    defaultValues: blockedSlotFormDefaults(slot),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  /** A save waiting for the appointments check. */
  const [pending, setPending] = useState<BlockedSlotInput | null>(null);

  const save = useMutation({
    mutationFn: async ({
      input,
      cancelConflicts,
    }: {
      input: BlockedSlotInput;
      cancelConflicts: CancelConflicts;
    }) => {
      const saved = slot
        ? await updateBlockedSlot(queryClient, slot.id, input)
        : await createBlockedSlot(queryClient, input);
      const cancellation = cancelConflicts ? await cancelConflicts(input.reason) : null;
      return { saved, cancellation };
    },
    onSuccess: ({ saved, cancellation }) => {
      onSaved(slot !== null, cancellation);
      if (slot && router.history.canGoBack()) {
        router.history.back({ ignoreBlocker: true });
        return;
      }
      void navigate({
        to: '/schedule/blocked-slots/$blockedSlotId',
        params: { blockedSlotId: saved.id },
        replace: true,
        ignoreBlocker: true,
      });
    },
    onError: (error) => {
      onError(error, 'scheduleBlockedSlotFormSaveError');
    },
  });

  const values = useWatch({ control: form.control });
  const { errors, isDirty } = form.formState;
  const errorKey = (field: keyof BlockedSlotFormInput) =>
    errors[field]?.message as BlockedSlotFormErrorKey | undefined;
  const dirty = { shouldDirty: true } as const;

  return {
    form,
    errorKey,
    values: {
      day: values.day ?? '',
      fullDay: values.fullDay ?? false,
      start: values.start ?? null,
      end: values.end ?? null,
      reason: values.reason ?? '',
      showOnPublicSite: values.showOnPublicSite ?? true,
    },
    today,
    dayRange: blockedSlotDayRange(today, slot ? businessDayOf(slot.startAt) : null),
    setDay: (day: string) => {
      form.setValue('day', day, dirty);
    },
    setFullDay: (fullDay: boolean) => {
      form.setValue('fullDay', fullDay, dirty);
    },
    setStart: (start: ClockTime) => {
      form.setValue('start', start, dirty);
      form.setValue('end', endAfterStartChange(start, form.getValues('end')), dirty);
    },
    setEnd: (end: ClockTime) => {
      form.setValue('end', end, dirty);
    },
    setShowOnPublicSite: (show: boolean) => {
      form.setValue('showOnPublicSite', show, dirty);
    },

    submit: form.handleSubmit((input) => {
      if (!slot || rangeChanged(slot, input)) setPending(input);
      else save.mutate({ input, cancelConflicts: null });
    }),
    isSaving: pending !== null || save.isPending,
    /** Leaving asks first while there are changes, and not once the block is saved. */
    hasUnsavedChanges: isDirty && !save.isPending && !save.isSuccess,

    /** What `AppointmentConflictsCheck` needs while a save waits for it. */
    conflictCheck: {
      range: pending ? { start: pending.startAt, end: pending.endAt } : null,
      onResolved: ({ cancelConflicts }: { cancelConflicts: CancelConflicts }) => {
        const input = pending;
        setPending(null);
        if (input) save.mutate({ input, cancelConflicts });
      },
      onDismissed: () => {
        setPending(null);
      },
      onFailed: (error: unknown) => {
        setPending(null);
        onError(error, 'blockedSlotConflictCheckFailed');
      },
    },
  };
}
