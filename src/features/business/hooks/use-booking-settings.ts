import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { updateBookingSettings } from '../api/business.mutations';
import {
  bookingSettingsFormSchema,
  bookingSettingsFormValues,
  toBookingSettingsUpdate,
  type BookingSettings,
  type BookingSettingsFormErrorKey,
  type BookingSettingsFormInput,
} from '../model/booking-settings';

type Feedback = {
  onSaved: () => void;
  onError: (error: unknown) => void;
};

/**
 * Booking settings tab: numeric fields as strings, optional first/last dates, save with UnsavedChangesGuard.
 */
export function useBookingSettings(settings: BookingSettings, feedback: Feedback) {
  const queryClient = useQueryClient();

  const form = useForm<BookingSettingsFormInput>({
    resolver: zodResolver(bookingSettingsFormSchema),
    defaultValues: bookingSettingsFormValues(settings),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  useEffect(() => {
    form.reset(bookingSettingsFormValues(settings));
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: (input: BookingSettingsFormInput) =>
      updateBookingSettings(queryClient, settings, toBookingSettingsUpdate(input), {
        bookingFirstDate: input.bookingFirstDate,
        bookingLastDate: input.bookingLastDate,
      }),
    onSuccess: () => {
      form.reset(form.getValues());
      feedback.onSaved();
    },
    onError: feedback.onError,
  });

  const { errors, isDirty } = form.formState;
  const errorKey = (field: keyof BookingSettingsFormInput) =>
    errors[field]?.message as BookingSettingsFormErrorKey | undefined;

  return {
    form,
    errorKey,
    submit: form.handleSubmit((input) => {
      mutation.mutate(input);
    }),
    isSaving: mutation.isPending,
    hasUnsavedChanges: isDirty && !mutation.isPending && !mutation.isSuccess,
  };
}
