import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useDebouncedText } from '@/shared/lib/use-debounced-text';
import { useGoBack } from '@/shared/lib/use-go-back';

import { createAppointment } from '../api/appointments.mutations';
import {
  availableDatesQueryOptions,
  availableSlotsQueryOptions,
  formClientQueryOptions,
  formServicesQueryOptions,
  formUsersQueryOptions,
} from '../api/appointments.queries';
import {
  appointmentFormDefaults,
  appointmentFormSchema,
  createInputOf,
  pickAvailableDay,
  pickAvailableTime,
  type AppointmentFormValues,
} from '../model/appointment-form';

type Options = {
  onSuccess: () => void;
  onError: (error: unknown) => void;
  onValidation: (message: 'appointmentFormSelectValidService' | 'appointmentFormNoSlotsDay') => void;
};

/**
 * Appointment create form: optional client (with create-client return), service, availability slots,
 * confirmed/pending, and internal notes. Prefill and `clientId`/`clientLabel` come from the URL.
 */
export function useAppointmentForm({ onSuccess, onError, onValidation }: Options) {
  const search = useSearch({ from: '/_authed/appointments/form' });
  const navigate = useNavigate({ from: '/appointments/form' });
  const queryClient = useQueryClient();
  const goBack = useGoBack('/appointments');
  const locked = search.lockInitialUser === true;
  const defaults = appointmentFormDefaults(search);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: defaults,
    mode: 'onSubmit',
  });

  const [pickedClient, setPickedClient] = useState<{ id: string; label: string } | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  /** Overrides after the user picks; null follows availability. */
  const [dayOverride, setDayOverride] = useState<string | null>(defaults.day || null);
  const [timeOverride, setTimeOverride] = useState<string | null>(defaults.time || null);
  const [serviceId, setServiceId] = useState(defaults.serviceId);
  const [confirmed, setConfirmed] = useState(defaults.confirmed);

  // URL `clientId`/`clientLabel` (from /clients/form) win until the user picks another client.
  const userId = pickedClient?.id ?? search.clientId ?? '';
  const clientLabel = pickedClient?.label ?? search.clientLabel ?? '';

  useEffect(() => {
    form.setValue('userId', userId, { shouldDirty: pickedClient !== null });
  }, [userId, pickedClient, form]);

  const services = useQuery(formServicesQueryOptions());

  const { text: clientSearchText, setText: setClientSearchText } = useDebouncedText(
    clientQuery,
    setClientQuery,
  );
  const { text: serviceSearchText, setText: setServiceSearchText } = useDebouncedText(
    serviceQuery,
    setServiceQuery,
  );

  const clients = useQuery({
    ...formUsersQueryOptions('customer', clientQuery),
    enabled: clientOpen,
    placeholderData: keepPreviousData,
  });
  const staff = useQuery({
    ...formUsersQueryOptions('admin', clientQuery),
    enabled: clientOpen,
    placeholderData: keepPreviousData,
  });

  const clientOptions = useMemo(() => {
    const byId = new Map<string, { id: string; title: string; subtitle?: string }>();
    for (const user of [...(clients.data ?? []), ...(staff.data ?? [])]) {
      if (!byId.has(user.id)) byId.set(user.id, user);
    }
    return [...byId.values()];
  }, [clients.data, staff.data]);

  const serviceOptions = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    return (services.data ?? [])
      .filter((service) => !q || service.name.toLowerCase().includes(q))
      .map((service) => ({
        id: service.id,
        title: service.name,
        subtitle: `${String(service.durationMinutes)} min`,
      }));
  }, [services.data, serviceQuery]);

  const selectedService = (services.data ?? []).find((service) => service.id === serviceId);

  const dates = useQuery({
    ...availableDatesQueryOptions(serviceId),
    enabled: serviceId.trim() !== '',
  });

  const day = dayOverride ?? pickAvailableDay(dates.data ?? [], search.prefillDate ?? '');

  const slots = useQuery({
    ...availableSlotsQueryOptions(serviceId, day),
    enabled: serviceId.trim() !== '' && day.trim() !== '',
  });

  const time = useMemo(() => {
    if (timeOverride !== null) return timeOverride;
    return pickAvailableTime(slots.data ?? [], search.prefillTime ?? '');
  }, [timeOverride, slots.data, search.prefillTime]);

  // Keep RHF in sync with the resolved day/time for submit validation.
  useEffect(() => {
    form.setValue('day', day, { shouldValidate: false });
  }, [day, form]);
  useEffect(() => {
    form.setValue('time', time, { shouldValidate: false });
  }, [time, form]);

  const clientDetail = useQuery(formClientQueryOptions(userId));

  const create = useMutation({
    mutationFn: (values: AppointmentFormValues) => {
      const built = createInputOf({ ...values, day, time }, slots.data ?? []);
      if (!built.ok) {
        const message =
          built.error === 'appointmentFormServiceRequired' ||
          built.error === 'appointmentFormSelectServiceFirst'
            ? 'appointmentFormSelectValidService'
            : built.error;
        onValidation(message);
        return Promise.reject(new Error(built.error));
      }
      return createAppointment(queryClient, built.input);
    },
    onSuccess: (created) => {
      onSuccess();
      void navigate({
        to: '/appointments/$appointmentId',
        params: { appointmentId: created.id },
        replace: true,
        ignoreBlocker: true,
      });
    },
    onError: (error) => {
      if (error instanceof Error && error.message.startsWith('appointmentForm')) return;
      onError(error);
    },
  });

  return {
    form,
    goBack,
    backLabel: search.backLabel ?? null,
    locked,
    clientLabel: clientLabel,
    clientOpen,
    setClientOpen,
    serviceOpen,
    setServiceOpen,
    clientSearchText,
    setClientSearchText,
    serviceSearchText,
    setServiceSearchText,
    clientOptions,
    serviceOptions,
    selectedService,
    day,
    time,
    availableDates: dates.data ?? [],
    datesLoading: dates.isFetching,
    datesError: dates.isError ? dates.error : null,
    slots: slots.data ?? [],
    slotsLoading: slots.isFetching,
    slotsError: slots.isError ? slots.error : null,
    clientDetail: clientDetail.data,
    clientDetailLoading: clientDetail.isPending && userId !== '',
    servicesError: services.isError ? services.error : null,
    servicesLoading: services.isPending,
    retryServices: () => {
      void services.refetch();
    },
    selectClient: (id: string, label: string) => {
      setPickedClient({ id, label });
      setClientOpen(false);
    },
    clearClient: () => {
      if (locked) return;
      setPickedClient({ id: '', label: '' });
    },
    selectService: (id: string) => {
      form.setValue('serviceId', id, { shouldDirty: true });
      setServiceId(id);
      setDayOverride(null);
      setTimeOverride(null);
      setServiceOpen(false);
    },
    confirmed,
    setConfirmed: (value: boolean) => {
      setConfirmed(value);
      form.setValue('confirmed', value, { shouldDirty: true });
    },
    setDay: (next: string) => {
      setDayOverride(next);
      setTimeOverride(null);
      form.setValue('day', next, { shouldDirty: true });
      form.setValue('time', '', { shouldDirty: true });
    },
    setTime: (next: string) => {
      setTimeOverride(next);
      form.setValue('time', next, { shouldDirty: true });
    },
    createClient: () => {
      void navigate({
        to: '/clients/form',
        search: {
          returnTo: 'appointmentForm',
          appointment: {
            clientId: undefined,
            clientLabel: undefined,
            backLabel: search.backLabel,
            lockInitialUser: search.lockInitialUser,
            prefillServiceId: form.getValues('serviceId') || search.prefillServiceId,
            prefillDate: day || search.prefillDate,
            prefillTime: time || search.prefillTime,
          },
        },
      });
    },
    submit: () => {
      void form.handleSubmit((values) => {
        create.mutate(values);
      })();
    },
    isSaving: create.isPending,
    isDirty: form.formState.isDirty,
  };
}
