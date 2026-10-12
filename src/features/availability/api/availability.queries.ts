import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';
import { isBusinessDay, type BusinessDay } from '@/shared/lib/business-time';

import type { AvailabilityService, AvailabilitySlot } from '../model/availability';
import { availabilityKeys } from './availability.keys';

const STALE_TIME = 10_000;

/** Active public services (`GET /services`), sorted like Flutter's controller. */
export function availabilityServicesQueryOptions() {
  return queryOptions({
    queryKey: availabilityKeys.services(),
    queryFn: async ({ signal }): Promise<AvailabilityService[]> => {
      const result = unwrap(await apiClient.GET('/services', { signal }));
      const items = (Array.isArray(result) ? result : [])
        .filter((item) => item.isActive !== false)
        .map((item) => ({
          id: item.id ?? '',
          name: item.name ?? '',
          durationMinutes: item.durationMinutes ?? 0,
          categoryLabel: item.categoryDisplayName ?? item.categoryCode ?? '',
          displayOrder: item.displayOrder ?? 0,
        }));
      return items
        .filter((item) => item.id !== '')
        .sort((a, b) => {
          const byOrder = a.displayOrder - b.displayOrder;
          return byOrder !== 0 ? byOrder : a.name.localeCompare(b.name);
        });
    },
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

/** Bookable salon days for a service (`GET /availability/dates`). */
export function availabilityDatesQueryOptions(serviceId: string) {
  return queryOptions({
    queryKey: availabilityKeys.dates(serviceId),
    queryFn: async ({ signal }): Promise<BusinessDay[]> => {
      const result = unwrap(
        await apiClient.GET('/availability/dates', {
          params: { query: { serviceId } },
          signal,
        }),
      );
      return result.map((item) => item.date ?? '').filter(isBusinessDay);
    },
    staleTime: 0,
    enabled: serviceId.trim() !== '',
  });
}

/** Clock slots for a salon day (`GET /availability/slots`). */
export function availabilitySlotsQueryOptions(serviceId: string, day: BusinessDay) {
  return queryOptions({
    queryKey: availabilityKeys.slots(serviceId, day),
    queryFn: async ({ signal }): Promise<AvailabilitySlot[]> => {
      const result = unwrap(
        await apiClient.GET('/availability/slots', {
          params: { query: { serviceId, date: day } },
          signal,
        }),
      );
      return result.map((item) => ({
        time: item.time ?? '',
        isAvailable: item.isAvailable ?? false,
      }));
    },
    staleTime: 0,
    enabled: serviceId.trim() !== '' && day.trim() !== '',
  });
}
