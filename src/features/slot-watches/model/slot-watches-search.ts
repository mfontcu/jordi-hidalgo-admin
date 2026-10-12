import { z } from 'zod';

import { isBusinessDay, type BusinessDay } from '@/shared/lib/business-time';

import type { SlotWatchStatus } from './slot-watch';

// Search parameters of `/schedule/slot-watches`. The date is sent to the backend; service, status,
// and the search are applied to the loaded list, as AdminSlotWatchesController does. An invalid
// value is dropped, never an error.

const text = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string().trim().min(1))
  .optional()
  .catch(undefined);

const day = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string())
  .refine(isBusinessDay)
  .optional()
  .catch(undefined);

export const slotWatchesSearchSchema = z.object({
  search: text,
  /** Salon day the list is loaded for. Missing means every open watch from today on. */
  date: day,
  service: text,
  status: z.enum(['active', 'held']).optional().catch(undefined),
  /** From 2 on; the first page leaves it out. */
  page: z
    .preprocess((value) => (typeof value === 'string' ? Number(value) : value), z.number().int().min(2))
    .optional()
    .catch(undefined),
});

export type SlotWatchesSearch = z.infer<typeof slotWatchesSearchSchema>;

export function searchWithText(search: SlotWatchesSearch, query: string): SlotWatchesSearch {
  const trimmed = query.trim();
  return { ...search, search: trimmed || undefined, page: undefined };
}

export function searchWithDate(search: SlotWatchesSearch, date: BusinessDay | null): SlotWatchesSearch {
  return { ...search, date: date ?? undefined, page: undefined };
}

export function searchWithService(search: SlotWatchesSearch, serviceId: string | null): SlotWatchesSearch {
  return { ...search, service: serviceId?.trim() ? serviceId.trim() : undefined, page: undefined };
}

export function searchWithStatus(
  search: SlotWatchesSearch,
  status: SlotWatchStatus | null,
): SlotWatchesSearch {
  return { ...search, status: status ?? undefined, page: undefined };
}

export function searchWithPage(search: SlotWatchesSearch, page: number): SlotWatchesSearch {
  return { ...search, page: page > 1 ? page : undefined };
}
