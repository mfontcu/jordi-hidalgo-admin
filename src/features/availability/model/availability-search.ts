import { z } from 'zod';

import { isBusinessDay, type BusinessDay } from '@/shared/lib/business-time';

// Search parameters of `/schedule/availability`. Flutter kept service and day in the controller;
// the panel keeps them in the URL (ADR-003).

const text = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string().trim().min(1))
  .optional()
  .catch(undefined);

const dayParam = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string())
  .refine(isBusinessDay)
  .optional()
  .catch(undefined);

export const availabilitySearchSchema = z.object({
  serviceId: text,
  day: dayParam,
});

export type AvailabilitySearch = z.infer<typeof availabilitySearchSchema>;

export function searchWithService(search: AvailabilitySearch, serviceId: string | null): AvailabilitySearch {
  return { ...search, serviceId: serviceId?.trim() ? serviceId.trim() : undefined };
}

export function searchWithDay(search: AvailabilitySearch, day: BusinessDay): AvailabilitySearch {
  return { ...search, day };
}
