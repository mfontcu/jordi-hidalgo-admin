import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { businessToday, formatDay, type BusinessDay, type DateLocale } from '@/shared/lib/business-time';

import {
  availabilityDatesQueryOptions,
  availabilityServicesQueryOptions,
  availabilitySlotsQueryOptions,
} from '../api/availability.queries';
import {
  availabilitySummaryOf,
  calendarFirstDay,
  calendarLastDay,
  clampDay,
  defaultBookableDay,
  filterServices,
  formatDurationMinutes,
  isBookableDay,
  type AvailabilityService,
  type AvailabilitySlot,
} from '../model/availability';
import { searchWithDay, searchWithService, type AvailabilitySearch } from '../model/availability-search';

type Options = { locale: DateLocale; backLabel: string };

/**
 * Availability overview (`/schedule/availability`): public services, bookable days, and slots.
 * Selecting a free slot opens the appointment form with prefill.
 */
export function useAvailabilityOverview({ locale, backLabel }: Options) {
  const search = useSearch({ from: '/_authed/schedule/availability' });
  const navigate = useNavigate({ from: '/schedule/availability' });
  const queryClient = useQueryClient();
  const today = businessToday();
  const [serviceQuery, setServiceQuery] = useState('');
  const [showServiceSelector, setShowServiceSelector] = useState(false);

  const servicesQuery = useQuery(availabilityServicesQueryOptions());
  const services = servicesQuery.data ?? [];
  const firstService = services[0] ?? null;

  const selectedService = (() => {
    if (!search.serviceId) return firstService;
    return services.find((service) => service.id === search.serviceId) ?? null;
  })();

  // When services load and the URL has no service, pin the first one.
  useEffect(() => {
    if (search.serviceId || !firstService) return;
    void navigate({
      search: (previous) => searchWithService(previous, firstService.id),
      replace: true,
    });
  }, [search.serviceId, firstService, navigate]);

  const serviceId = selectedService?.id ?? '';
  const datesQuery = useQuery(availabilityDatesQueryOptions(serviceId));
  const bookableDays = datesQuery.data ?? [];

  const first = calendarFirstDay(today);
  const last = calendarLastDay(bookableDays, today);
  const selectedDay = (() => {
    if (search.day && isBookableDay(search.day, bookableDays)) {
      return clampDay(search.day, first, last);
    }
    if (datesQuery.isSuccess) {
      return clampDay(defaultBookableDay(bookableDays, today), first, last);
    }
    return clampDay(search.day ?? today, first, last);
  })();

  // Keep the URL day in sync once dates resolve.
  useEffect(() => {
    if (!datesQuery.isSuccess || !serviceId) return;
    if (search.day === selectedDay) return;
    void navigate({
      search: (previous) => searchWithDay(previous, selectedDay),
      replace: true,
    });
  }, [datesQuery.isSuccess, serviceId, search.day, selectedDay, navigate]);

  const slotsQuery = useQuery(availabilitySlotsQueryOptions(serviceId, selectedDay));
  const slots = slotsQuery.data ?? [];
  const summary = availabilitySummaryOf(slots, bookableDays);

  const filteredServices = filterServices(services, serviceQuery);

  const patchSearch = (next: (previous: AvailabilitySearch) => AvailabilitySearch) => {
    void navigate({ search: next, replace: true });
  };

  const selectService = (service: AvailabilityService | null) => {
    setShowServiceSelector(false);
    if (service) setServiceQuery(service.name);
    patchSearch((previous) => searchWithService(previous, service?.id ?? null));
  };

  const setSelectedDay = (day: BusinessDay) => {
    patchSearch((previous) => searchWithDay(previous, clampDay(day, first, last)));
  };

  const refresh = async () => {
    if (!serviceId) return;
    await queryClient.invalidateQueries({ queryKey: ['availability'] });
  };

  const openCreateForSlot = (slot: AvailabilitySlot) => {
    if (!selectedService || !slot.isAvailable) return;
    void navigate({
      to: '/appointments/form',
      search: {
        prefillServiceId: selectedService.id,
        prefillDate: selectedDay,
        prefillTime: slot.time,
        backLabel,
        sidebar: '/schedule/availability',
      },
    });
  };

  const contextLine = (() => {
    if (!selectedService) return null;
    const dateSummary = formatDay(selectedDay, locale, 'longDate');
    const duration = formatDurationMinutes(selectedService.durationMinutes);
    const range =
      summary.firstAvailableTime && summary.lastAvailableTime
        ? { fromTime: summary.firstAvailableTime, toTime: summary.lastAvailableTime }
        : null;
    return { dateSummary, duration, range, serviceName: selectedService.name };
  })();

  const isLoading =
    servicesQuery.isFetching || (Boolean(serviceId) && (datesQuery.isFetching || slotsQuery.isFetching));
  const error = servicesQuery.error ?? datesQuery.error ?? slotsQuery.error;

  return {
    today,
    first,
    last,
    services,
    filteredServices,
    selectedService,
    serviceQuery,
    setServiceQuery,
    showServiceSelector,
    setShowServiceSelector,
    selectService,
    clearService: () => {
      selectService(null);
      setServiceQuery('');
    },
    bookableDays,
    selectedDay,
    setSelectedDay,
    slots,
    summary,
    contextLine,
    isLoading,
    servicesLoading: servicesQuery.isLoading,
    error,
    refresh,
    retry: () => {
      void servicesQuery.refetch();
      void datesQuery.refetch();
      void slotsQuery.refetch();
    },
    openCreateForSlot,
    isBookable: (day: BusinessDay) => isBookableDay(day, bookableDays),
  };
}
