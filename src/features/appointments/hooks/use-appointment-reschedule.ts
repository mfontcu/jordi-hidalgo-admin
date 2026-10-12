import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useRouter } from '@tanstack/react-router';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import { businessDayOf, clockTimeOfInstant, instantAt, isClockTime } from '@/shared/lib/business-time';

import { rescheduleAppointment } from '../api/appointments.mutations';
import {
  appointmentDetailQueryOptions,
  availableDatesQueryOptions,
  availableSlotsQueryOptions,
} from '../api/appointments.queries';
import { canReschedule } from '../model/appointment';
import { pickAvailableDay, pickAvailableTime } from '../model/appointment-form';

type Options = {
  onSuccess: () => void;
  onError: (error: unknown) => void;
  onCannotReschedule: () => void;
};

/**
 * Reschedule screen: loads the appointment, available dates and slots (excluding itself), and
 * patches the start. Without a registered client it exits, as Flutter does.
 */
export function useAppointmentReschedule({ onSuccess, onError, onCannotReschedule }: Options) {
  const { appointmentId } = useParams({ from: '/_authed/appointments/$appointmentId/reschedule' });
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const detail = useQuery(appointmentDetailQueryOptions(appointmentId));
  const appointment = detail.data;

  const leaveWithoutClient = useEffectEvent(() => {
    onCannotReschedule();
    if (router.history.canGoBack()) router.history.back();
    else void navigate({ to: '/appointments/$appointmentId', params: { appointmentId }, replace: true });
  });

  useEffect(() => {
    if (!appointment) return;
    if (!canReschedule(appointment.userId)) leaveWithoutClient();
  }, [appointment]);

  const serviceId = appointment?.service.id ?? '';
  /** User override; null means "follow the appointment / first available". */
  const [chosenDay, setChosenDay] = useState<string | null>(null);
  const [chosenTime, setChosenTime] = useState<string | null>(null);

  const dates = useQuery({
    ...availableDatesQueryOptions(serviceId, appointmentId),
    enabled: serviceId !== '',
  });
  const currentDay = appointment ? (businessDayOf(appointment.start) ?? '') : '';
  const day = chosenDay ?? pickAvailableDay(dates.data ?? [], currentDay);

  const slots = useQuery({
    ...availableSlotsQueryOptions(serviceId, day, appointmentId),
    enabled: serviceId !== '' && day !== '',
  });

  const currentTime = appointment ? (clockTimeOfInstant(appointment.start) ?? '') : '';
  const time = useMemo(() => {
    if (chosenTime !== null) return chosenTime;
    return pickAvailableTime(slots.data ?? [], currentTime);
  }, [chosenTime, slots.data, currentTime]);

  const save = useMutation({
    mutationFn: async () => {
      const slot = (slots.data ?? []).find((item) => item.time === time);
      if (!slot?.isAvailable || !day || !isClockTime(time)) throw new Error('appointmentRescheduleFailed');
      return rescheduleAppointment(queryClient, appointmentId, instantAt(day, time));
    },
    onSuccess: () => {
      onSuccess();
      void navigate({
        to: '/appointments/$appointmentId',
        params: { appointmentId },
        ignoreBlocker: true,
      });
    },
    onError: (error) => {
      onError(error);
    },
  });

  return {
    appointment,
    isLoading: detail.isPending,
    error: detail.isError ? detail.error : null,
    retry: () => {
      void detail.refetch();
    },
    goBack: () => {
      if (router.history.canGoBack()) router.history.back();
      else void navigate({ to: '/appointments/$appointmentId', params: { appointmentId }, replace: true });
    },
    day,
    setDay: (next: string) => {
      setChosenDay(next);
      setChosenTime(null);
    },
    time,
    setTime: (next: string) => {
      setChosenTime(next);
    },
    availableDates: dates.data ?? [],
    datesLoading: dates.isFetching,
    datesError: dates.isError ? dates.error : null,
    slots: slots.data ?? [],
    slotsLoading: slots.isFetching,
    slotsError: slots.isError ? slots.error : null,
    save: () => {
      save.mutate();
    },
    isSaving: save.isPending,
    canSave: Boolean(
      day && time && (slots.data ?? []).some((slot) => slot.time === time && slot.isAvailable),
    ),
  };
}
